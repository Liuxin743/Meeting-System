<template>
  <div class="remark-page">
    <!-- 页面头部-->
    <div class="page-header">
      <van-icon 
        name="arrow-left" 
        size="20" 
        color="#1989fa" 
        class="back-icon" 
        @click="goBack"
        :disabled="loading"
      />
      <div class="page-title">我的备注</div>
    </div>

    <div class="page-content">
      <div class="remark-card card-common">
        <!-- 加载中提示 -->
        <div class="loading-tip" v-if="loading">
          正在加载备注列表...
        </div>
        <!-- 错误提示（支持重试） -->
        <div class="error-tip" v-else-if="hasError">
          <span>{{ errorMsg }}</span>
          <button class="retry-btn" @click="initRemarkList">重试</button>
        </div>
        <!-- 空数据提示 -->
        <div class="empty-tip" v-else-if="remarkAgendas.length === 0">
          暂无备注的议程
        </div>
        <!-- 备注列表 -->
        <div class="remark-list" v-else>
          <div class="remark-item" v-for="agenda in remarkAgendas" :key="agenda.id">
            <div class="remark-header">
              <div class="remark-title">{{ agenda.title }}</div>
              <div class="remark-time">{{ agenda.time }}</div>
            </div>
            <div class="remark-content" v-html="agenda.remark || ''"></div>
            <div class="remark-actions">
              <button 
                class="btn-normal mini-btn" 
                @click="goToEditRemark(agenda)"
                :disabled="loading"
              >
                修改
              </button>
              <button 
                class="btn-danger mini-btn" 
                @click="deleteRemark(agenda.id)"
                :disabled="loading"
              >
                {{ loading ? '处理中...' : '删除' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAgendaStore } from '../stores/agendaStore'
import { useUserStore } from '@/stores/userStore'
import { ElMessage } from 'element-plus'
import { agendaApi } from '../api/index'

const router = useRouter()
const agendaStore = useAgendaStore()
const userStore = useUserStore()

// 核心状态变量
const remarkAgendas = ref([])
const loading = ref(false) // 接口请求加载状态
const hasError = ref(false) // 接口请求错误状态
const errorMsg = ref('') // 错误提示信息

// 页面挂载时初始化数据
onMounted(() => {
  // 第一步：校验用户是否登录
  const token = localStorage.getItem('token')
  const userInfo = userStore.userInfo
  if (!token || !userInfo?.id) {
    ElMessage.warning('请先登录再查看我的备注')
    router.push({
      path: '/login',
      query: { redirect: '/remark' }
    })
    return
  }

  // 第二步：初始化备注列表
  initRemarkList()
})

// 从后端加载备注列表
const initRemarkList = async () => {
  try {
    // 重置状态，开启加载
    loading.value = true
    hasError.value = false
    errorMsg.value = ''
    remarkAgendas.value = []

    // 获取当前用户 ID
    const userId = userStore.userInfo.id

    const res = await agendaApi.getRemarkAgendas({ userId })

    // 校验接口返回结果
    if (res && res.code === 200 && res.data) {
      // 赋值备注列表（后端返回的议程数据）
      remarkAgendas.value = res.data || []

      agendaStore.updateRemarkAgendas(res.data)
      agendaStore.saveAgendaToLocalStorage()
    } else {
      throw new Error(res?.msg || '获取备注列表失败')
    }
  } catch (err) {
    // 处理接口错误
    hasError.value = true
    errorMsg.value = err.response?.data?.msg || err.message || '网络异常，无法加载备注列表'
    ElMessage.error(errorMsg.value)
    console.error('加载备注列表报错：', err)
  } finally {
    // 关闭加载状态
    loading.value = false
  }
}

// 跳转到会议流程页面修改备注
const goToEditRemark = (agenda) => {
  if (loading.value) return
  router.push({
    path: '/process', 
    query: { editRemarkId: agenda.id } // 传递要修改的议程ID
  })
}

const deleteRemark = async (agendaId) => {
  if (!agendaId || loading.value) return

  try {
    // 开启加载状态
    loading.value = true

    // 构建请求参数（用户 ID + 议程 ID）
    const reqData = {
      userId: userStore.userInfo.id,
      agendaId: agendaId
    }

    const res = await agendaApi.deleteAgendaRemark(reqData)

    // 校验接口返回结果
    if (res && res.code === 200) {
      ElMessage.success('备注已删除')

      // 同步更新前端数据（移除该议程）
      remarkAgendas.value = remarkAgendas.value.filter(item => item.id !== agendaId)

      // 同步更新 Pinia 和本地存储
      agendaStore.saveAgendaRemark(agendaId, '')
      agendaStore.saveAgendaToLocalStorage()
    } else {
      throw new Error(res?.msg || '删除备注失败')
    }
  } catch (err) {
    const errMsg = err.response?.data?.msg || err.message || '网络异常，删除备注失败'
    ElMessage.error(errMsg)
    console.error('删除备注报错：', err)
  } finally {
    // 关闭加载状态
    loading.value = false
  }
}

// 返回我的页面
const goBack = () => {
  if (!loading.value) {
    router.push({ path: '/mine' })
  }
}
</script>

<style scoped>
/* 整体样式 */
.remark-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 头部 */
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
.back-icon:disabled {
  color: #c8c9cc;
  cursor: not-allowed;
}

/* 标题 */
.page-title {
  flex: 1; 
  text-align: center;
  margin-right: 20px; 
}

/* 内容区域 */
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

/* 加载中提示 */
.loading-tip {
  font-size: 14px;
  color: #666;
  text-align: center;
  padding: 40px 0;
}

/* 错误提示 */
.error-tip {
  font-size: 14px;
  color: #ff4d4f;
  text-align: center;
  padding: 40px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.retry-btn {
  padding: 4px 12px;
  font-size: 12px;
  background-color: #1989fa;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* 空数据提示样式 */
.empty-tip {
  font-size: 14px;
  color: #999;
  text-align: center;
  padding: 40px 0;
}

/* 备注列表样式 */
.remark-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.remark-item:last-child {
  border-bottom: none;
}

.remark-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.remark-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.remark-time {
  font-size: 12px;
  color: #666;
  background-color: #f5fafe;
  padding: 2px 6px;
  border-radius: 4px;
}

.remark-content {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  padding: 8px;
  background-color: #f9f9f9;
  border-radius: 4px;
  margin-bottom: 8px;
  min-height: 40px;
}

/* 备注操作按钮组 */
.remark-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-start;
}

.btn-normal {
  background-color: #e6f7ff;
  color: #1989fa;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn-normal:disabled {
  background-color: #d9efff;
  color: #8cc5ff;
  cursor: not-allowed;
}

.btn-normal:hover:not(:disabled) {
  background-color: #d1eaff;
}

.btn-danger {
  background-color: #ff4d4f;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn-danger:disabled {
  background-color: #ffb3b3;
  cursor: not-allowed;
}

.btn-danger:hover:not(:disabled) {
  background-color: #ff3333;
}

.mini-btn {
  padding: 4px 8px;
  font-size: 12px;
}
</style>