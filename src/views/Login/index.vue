<template>
  <div class="el-login-container">
    <div class="el-login-card">
      <div class="el-login-header">
        <h2 class="el-login-title">欢迎登录</h2>
        <p class="el-login-subtitle">高效协作，轻松会议</p>
      </div>

      <div class="el-login-tabs">
        <div
          class="el-tab-item"
          :class="{ active: loginType === 'phone' }"
          @click="switchLoginType('phone')"
        >
          验证码登录
        </div>
        <div
          class="el-tab-item"
          :class="{ active: loginType === 'password' }"
          @click="switchLoginType('password')"
        >
          密码登录
        </div>
      </div>

      <el-form
        :model="loginForm"
        ref="loginFormRef"
        label-width="0px"
        class="el-login-form"
      >
        <template v-if="loginType === 'phone'">
          <el-form-item prop="phone">
            <el-input
              v-model="loginForm.phone"
              placeholder="请输入手机号"
              clearable
              size="large"
              class="el-login-input"
            >
              <template #prefix>
                <el-icon><Phone /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="smsCode">
            <el-input
              v-model="loginForm.smsCode"
              placeholder="请输入6位验证码"
              clearable
              size="large"
              maxlength="6"
              class="el-login-input"
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
        </template>

        <template v-else>
          <el-form-item prop="account">
            <el-input
              v-model="loginForm.account"
              placeholder="手机号/用户名"
              clearable
              size="large"
              class="el-login-input"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              clearable
              show-password
              size="large"
              class="el-login-input"
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
            </el-input>
          </el-form-item>
        </template>
      </el-form>

      <el-button
        type="primary"
        size="large"
        class="el-login-submit-btn"
        :loading="isLoading"
        @click="handleLogin"
      >
        登录
      </el-button>

      <el-button
        type="success"
        size="large"
        class="el-wx-login-btn"
        @click="handleMockWxLogin"
      >
        <el-icon><Wechat /></el-icon>
        微信一键登录（演示）
      </el-button>

      <div class="el-register-link" @click="goToRegister">
        还没有账号？<span class="el-link-text">立即注册</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { sendCode, loginByPhone, login } from '@/api/user.js'

const router = useRouter()

const loginType = ref('phone')
const isLoading = ref(false)
const codeCountDown = ref(0)
const loginFormRef = ref(null)
let countDownTimer = null

const loginForm = reactive({
  phone: '',
  smsCode: '',
  account: '',
  password: ''
})

const loginRules = reactive({})

watch(loginType, (newType) => {
  if (newType === 'phone' && loginForm.account) {
    if (/^1[3-9]\d{9}$/.test(loginForm.account)) {
      loginForm.phone = loginForm.account
    }
    loginForm.password = ''
  } else if (newType === 'password' && loginForm.phone) {
    loginForm.account = loginForm.phone
    loginForm.smsCode = ''
  }
})

const switchLoginType = (type) => {
  loginType.value = type
}

const getSmsCode = async () => {
  if (loginType.value !== 'phone') return

  const phone = loginForm.phone.trim()
  if (!phone) return ElMessage.warning('请输入手机号')
  if (!/^1[3-9]\d{9}$/.test(phone)) return ElMessage.warning('手机号格式错误')

  if (codeCountDown.value > 0) return

  isLoading.value = true
  try {
    const res = await sendCode(phone)
    codeCountDown.value = 60
    startCountDown()
    ElMessage.success('验证码已发送')
    if (res.code) console.log('Mock 验证码：', res.code)
  } catch (err) {
    ElMessage.error('发送验证码失败')
  } finally {
    isLoading.value = false
  }
}

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

const handleLogin = async () => {
  let loginParams = {}

  if (loginType.value === 'phone') {
    const phone = loginForm.phone.trim()
    const code = loginForm.smsCode.trim()

    if (!phone || !code) return ElMessage.warning('请填写完整信息')

    loginParams = { phone, code }
  } else {
    const account = loginForm.account.trim()
    const password = loginForm.password.trim()

    if (!account || !password) return ElMessage.warning('请填写完整信息')

    loginParams = { account, password }
  }

  isLoading.value = true
  try {
    let res
    if (loginType.value === 'phone') {
      res = await loginByPhone(loginParams)
    } else {
      res = await login(loginParams)
    }

    if (res && res.token) {
      localStorage.setItem('token', res.token) 
      if (res.user) {
        localStorage.setItem('userInfo', JSON.stringify(res.user))
      }

      ElMessage.success('登录成功！即将跳转到首页')

      await router.push('/home')

      setTimeout(() => {
        window.location.reload()
      }, 500)
    } else {
      ElMessage.error('登录失败：未返回 Token')
    }
  } catch (err) {
    ElMessage.error('登录失败，请稍后重试')
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

const handleMockWxLogin = () => {
  ElMessage.info('进入微信登录...')
  setTimeout(() => {
    const mockUser = {
      id: 888,
      username: 'wx_test',
      nickname: '微信用户',
      phone: '13800008888'
    }
    localStorage.setItem('token', 'mock_wx_token_888')
    localStorage.setItem('userInfo', JSON.stringify(mockUser))

    ElMessage.success('登录成功！')
    router.push('/home')
  }, 1500)
}

const goToRegister = () => {
  router.push('/register')
}

onUnmounted(() => {
  if (countDownTimer) clearInterval(countDownTimer)
})
</script>

<style scoped>
/* 样式保持你的不变，我不再重复 */
.el-login-container {
  width: 100vw;
  height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  box-sizing: border-box;
}

.el-login-card {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 16px;
  padding: 40px 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
}

.el-login-header {
  text-align: center;
  margin-bottom: 30px;
}

.el-login-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.el-login-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.el-login-tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
}

.el-tab-item {
  font-size: 16px;
  color: #909399;
  padding: 0 20px 10px;
  cursor: pointer;
  position: relative;
  margin: 0 10px;
}

.el-tab-item.active {
  color: #165DFF;
  font-weight: 600;
}

.el-tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 3px;
  background-color: #165DFF;
  border-radius: 2px;
}

.el-login-form {
  margin-bottom: 20px;
}

.el-login-input {
  width: 100%;
  margin-bottom: 16px;
  --el-input-bg-color: #f8f9fa;
  --el-input-border-radius: 8px;
}

.el-sms-code-btn {
  padding: 0 12px;
  height: 32px;
  --el-button-border-radius: 6px;
}

.el-login-submit-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  --el-button-border-radius: 8px;
  --el-button-bg-color: #165DFF;
  margin-bottom: 16px;
}

.el-wx-login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  --el-button-border-radius: 8px;
  --el-button-bg-color: #07c160;
  margin-bottom: 20px;
}

.el-register-link {
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