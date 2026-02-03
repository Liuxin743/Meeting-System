<template>
  <!-- 外层容器：控制整个页面的宽度和居中 -->
  <div class="page-wrapper">
    <div class="security-container">
      <!-- 返回箭头 -->
      <div class="back-btn" @click="goBack">
        <el-icon><arrow-left /></el-icon>
      </div>

      <h2 class="page-title">安全中心</h2>

      <!-- 功能列表 -->
      <div class="security-list">
        <!-- 更换手机号 -->
        <div class="security-item" @click="goToChangePhone">
          <el-icon class="item-icon"><phone /></el-icon>
          <span class="item-text">更换手机号</span>
          <el-icon class="item-arrow"><arrow-right /></el-icon>
        </div>

        <!-- 修改密码 -->
        <div class="security-item" @click="goToChangePwd">
          <el-icon class="item-icon"><lock /></el-icon>
          <span class="item-text">修改密码</span>
          <el-icon class="item-arrow"><arrow-right /></el-icon>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ArrowLeft, Phone, Lock, ArrowRight } from '@element-plus/icons-vue'

const router = useRouter()

// 返回上一级
const goBack = () => {
  router.back()
}

// 跳转到更换手机号页
const goToChangePhone = () => {
  router.push('/security/change-phone')
}

// 跳转到修改密码页
const goToChangePwd = () => {
  router.push('/security/change-password')
}
</script>

<style scoped>
/* 外层容器：限制整个页面的宽度，与列表宽度一致 */
.page-wrapper {
  max-width: 600px; /* 适配大屏 */
  min-height: 100vh;
  background-color: #ffffff; /* 改为全白背景 */
  margin: 0 auto; /* 页面整体水平居中 */
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
.back-btn:hover {
  color: #1989fa;
}

.page-title {
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 30px 0 20px;
}

/* 功能列表：宽度100%，与页面容器对齐 */
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
}
.security-item:last-child {
  border-bottom: none;
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

.item-arrow {
  color: #c8c9cc;
  font-size: 16px;
}
</style>