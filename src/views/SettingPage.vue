<template>
  <div class="setting-page">
    <div class="page-header">
      <van-icon 
        name="arrow-left" 
        size="20" 
        color="#1989fa" 
        class="back-icon" 
        @click="goBack"
      />
      <div class="page-title">系统设置</div>
    </div>

    <!-- 内容区域 -->
    <div class="page-content">
      <div class="setting-card card-common">
        <!-- 通用设置项 -->
        <div class="setting-item">
          <div class="setting-label">清除缓存</div>
          <button class="btn-normal mini-btn" @click="clearCache">一键清除</button>
        </div>
        <div class="setting-item">
          <div class="setting-label">消息通知</div>
          <van-switch v-model="notificationSwitch" color="#1989fa" />
        </div>
        <div class="setting-item">
          <div class="setting-label">关于我们</div>
          <van-icon name="arrow-right" size="16" color="#c8c9cc" @click="goToAbout" />
        </div>
        <div class="setting-item">
          <div class="setting-label">版本信息</div>
          <div class="version-text">v1.0.0</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted,watch} from 'vue'
import { useRouter } from 'vue-router'
import { useAgendaStore } from '../stores/agendaStore'

const router = useRouter()

// 用于清除缓存
const agendaStore = useAgendaStore()

// 消息通知开关状态
const notificationSwitch = ref(true)
onMounted(() => {
  const savedSwitch = localStorage.getItem('notificationSwitch')
  if (savedSwitch !== null) {
    notificationSwitch.value = savedSwitch === 'true'
  }
})

const goBack = () => {
  router.push({ path: '/mine' }) 
}

// 清除缓存
const clearCache = () => {
  // 清除议程相关缓存
  agendaStore.clearAgendaStorage()
  // 清除个人信息缓存
  localStorage.removeItem('userName')
  localStorage.removeItem('userAvatar')
  // 清除消息通知开关缓存
  localStorage.removeItem('notificationSwitch')
  // 操作反馈
  alert('缓存已清除完成！')
}

const goToAbout = () => {
  alert('关于我们：会议管理系统 v1.0.0，专注于高效会议议程管理')
}

watch(notificationSwitch, (newValue) => {
  localStorage.setItem('notificationSwitch', newValue)
})
</script>

<style scoped>
/* 整体样式 */
.setting-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.page-header {
  display: flex;
  align-items: center;
  position: relative;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  padding: 15px;
  background-color: #ffffff;
  border-bottom: 1px solid #f0f0f0;
}

/* 返回图标样式 */
.back-icon {
  cursor: pointer;
  margin-right: 12px;
}

/* 标题 */
.page-title {
  flex: 1;
  text-align: center;
  margin-right: 20px;
}

/* 内容*/
.page-content {
  padding: 10px;
  width: 100%;
  box-sizing: border-box;
}

/* 通用卡片样式 */
.card-common {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 10px;
}

/* 系统设置项样式 */
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-label {
  font-size: 14px;
  color: #333;
}

.version-text {
  font-size: 12px;
  color: #666;
}

/* 按钮样式 */
.btn-normal {
  background-color: #e6f7ff;
  color: #1989fa;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn-normal:hover {
  background-color: #d1eaff;
}

.mini-btn {
  padding: 4px 8px;
  font-size: 12px;
}
</style>