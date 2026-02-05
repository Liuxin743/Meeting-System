<template>
  <div class="page-wrapper">
    <div class="security-container">
      <!-- 返回箭头 -->
      <div class="back-btn" @click="goBack" :disabled="isNavigating">
        <el-icon><ArrowLeft /></el-icon>
      </div>

      <h2 class="page-title">安全中心</h2>

      <!-- 功能列表 -->
      <div class="security-list">
        <!-- 更换手机号 -->
        <div class="security-item" @click="goToChangePhone" :class="{ disabled: isNavigating }">
          <el-icon class="item-icon"><Phone /></el-icon>
          <span class="item-text">更换手机号</span>
          <!-- 手机号绑定状态标签-->
          <span class="item-tag" v-if="userPhone">已绑定</span>
          <el-icon class="item-arrow"><ArrowRight /></el-icon>
        </div>

        <!-- 修改密码 -->
        <div class="security-item" @click="goToChangePwd" :class="{ disabled: isNavigating }">
          <el-icon class="item-icon"><Lock /></el-icon>
          <span class="item-text">修改密码</span>
          <!-- 密码强度标签） -->
          <span class="item-tag" v-if="pwdStrength">${pwdStrength}</span>
          <el-icon class="item-arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/userStore'
import userApi from '@/api/userApi'

const router = useRouter()
const userStore = useUserStore()

// 核心状态变量
const isNavigating = ref(false) 
const pwdStrength = ref('') 
const userPhone = computed(() => {
  return userStore.userInfo.phone || ''
})

onMounted(async () => {
  const token = localStorage.getItem('token')
  const userInfo = userStore.userInfo
  if (!token || !userInfo.id) {
    ElMessage.warning('请先登录再访问安全中心')
    router.push({
      path: '/login',
      query: { redirect: '/security' }
    })
    return
  }

  try {
    const res = await userApi.getSecurityInfo({
      userId: userInfo.id
    })
    if (res && res.code === 200) {
      // 赋值密码强度
      pwdStrength.value = res.data?.pwdStrength || ''
    }
  } catch (err) {
    console.warn('获取用户安全信息失败（可选接口）：', err)
    // 该接口为可选
  }
})

// 返回上一级
const goBack = () => {
  if (isNavigating.value) return
  isNavigating.value = true
  try {
    router.back()
  } catch (err) {
    router.push('/mine')
  } finally {
    // 重置导航状态
    setTimeout(() => {
      isNavigating.value = false
    }, 300)
  }
}

// 跳转到更换手机号页
const goToChangePhone = () => {
  if (isNavigating.value) return
  isNavigating.value = true
  router.push('/security/change-phone').finally(() => {
    setTimeout(() => {
      isNavigating.value = false
    }, 300)
  })
}

// 跳转到修改密码页
const goToChangePwd = () => {
  if (isNavigating.value) return
  isNavigating.value = true
  router.push('/security/change-password').finally(() => {
    setTimeout(() => {
      isNavigating.value = false
    }, 300)
  })
}
</script>

<style scoped>
.page-wrapper {
  max-width: 600px; 
  min-height: 100vh;
  background-color: #ffffff; 
  margin: 0 auto; 
  padding: 20px 10px;
  box-sizing: border-box;
}

.security-container {
  position: relative;
  width: 100%;
}

/* 返回箭头样式 */
.back-btn {
  position: absolute;
  top: 0;
  left: 0;
  font-size: 20px;
  color: #333;
  cursor: pointer;
  transition: color 0.2s;
}
.back-btn:hover:not(.disabled) {
  color: #1989fa;
}
.back-btn.disabled {
  color: #c8c9cc;
  cursor: not-allowed;
}

.page-title {
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 30px 0 20px;
}

.security-list {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  overflow: hidden;
  width: 100%;
}

.security-item {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}
.security-item:last-child {
  border-bottom: none;
}
.security-item.disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
  color: #c8c9cc;
}
.security-item:hover:not(.disabled) {
  background-color: #f5fafe;
}

.item-icon {
  color: #1989fa;
  margin-right: 12px;
  font-size: 18px;
}

.item-text {
  flex: 1;
  font-size: 16px;
  color: #333;
}

.item-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background-color: #f0f8ff;
  color: #1989fa;
  margin-right: 10px;
}

.item-arrow {
  color: #c8c9cc;
  font-size: 16px;
}
.security-item.disabled .item-arrow {
  color: #e8e8e8;
}
</style>