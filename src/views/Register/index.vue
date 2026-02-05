<template>
  <div class="el-register-container">
    <div class="el-register-card">
      <!-- 注册头部 -->
      <div class="el-register-header">
        <h2 class="el-register-title">注册新账号</h2>
        <p class="el-register-subtitle">欢迎加入会议系统，开启高效协作</p>
      </div>

      <!-- 注册表单 -->
      <el-form 
        :model="registerForm" 
        :rules="registerRules" 
        ref="registerFormRef" 
        label-width="0px"
        class="el-register-form"
      >
        <!-- 手机号 -->
        <el-form-item prop="phone">
          <el-input 
            v-model="registerForm.phone" 
            placeholder="请输入手机号" 
            clearable
            size="large"
            class="el-register-input"
          >
            <template #prefix>
              <el-icon><Phone /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 短信验证码 -->
        <el-form-item prop="smsCode">
          <el-input 
            v-model="registerForm.smsCode" 
            placeholder="请输入6位验证码" 
            clearable
            size="large"
            maxlength="6"
            class="el-register-input"
          >
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
            <template #suffix>
              <el-button 
                type="primary" 
                size="small" 
                :disabled="codeCountDown > 0"
                @click="getSmsCode"
                class="el-sms-code-btn"
              >
                {{ codeCountDown > 0 ? `${codeCountDown}s后重新获取` : '获取验证码' }}
              </el-button>
            </template>
          </el-input>
        </el-form-item>

        <!-- 设置密码 -->
        <el-form-item prop="password">
          <el-input 
            v-model="registerForm.password" 
            type="password" 
            placeholder="请设置6-20位密码" 
            clearable
            show-password
            size="large"
            class="el-register-input"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 确认密码 -->
        <el-form-item prop="confirmPassword">
          <el-input 
            v-model="registerForm.confirmPassword" 
            type="password" 
            placeholder="请再次确认密码" 
            clearable
            show-password
            size="large"
            class="el-register-input"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
      </el-form>

      <!-- 注册按钮 -->
      <el-button 
        type="primary" 
        size="large" 
        class="el-register-submit-btn"
        :loading="isLoading"
        @click="handleRegister"
      >
        立即注册
      </el-button>

      <!-- 登录链接 -->
      <div class="el-login-link" @click="goToLogin">
        已有账号？<span class="el-link-text">去登录</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { sendCode, register } from '@/api/user.js'

// 路由实例
const router = useRouter()

const isLoading = ref(false) 
const codeCountDown = ref(0) // 验证码倒计时
const registerFormRef = ref(null) // 表单引用
let countDownTimer = null // 倒计时定时器

// 注册表单数据
const registerForm = reactive({
  phone: '',
  smsCode: '',
  password: '',
  confirmPassword: ''
})

// 表单校验规则
const registerRules = reactive({
  // 手机号
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确格式的手机号', trigger: 'blur' }
  ],
  // 短信验证码
  smsCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { length: 6, message: '验证码为6位数字', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '验证码仅支持数字', trigger: 'blur' }
  ],
  // 密码
  password: [
    { required: true, message: '请设置密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_\-@.]+$/, message: '密码仅支持字母、数字和特殊字符(_-@.)', trigger: 'blur' }
  ],
  // 确认密码
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ]
})

// 获取短信验证码
const getSmsCode = async () => {
  // 前端校验手机号
  try {
    await registerFormRef.value.validateField('phone')
  } catch (err) {
    ElMessage.warning('请先输入正确格式的手机号')
    return
  }

  // 避免重复发送
  if (codeCountDown.value > 0) return

  // 发送验证码
  isLoading.value = true
  try {
    const res = await sendCode(registerForm.phone)
    // 启动倒计时
    codeCountDown.value = 60
    startCountDown()

    // 模拟环境提示验证码
    if (res.code) {
      ElMessage.success(`验证码已发送，您的验证码是：${res.code}`)
      console.log('Mock验证码:', res.code)
    } else {
      ElMessage.success('验证码已发送，请注意查收')
    }
  } catch (error) {
    ElMessage.error('验证码发送失败，请稍后重试')
    console.error('发送验证码失败：', error)
  } finally {
    isLoading.value = false
  }
}

// 启动验证码倒计时
const startCountDown = () => {
  if (countDownTimer) clearInterval(countDownTimer)

  countDownTimer = setInterval(() => {
    if (codeCountDown.value <= 1) {
      clearInterval(countDownTimer)
      codeCountDown.value = 0
    } else {
      codeCountDown.value--
    }
  }, 1000)
}

// 处理注册逻辑
const handleRegister = async () => {
  // 全表单校验
  try {
    await registerFormRef.value.validate()
  } catch (err) {
    ElMessage.warning('请完善表单信息并确保格式正确')
    return
  }

  // 调用后端注册接口
  isLoading.value = true
  try {
    const res = await register({
      phone: registerForm.phone,
      code: registerForm.smsCode,
      password: registerForm.password,
      confirmPassword: registerForm.confirmPassword
    })

    // 注册成功：提示 + 跳转登录页
    ElMessage.success('注册成功！即将跳转到登录页')
    setTimeout(() => {
      router.push('/login') 
    }, 1500)
  } catch (error) {
    ElMessage.error(error.response?.data?.msg || '注册失败，请稍后重试')
    console.error('注册失败：', error)
  } finally {
    isLoading.value = false
  }
}

// 跳转到登录页
const goToLogin = () => {
  router.push('/login')
}

// 组件销毁时清除定时器
onMounted(() => {
  return () => {
    if (countDownTimer) clearInterval(countDownTimer)
  }
})
</script>

<style scoped>
/* 注册容器 */
.el-register-container {
  width: 100vw;
  height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  box-sizing: border-box;
}

/* 注册卡片 */
.el-register-card {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 16px;
  padding: 40px 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
}

/* 注册头部 */
.el-register-header {
  text-align: center;
  margin-bottom: 30px;
}

.el-register-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.el-register-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

/* 注册表单 */
.el-register-form {
  margin-bottom: 20px;
}

.el-register-input {
  width: 100%;
  margin-bottom: 16px;
  --el-input-bg-color: #f8f9fa;
  --el-input-border-radius: 8px;
}

/* 验证码按钮 */
.el-sms-code-btn {
  padding: 0 12px;
  height: 32px;
  --el-button-border-radius: 6px;
}

/* 注册按钮 */
.el-register-submit-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  --el-button-border-radius: 8px;
  --el-button-bg-color: #165DFF;
  margin-bottom: 20px;
}

/* 登录链接 */
.el-login-link {
  text-align: center;
  font-size: 14px;
  color: #666;
  cursor: pointer;
}

.el-link-text {
  color: #165DFF;
  font-weight: 500;
  margin-left: 4px;
}
</style>