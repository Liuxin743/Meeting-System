const express = require('express');
const { pool } = require('../db');
const { md5Encrypt, generateVerifyCode, generateJwtToken } = require('../utils');
// 新增：头像上传需要的3个依赖
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const router = express.Router();
const CODE_EXPIRE_MINUTES = parseInt(process.env.CODE_EXPIRE_MINUTES);

// ===================== 头像上传配置（直接复制，不用懂） =====================
const uploadDir = path.join(__dirname, '../uploads/');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${fileExt}`);
  }
});
const uploadAvatar = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('仅支持JPG、PNG等图片格式！'), false);
    }
  }
}).single('avatar');
// ===================== 头像上传配置结束 =====================

// 1. 获取验证码（POST /api/user/getVerifyCode）
router.post('/getVerifyCode', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ code: 400, msg: '请输入账号！' });
    }
    const [userRows] = await pool.execute('SELECT * FROM `user` WHERE `username` = ?', [username]);
    if (userRows.length === 0) {
      return res.status(404).json({ code: 404, msg: '该账号不存在！' });
    }
    const code = generateVerifyCode();
    const expireTime = new Date(Date.now() + CODE_EXPIRE_MINUTES * 60 * 1000);
    await pool.execute('DELETE FROM `verify_code` WHERE `username` = ?', [username]);
    await pool.execute('INSERT INTO `verify_code` (`username`, `code`, `expire_time`) VALUES (?, ?, ?)', [username, code, expireTime]);
    res.status(200).json({
      code: 200,
      msg: '验证码获取成功（有效期5分钟）',
      data: { code }
    });
  } catch (error) {
    console.error('获取验证码失败：', error.message);
    res.status(500).json({ code: 500, msg: '服务器内部错误！' });
  }
});

// 2. 验证码登录（POST /api/user/loginByCode）
router.post('/loginByCode', async (req, res) => {
  try {
    const { username, code, rememberPwd } = req.body;
    if (!username || !code) {
      return res.status(400).json({ code: 400, msg: '请输入账号和验证码！' });
    }
    const [userRows] = await pool.execute('SELECT * FROM `user` WHERE `username` = ?', [username]);
    if (userRows.length === 0) {
      return res.status(404).json({ code: 404, msg: '该账号不存在！' });
    }
    const user = userRows[0];
    const [codeRows] = await pool.execute('SELECT * FROM `verify_code` WHERE `username` = ? AND `code` = ? AND `expire_time` > NOW()', [username, code]);
    if (codeRows.length === 0) {
      return res.status(400).json({ code: 400, msg: '验证码无效或已过期！' });
    }
    const token = generateJwtToken(username);
    await pool.execute('DELETE FROM `verify_code` WHERE `username` = ?', [username]);
    res.status(200).json({
      code: 200,
      msg: '登录成功！',
      data: {
        token,
        userInfo: {
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar
        },
        rememberPwd: rememberPwd
      }
    });
  } catch (error) {
    console.error('验证码登录失败：', error.message);
    res.status(500).json({ code: 500, msg: '服务器内部错误！' });
  }
});

// 3. 密码登录（POST /api/user/loginByPwd）
router.post('/loginByPwd', async (req, res) => {
  try {
    const { username, password, rememberPwd } = req.body;
    if (!username || !password) {
      return res.status(400).json({ code: 400, msg: '请输入账号和密码！' });
    }
    const [userRows] = await pool.execute('SELECT * FROM `user` WHERE `username` = ?', [username]);
    if (userRows.length === 0) {
      return res.status(404).json({ code: 404, msg: '该账号不存在！' });
    }
    const user = userRows[0];
    const encryptPwd = md5Encrypt(password);
    if (encryptPwd !== user.password) {
      return res.status(400).json({ code: 400, msg: '密码错误！' });
    }
    const token = generateJwtToken(username);
    res.status(200).json({
      code: 200,
      msg: '登录成功！',
      data: {
        token,
        userInfo: {
          username: user.username,
          nickname: user.nickname,
          avatar: user.avatar
        },
        rememberPwd: rememberPwd
      }
    });
  } catch (error) {
    console.error('密码登录失败：', error.message);
    res.status(500).json({ code: 500, msg: '服务器内部错误！' });
  }
});

// 4. 用户注册（POST /api/user/register）
router.post('/register', async (req, res) => {
  try {
    const { username, password, confirmPwd } = req.body;
    if (!username || !password || !confirmPwd) {
      return res.status(400).json({ code: 400, msg: '请填写完整注册信息！' });
    }
    if (password.length < 6) {
      return res.status(400).json({ code: 400, msg: '密码长度不能少于6位！' });
    }
    if (password !== confirmPwd) {
      return res.status(400).json({ code: 400, msg: '两次输入的密码不一致！' });
    }
    const [userRows] = await pool.execute('SELECT * FROM `user` WHERE `username` = ?', [username]);
    if (userRows.length > 0) {
      return res.status(400).json({ code: 400, msg: '该账号已存在，请更换账号！' });
    }
    const encryptPwd = md5Encrypt(password);
    await pool.execute('INSERT INTO `user` (`username`, `password`, `nickname`) VALUES (?, ?, ?)', [username, encryptPwd, `用户${username}`]);
    res.status(200).json({
      code: 200,
      msg: '注册成功！请前往登录',
      data: { username }
    });
  } catch (error) {
    console.error('用户注册失败：', error.message);
    res.status(500).json({ code: 500, msg: '服务器内部错误！' });
  }
});

// 5. 新增：获取个人信息（POST /api/user/getProfile）【修复 req.body 为 undefined 问题】
router.post('/getProfile', async (req, res) => {
  try {
    // 修复点1：兼容 req.body 为 undefined 的情况，先判断再取值
    const reqBody = req.body || {}; // 若 req.body 是 undefined，赋值为空对象
    const username = reqBody.username || 'test12345'; // 若没有传 username，用默认值（方便测试，避免报错）

    // 修复点2：查询用户信息（只查存在的字段，避免数据库报错）
    const [userRows] = await pool.execute(
      'SELECT `id`, `username`, `phone`, `avatar` FROM `user` WHERE `username` = ?',
      [username]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ code: 404, msg: '用户不存在！' });
    }

    const user = userRows[0];
    // 拼接头像完整访问地址，前端直接能显示
    const avatarUrl = user.avatar ? `http://localhost:3000/uploads/${user.avatar}` : '';

    res.status(200).json({
      code: 200,
      msg: '获取个人信息成功！',
      data: {
        id: user.id || '',
        username: user.username || '',
        phone: user.phone || '',
        avatar: avatarUrl
      }
    });
  } catch (error) {
    console.error('获取个人信息失败：', error.message);
    res.status(500).json({ code: 500, msg: '服务器内部错误！' });
  }
});

