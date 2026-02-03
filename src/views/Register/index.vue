<template>
  <div class="register-container">
    <div class="register-card">
      <h2 class="register-title">会议管理系统</h2>
      <el-form 
        :model="registerForm" 
        :rules="registerRules" 
        ref="registerFormRef" 
        label-width="80px"
        class="register-form"
      >
        <!-- 用户名（对应后端必填username） -->
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="registerForm.username" 
            placeholder="请输入用户名"
            clearable
            size="large"
          ></el-input>
        </el-form-item>
        
        <!-- 密码 -->
        <el-form-item label="设置密码" prop="password">
          <el-input 
            v-model="registerForm.password" 
            type="password" 
            placeholder="请设置6-20位密码"
            clearable
            size="large"
            show-password
          ></el-input>
        </el-form-item>
        
        <!-- 确认密码 -->
        <el-form-item label="确认密码" prop="confirmPwd">
          <el-input 
            v-model="registerForm.confirmPwd" 
            type="password" 
            placeholder="请再次输入密码"
            clearable
            size="large"
            show-password
          ></el-input>
        </el-form-item>
        
        <!-- 按钮组 -->
        <el-form-item class="register-btn-group">
          <el-button 
            type="primary" 
            @click="handleRegister" 
            class="register-btn"
            size="large"
            :loading="isLoading"
          >
            注册
          </el-button>
          <el-button 
            type="text" 
            @click="goToLogin"
            class="login-btn"
          >
            已有账号？去登录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import userApi from "@/api/userApi"; // 导入封装的用户接口

const router = useRouter()
const isLoading = ref(false)
const registerFormRef = ref(null)

// 注册表单数据（严格匹配后端注册接口参数）
const registerForm = reactive({
  username: '',     // 用户名（后端必填）
  password: '',     // 密码（后端必填）
  confirmPwd: ''    // 确认密码（后端必填）
})

// 表单校验规则（匹配后端逻辑）
const registerRules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 50, message: '用户名长度为2-50个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20位', trigger: 'blur' }
  ],
  confirmPwd: [
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

// 跳转到登录页
const goToLogin = () => {
  router.push('/login')
}

// 注册处理逻辑（匹配后端注册接口）
const handleRegister = async () => {
  // 1. 前端表单校验
  try {
    await registerFormRef.value.validate()
  } catch (err) {
    ElMessage.warning('请完善表单信息')
    return
  }

  isLoading.value = true
  try {
    // 2. 调用后端注册接口（参数严格匹配后端）
    const res = await userApi.register({
      username: registerForm.username,
      password: registerForm.password,
      confirmPwd: registerForm.confirmPwd
    })

    // 3. 注册成功处理
    if (res.code === 200) {
      ElMessage.success(res.msg || '注册成功！即将跳转到登录页')
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } else {
      ElMessage.error(res.msg || '注册失败')
    }
  } catch (err) {
    console.error('注册请求失败：', err)
    ElMessage.error(
      err.response?.data?.msg || 
      '网络错误，请检查后端服务是否启动'
    )
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.register-container {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
}

.register-card {
  width: 420px;
  padding: 40px 30px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.register-title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 24px;
  font-weight: 600;
  letter-spacing: 1px;
}

.register-form {
  margin-top: 20px;
}

/* 按钮组 */
.register-btn-group {
  margin-top: 10px;
}
.register-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border: none;
}
.login-btn {
  margin-top: 10px;
  padding: 0;
  color: #667eea;
}
</style>