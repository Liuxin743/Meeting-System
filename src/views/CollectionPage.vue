<template>
  <div class="collection-page">
    <!-- 头部-->
    <div class="page-header">
      <van-icon 
        name="arrow-left" 
        size="20" 
        color="#1989fa" 
        class="back-icon" 
        @click="goBack"
        :disabled="loading"
      />
      <div class="page-title">我的收藏</div>
    </div>

    <div class="page-content">
      <div class="collection-card card-common">
        <!-- 加载中提示 -->
        <div class="loading-tip" v-if="loading">
          正在加载收藏列表...
        </div>
        <!-- 错误提示（支持重试） -->
        <div class="error-tip" v-else-if="hasError">
          <span>{{ errorMsg }}</span>
          <button class="retry-btn" @click="initCollectionList">重试</button>
        </div>
        <!-- 空数据提示 -->
        <div class="empty-tip" v-else-if="collectedAgendas.length === 0">
          暂无收藏的议程
        </div>
        <!-- 收藏列表 -->
        <div class="collection-list" v-else>
          <div class="collection-item" v-for="agenda in collectedAgendas" :key="agenda.id">
            <div class="collection-header">
              <div class="collection-title">{{ agenda.title }}</div>
              <div class="collection-time">{{ agenda.time }}</div>
            </div>
            <!-- 标签展示 -->
            <div class="collection-tags" v-if="agenda.tags && agenda.tags.length > 0">
              <span class="tag-item" v-for="tag in agenda.tags" :key="tag">{{ tag }}</span>
            </div>
            <!-- 取消收藏按钮（加载中禁用） -->
            <button 
              class="btn-danger mini-btn cancel-collect" 
              @click="handleCancelCollect(agenda.id)"
              :disabled="loading"
            >
              {{ loading ? '处理中...' : '取消收藏' }}
            </button>
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
import { getCollectedAgendas, cancelAgendaCollect } from '@/api/agenda'
import { ElMessage } from 'element-plus'

const router = useRouter()
const agendaStore = useAgendaStore()
const userStore = useUserStore()

const collectedAgendas = ref([])
const loading = ref(false) // 接口请求加载状态
const hasError = ref(false) // 接口请求错误状态
const errorMsg = ref('') // 错误提示信息

// 页面挂载初始化
onMounted(() => {
  const token = localStorage.getItem('token')
  const userInfo = userStore.userInfo
  if (!token || !userInfo?.id) { 
    ElMessage.warning('请先登录再查看我的收藏')
    router.push({
      path: '/login',
      query: { redirect: '/collection' }
    })
    return
  }

  initCollectionList()
})

// 从后端加载收藏列表
const initCollectionList = async () => {
  try {
    // 1. 重置状态，开启加载
    loading.value = true
    hasError.value = false
    errorMsg.value = ''
    collectedAgendas.value = []

    // 获取当前用户 ID
    const userId = userStore.userInfo.id

    // 直接调用导入的 getCollectedAgendas 接口
    const res = await getCollectedAgendas({ userId })

    // 校验接口返回结果
    if (res && res.code === 200 && res.data) {
      //  赋值收藏列表（后端返回的议程数据）
      collectedAgendas.value = res.data || []

      // 同步更新 Pinia 和本地存储
      agendaStore.updateCollectedAgendas(res.data)
      agendaStore.saveAgendaToLocalStorage()
    } else {
      throw new Error(res?.msg || '获取收藏列表失败')
    }
  } catch (err) {
    // 处理接口错误
    hasError.value = true
    errorMsg.value = err.response?.data?.msg || err.message || '网络异常，无法加载收藏列表'
    ElMessage.error(errorMsg.value)
    console.error('加载收藏列表报错：', err)
  } finally {
    // 关闭加载状态
    loading.value = false
  }
}

// 取消收藏
const handleCancelCollect = async (agendaId) => {
  if (!agendaId) return

  try {
    // 开启加载状态
    loading.value = true

    // 构建请求参数（用户 ID + 议程 ID）
    const reqData = {
      userId: userStore.userInfo.id,
      agendaId: agendaId
    }

    const res = await cancelAgendaCollect(reqData)

    // 校验接口返回结果
    if (res && res.code === 200) {
      ElMessage.success('已取消收藏')

      // 同步更新前端数据
      collectedAgendas.value = collectedAgendas.value.filter(item => item.id !== agendaId)

      // 同步更新 Pinia 和本地存储
      agendaStore.toggleAgendaCollect(agendaId)
      agendaStore.saveAgendaToLocalStorage()
    } else {
      throw new Error(res?.msg || '取消收藏失败')
    }
  } catch (err) {
    const errMsg = err.response?.data?.msg || err.message || '网络异常，取消收藏失败'
    ElMessage.error(errMsg)
    console.error('取消收藏报错：', err)
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
.collection-page {
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
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
}

/* 返回图标 */
.back-icon {
  cursor: pointer;
  margin-right: 12px;
}
.back-icon:disabled {
  color: #c8c9cc;
  cursor: not-allowed;
}

/* 居中标题 */
.page-title {
  flex: 1;
  text-align: center;
  margin-right: 20px;
}

/* 内容区域 */
.page-content {
  padding: 10px;
  box-sizing: border-box;
}

/* 通用卡片 */
.card-common {
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
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

/* 空数据提示 */
.empty-tip {
  font-size: 14px;
  color: #999;
  text-align: center;
  padding: 40px 0;
}

/* 收藏列表项 */
.collection-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.collection-item:last-child {
  border-bottom: none;
}

/* 收藏项头部 */
.collection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.collection-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.collection-time {
  font-size: 12px;
  color: #666;
  background-color: #f5fafe;
  padding: 2px 6px;
  border-radius: 4px;
}

/* 标签样式 */
.collection-tags {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.tag-item {
  padding: 2px 6px;
  font-size: 12px;
  background-color: #e6f7ff;
  color: #1989fa;
  border-radius: 4px;
}

/* 取消收藏按钮 */
.cancel-collect {
  margin-top: 8px;
  padding: 4px 8px;
  font-size: 12px;
  background-color: #ff4d4f;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.cancel-collect:disabled {
  background-color: #ffb3b3;
  cursor: not-allowed;
}

.cancel-collect:hover:not(:disabled) {
  background-color: #ff3333;
}

.mini-btn {
  padding: 4px 8px;
  font-size: 12px;
}
</style>