<template>
  <div class="change-pwd-container">
    <!-- 返回箭头 -->
    <div class="back-btn" @click="goBack">
      <el-icon size="20" color="#333">
        <ArrowLeft />
      </el-icon>
    </div>

    <h2 class="page-title">修改密码</h2>

    <div class="form-container">
      <!-- 旧密码 -->
      <div class="form-item">
        <label class="form-label">旧密码</label>
        <div class="pwd-wrap">
          <input
            v-model="pwdForm.oldPwd"
            :type="oldPwdVisible ? 'text' : 'password'"
            class="form-input"
            placeholder="请输入旧密码"
          />
          <el-icon 
            class="eye-icon" 
            @click="oldPwdVisible = !oldPwdVisible"
          >
            <component :is="oldPwdVisible ? EyeOff : Eye" />
          </el-icon>
        </div>
      </div>

      <!-- 新密码 -->
      <div class="form-item">
        <label class="form-label">新密码</label>
        <div class="pwd-wrap">
          <input
            v-model="pwdForm.newPwd"
            :type="newPwdVisible ? 'text' : 'password'"
            class="form-input"
            placeholder="请输入新密码"
          />
          <el-icon 
            class="eye-icon" 
            @click="newPwdVisible = !newPwdVisible"
          >
            <component :is="newPwdVisible ? EyeOff : Eye" />
          </el-icon>
        </div>
        <p class="pwd-tip">密码长度为6-20位，建议包含字母和数字</p>
      </div>

      <!-- 确认密码 -->
      <div class="form-item">
        <label class="form-label">确认密码</label>
        <div class="pwd-wrap">
          <input
            v-model="pwdForm.confirmPwd"
            :type="confirmPwdVisible ? 'text' : 'password'"
            class="form-input"
            placeholder="请再次输入新密码"
          />
          <el-icon 
            class="eye-icon" 
            @click="confirmPwdVisible = !confirmPwdVisible"
          >
            <component :is="confirmPwdVisible ? EyeOff : Eye" />
          </el-icon>
        </div>
      </div>

      <!-- 确认修改按钮 -->
      <button 
        class="confirm-btn" 
        @click="handleChangePwd"
        :disabled="!pwdForm.oldPwd || !pwdForm.newPwd || !pwdForm.confirmPwd"
      >
        确认修改
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus' // 补全导入
import userApi from "@/api/userApi"; // 只去掉大括号，没有 * as

const router = useRouter()

// 表单数据
const pwdForm = reactive({
  oldPwd: '',
  newPwd: '',
  confirmPwd: ''
})

// 密码可见性
const oldPwdVisible = ref(false)
const newPwdVisible = ref(false)
const confirmPwdVisible = ref(false)

const goBack = () => {
  router.back()
}

// 提交修改密码
const handleChangePwd = async () => {
  // 校验新密码和确认密码是否一致
  if (pwdForm.newPwd !== pwdForm.confirmPwd) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }

  // 校验新密码长度
  if (pwdForm.newPwd.length < 6 || pwdForm.newPwd.length > 20) {
    ElMessage.warning('密码长度应为6-20位')
    return
  }

  try {
    // 调用后端修改密码接口
    await userApi.changePassword({
      oldPassword: pwdForm.oldPwd,
      newPassword: pwdForm.newPwd
    })
    
    ElMessage.success('密码修改成功，请重新登录')
    // 清除本地存储（强制重新登录）
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    
    // 跳转到登录页
    setTimeout(() => {
      router.push('/login')
    }, 1500)
  } catch (err) {
    // 优化：捕获具体错误信息
    const errMsg = err.response?.data?.message || '密码修改失败，旧密码可能不正确'
    ElMessage.error(errMsg)
  }
}
</script>

<style scoped>
.change-pwd-container {
  min-height: 100vh;
  background-color: #ffffff; /* 改为全白背景 */
  padding: 20px;
  position: relative;
  max-width: 600px;
  margin: 0 auto;
}

.back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  cursor: pointer;
}

.page-title {
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 30px 0 40px;
}

.form-container {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  padding: 20px;
}

.form-item {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.pwd-wrap {
  display: flex;
  align-items: center;
  position: relative;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: #1989fa;
}

.eye-icon {
  position: absolute;
  right: 16px;
  font-size: 18px;
  color: #c8c9cc;
  cursor: pointer;
}

.pwd-tip {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.confirm-btn {
  width: 100%;
  padding: 14px 0;
  background-color: #1989fa;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.confirm-btn:disabled {
  background-color: #c8c9cc;
  cursor: not-allowed;
}

.confirm-btn:hover:not(:disabled) {
  opacity: 0.9;
}
</style>