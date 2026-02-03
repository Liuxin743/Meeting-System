<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="login-title">会议管理系统</h2>
      <el-form 
        :model="loginForm" 
        :rules="loginRules" 
        ref="loginFormRef" 
        label-width="80px"
        class="login-form"
      >
        <el-form-item label="账号" prop="account">
          <el-input 
            v-model="loginForm.account" 
            placeholder="请输入用户名"
            clearable
            size="large"
          ></el-input>
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码"
            clearable
            size="large"
            show-password
          ></el-input>
        </el-form-item>
        
        <el-form-item label="图形验证码" prop="code">
          <el-input 
            v-model="loginForm.code" 
            placeholder="请输入4位验证码"
            style="width: 60%;"
            clearable
            size="large"
          ></el-input>
          <div 
            class="code-img" 
            @click="refreshCode"
            :style="{ background: getRandomBgColor }"
          >
            {{ verifyCode }}
          </div>
        </el-form-item>
        
        <el-form-item class="login-btn-group">
          <el-button 
            type="primary" 
            @click="handleLogin" 
            class="login-btn"
            size="large"
            :loading="isLoading"
          >
            密码登录
          </el-button>
          <el-button 
            type="text" 
            @click="goToRegister"
            class="register-btn"
          >
            注册账号
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/userStore' // 导入Pinia用户仓库
import userApi from '@/api/userApi' // 导入封装的用户接口

// 路由实例
const router = useRouter()
// Pinia用户仓库
const userStore = useUserStore()

// 加载状态
const isLoading = ref(false)
// 表单引用
const loginFormRef = ref(null)

// 登录表单数据（匹配后端密码登录参数）
const loginForm = reactive({
  account: '',     // 账号（对应后端username）
  password: '',    // 密码
  code: '',        // 前端图形验证码
  rememberPwd: false // 是否记住密码
})

// 表单校验规则
const loginRules = reactive({
  account: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 2, max: 50, message: '账号长度为2-50个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不少于6位', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入图形验证码', trigger: 'blur' },
    { length: 4, message: '图形验证码长度为4位', trigger: 'blur' }
  ]
})

// 验证码相关
const verifyCode = ref('')
// 计算属性：随机背景色（属性，不是函数）
const getRandomBgColor = computed(() => {
  const colors = ['#f5f5f5', '#e8f4f8', '#fdf2f8', '#f5fafe', '#faf0f5']
  return colors[Math.floor(Math.random() * colors.length)]
})

// 生成4位随机验证码（函数）
const refreshCode = () => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  verifyCode.value = code
}

// 初始化验证码
refreshCode()

// 跳转到注册页
const goToRegister = () => {
  router.push('/register')
}

// 登录处理逻辑（匹配后端密码登录接口）
const handleLogin = async () => {
  // 1. 前端表单校验
  try {
    await loginFormRef.value.validate()
  } catch (err) {
    ElMessage.warning('请完善表单信息')
    return
  }

  // 2. 图形验证码本地校验
  if (loginForm.code.toLowerCase() !== verifyCode.value.toLowerCase()) {
    ElMessage.error('图形验证码错误，请重新输入')
    refreshCode()
    return
  }

  // 3. 调用后端密码登录接口
  isLoading.value = true
  try {
    // 构造后端需要的参数：username、password、rememberPwd
    const loginParams = {
      username: loginForm.account,
      password: loginForm.password,
      rememberPwd: loginForm.rememberPwd
    }

    // 调用封装的密码登录接口
    const res = await userApi.loginByPwd(loginParams)

    // 4. 登录成功处理（同步到Pinia仓库）
    if (res.code === 200) {
      // 存储Token和用户信息到Pinia
      userStore.setUserInfo({
        ...res.data.userInfo,
        token: res.data.token
      })

      ElMessage.success('登录成功！即将跳转到首页')
      
      // 跳转到首页
      setTimeout(() => {
        router.push('/home')
      }, 1000)
    } else {
      ElMessage.error(res.msg || '登录失败')
      refreshCode()
    }
  } catch (err) {
    console.error('登录请求失败：', err)
    ElMessage.error(
      err.response?.data?.msg || 
      '网络错误，请检查后端服务是否启动'
    )
    refreshCode()
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* 登录容器样式 */
.login-container {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
}

/* 登录卡片 */
.login-card {
  width: 420px;
  padding: 40px 30px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

/* 登录标题 */
.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 24px;
  font-weight: 600;
  letter-spacing: 1px;
}

/* 表单样式 */
.login-form {
  margin-top: 20px;
}

/* 验证码图片 */
.code-img {
  display: inline-block;
  width: 110px;
  height: 44px;
  line-height: 44px;
  text-align: center;
  border-radius: 6px;
  margin-left: 10px;
  cursor: pointer;
  font-size: 18px;
  letter-spacing: 3px;
  color: #666;
  user-select: none;
  font-weight: 600;
}

/* 按钮组 */
.login-btn-group {
  margin-top: 10px;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
}

/* 注册按钮 */
.register-btn {
  margin-top: 10px;
  padding: 0;
  color: #667eea;
}
</style>