import request from '../utils/request';

// 1. 用户注册
export const register = (data) => {
  return request.post('/user/register', data);
};

// 2. 密码登录
export const loginByPwd = (data) => {
  return request.post('/user/loginByPwd', data);
};

// 3. 验证码登录
export const loginByCode = (data) => {
  return request.post('/user/loginByCode', data);
};

// 4. 获取验证码
export const getVerifyCode = (data) => {
  return request.post('/user/getVerifyCode', data);
};

// 5. 获取个人信息（新增）
export const getProfile = (data) => {
  return request.post('/user/getProfile', data);
};

// 6. 更新个人信息+头像上传
export const updateProfile = (data) => {
  return request.post('/user/updateProfile', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// 导出所有方法（方便前端调用）
export default {
  register,
  loginByPwd,
  loginByCode,
  getVerifyCode,
  getProfile,
  updateProfile
};