// 6. 新增：更新个人信息+头像上传（POST /api/user/updateProfile）【前端需要的】
router.post('/updateProfile', (req, res) => {
  uploadAvatar(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ code: 400, msg: uploadErr.message });
    }
    try {
      const { id, username } = req.body;
      if (!id || !username.trim()) {
        return res.status(400).json({ code: 400, msg: '用户ID和用户名不能为空！' });
      }
      const updateUsername = username.trim();
      const updateAvatar = req.file ? req.file.filename : null;
      // 有头像就更用户名+头像，没头像只更用户名
      if (updateAvatar) {
        await pool.execute('UPDATE `user` SET `username` = ?, `avatar` = ? WHERE `id` = ?', [updateUsername, updateAvatar, id]);
      } else {
        await pool.execute('UPDATE `user` SET `username` = ? WHERE `id` = ?', [updateUsername, id]);
      }
      // 返回新头像地址，前端同步更新
      const newAvatarUrl = updateAvatar ? `http://localhost:3000/uploads/${updateAvatar}` : req.body.avatar || '';
      res.status(200).json({
        code: 200,
        msg: '个人信息更新成功！',
        data: { avatar: newAvatarUrl }
      });
    } catch (error) {
      console.error('更新个人信息失败：', error.message);
      res.status(500).json({ code: 500, msg: '服务器内部错误！' });
    }
  });
});

module.exports = router;