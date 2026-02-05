<template>
  <div class="detail-view">
    <div class="page-content">
      <!-- 加载中提示 -->
      <div v-if="loading" class="loading-tip">
        正在加载数据...
      </div>

      <!-- 错误提示 -->
      <div v-else-if="errorMsg" class="error-tip">
        {{ errorMsg }}
      </div>

      <div v-else>
        <div class="schedule-card card-common report-card">
          <div class="card-header">
            <h3 class="card-title">个人专属日程</h3>
            <span class="count-badge">{{ personalSchedule.length }}</span>
          </div>
          <div class="cell-group">
            <!-- 无内容提示 -->
            <div v-if="personalSchedule.length === 0" class="empty-tip">
              暂无个人专属日程
            </div>
            <div 
              class="cell-item report-item" 
              v-for="item in personalSchedule" 
              :key="`personal-${item.agendaId}-${item.stepIndex}`"
              :class="{ ended: item.isEnded }"
              @click="toggleCollect(item.agendaId, item.stepIndex)" 
            >
              <div class="cell-icon">
                <span :class="getIconClass(item.icon)"></span>
                <!-- 收藏标记 -->
                <span v-if="item.isCollected" class="collect-tag">❤️</span>
              </div>
              <div class="cell-content">
                <div class="cell-title">{{ item.time }}</div>
                <div class="cell-value">{{ item.content }}</div>
                <!-- 倒计时展示：直接使用 item 中的 countdown（Store 已计算） -->
                <div class="countdown-box">
                   {{ item.countdown }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 想听日程 -->
        <div class="schedule-card card-common wish-card" style="margin-top: 10px;">
          <div class="card-header">
            <h3 class="card-title">想听日程</h3>
            <span class="count-badge">{{ wishSchedule.length }}</span>
          </div>
          <div class="cell-group">
            <!-- 无内容提示 -->
            <div v-if="wishSchedule.length === 0" class="empty-tip">
              暂无想听日程（请先收藏流程步骤）
            </div>
            <div 
              class="cell-item" 
              v-for="item in wishSchedule" 
              :key="`wish-${item.agendaId}-${item.stepIndex}`"
              :class="{ ended: item.isEnded }"
              @click="toggleCollect(item.agendaId, item.stepIndex)"
            >
              <div class="cell-icon">
                <span :class="getIconClass(item.icon)"></span>
                <span class="collect-tag">❤️</span>
              </div>
              <div class="cell-content">
                <div class="cell-title">{{ item.time }}</div>
                <div class="cell-value">{{ item.content }}</div>
                <!-- 倒计时展示：直接使用 item 中的 countdown（Store 已计算） -->
                <div class="countdown-box">
                   {{ item.countdown }}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 议程编辑区域 -->
        <div class="adjust-card card-common" style="margin-top: 10px;">
          <h3 class="card-title">编辑会议议程</h3>
          <!-- 选择要编辑的议程 -->
          <div class="agenda-select">
            <select v-model="selectedAgendaId" class="select-input" :disabled="agendaLoading">
              <option value="">请选择要编辑的议程</option>
              <option v-for="agenda in agendaList" :value="agenda.id" :key="agenda.id">
                {{ agenda.title }}（{{ agenda.time }}）
              </option>
            </select>
          </div>

          <!-- 议程编辑表单 -->
          <div class="edit-form" v-if="selectedAgenda">
            <div class="form-item">
              <label class="form-label">议程标题：</label>
              <input 
                class="form-input" 
                v-model="editAgenda.title" 
                placeholder="请输入议程标题"
                autocomplete="off"
                :disabled="agendaLoading"
              />
            </div>
            <div class="form-item">
              <label class="form-label">议程时间：</label>
              <input 
                class="form-input" 
                type="datetime-local" 
                v-model="editAgenda.time"
                :disabled="agendaLoading"
              />
            </div>
            <button class="btn-primary save-btn" @click="saveAgendaEdit" :disabled="agendaLoading || collectLoading">
              <span v-if="agendaLoading">保存中...</span>
              <span v-else>保存修改</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 提示 -->
    <div class="toast-mask" v-if="toastVisible">
      <div class="toast-content">
        ✅ 议程修改成功，通知已更新！
      </div>
    </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useScheduleStore } from '../../stores/scheduleStore'
import { useAgendaStore } from '../../stores/agendaStore'

const scheduleStore = useScheduleStore()
const agendaStore = useAgendaStore()

// 解构响应式数据
const { personalSchedule, wishSchedule, collectLoading, collectError } = storeToRefs(scheduleStore)
const { agendaList, agendaLoading, agendaError } = storeToRefs(agendaStore)

// 解构方法
const { updateAgenda, fetchMyAgendas } = agendaStore
const { addAgendaEditNotification, toggleFlowStepCollect, calculateCountdown } = scheduleStore

// 页面响应式数据
const selectedAgendaId = ref('') 
const selectedAgenda = ref(null) 
const editAgenda = ref({ title: '', time: '' }) 
const toastVisible = ref(false) 
let countdownTimer = null 

const loading = ref(false)
const errorMsg = ref('')

// 保留：获取日程图标类名
const getIconClass = (iconName) => {
  switch (iconName) {
    case 'calendar-o': return 'icon-calendar';
    case 'clock-o': return 'icon-clock';
    case 'question-o': return 'icon-question';
    default: return 'icon-default';
  }
}

// 切换收藏状态
const toggleCollect = async (agendaId, stepIndex) => {
  const success = await toggleFlowStepCollect(agendaId, stepIndex)
  if (!success) {
    alert(collectError.value || '收藏操作失败，请稍后重试')
  }
}

// 保存议程修改
const saveAgendaEdit = async () => {
  // 表单校验
  if (!selectedAgenda.value) {
    alert('请先选择要编辑的议程！')
    return
  }
  if (!editAgenda.value.title.trim()) {
    alert('议程标题不能为空！')
    return
  }
  if (!editAgenda.value.time) {
    alert('请选择议程时间！')
    return
  }

  // 格式化时间
  const formattedTime = editAgenda.value.time.replace('T', ' ')

  // 异步更新议程
  const success = await updateAgenda(selectedAgenda.value.id, {
    title: editAgenda.value.title.trim(),
    time: formattedTime
  })

  if (!success) {
    alert('议程修改失败，请稍后重试')
    return
  }

  // 添加议程修改通知
  addAgendaEditNotification({
    title: editAgenda.value.title.trim(),
    time: formattedTime
  })

  // 显示成功提示
  toastVisible.value = true
  setTimeout(() => {
    toastVisible.value = false
    // 重置选中状态
    selectedAgendaId.value = ''
  }, 3000)
}


onMounted(async () => {
  try {
    loading.value = true
    errorMsg.value = ''

    // 从后端拉取议程列表
    await fetchMyAgendas()

    // 从后端拉取收藏列表
    await scheduleStore.fetchMyCollects()

    // 启动倒计时定时器
    countdownTimer = setInterval(() => {

      personalSchedule.value.forEach(item => {
        item.countdown = calculateCountdown(item.time)
      })
      wishSchedule.value.forEach(item => {
        item.countdown = calculateCountdown(item.time)
      })
    }, 1000)

  } catch (err) {
    errorMsg.value = '数据加载失败，请刷新页面重试'
    console.error('页面初始化失败:', err)
  } finally {
    loading.value = false
  }

  // 监听选中的议程ID
  watch(selectedAgendaId, (newId) => {
    // 重置表单状态
    selectedAgenda.value = null
    editAgenda.value = { title: '', time: '' }

    if (newId) {
      const targetAgenda = agendaList.value.find(item => item.id === newId)
      if (targetAgenda) {
        selectedAgenda.value = targetAgenda
        const formattedTime = targetAgenda.time.replace(' ', 'T')
        editAgenda.value = {
          title: targetAgenda.title,
          time: formattedTime
        }
      }
    }
  }, { immediate: false })

  // 监听 Store 错误信息，同步到页面
  watch([agendaError, collectError], ([agendaErr, collectErr]) => {
    if (agendaErr) errorMsg.value = agendaErr
    if (collectErr && !errorMsg.value) errorMsg.value = collectErr
  })
})

// 页面卸载时清除定时器
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }


})
</script>

<style scoped>
.detail-view {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 65px; 
  box-sizing: border-box;
}

.page-content {
  padding: 10px;
  width: 100%;
  box-sizing: border-box;
}

/* 加载中提示 */
.loading-tip {
  text-align: center;
  padding: 30px 0;
  font-size: 14px;
  color: #666;
}

/*错误提示 */
.error-tip {
  text-align: center;
  padding: 30px 0;
  font-size: 14px;
  color: #ff4d4f;
}

/* 通用卡片 */
.card-common {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* 卡片头部 */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

/* 数量徽章 */
.count-badge {
  background-color: #1989fa;
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: normal;
}

/* 个人专属日程卡片特殊 */
.report-card {
  border: 2px solid #e6f7ff;
  background-color: #f8fbff;
}

/* 想听日程卡片 */
.wish-card {
  border: 1px solid #f0f0f0;
}

/* 个人专属日程 */
.cell-group {
  width: 100%;
}

/* 无内容提示 */
.empty-tip {
  text-align: center;
  padding: 20px 0;
  font-size: 14px;
  color: #999;
}

.cell-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 8px;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
  cursor: pointer; /* 收藏点击手势 */
}

.cell-item.ended {
  opacity: 0.6;
}

/* 个人专属日程*/
.report-item {
  background-color: #fff;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 8px;
  border-left: 4px solid #1989fa;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.cell-item:last-child {
  border-bottom: none;
}

.cell-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1989fa;
  margin-right: 12px;
  margin-top: 2px;
  position: relative;
}

/* 收藏标记 */
.collect-tag {
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 12px;
}

/* 图标伪元素 */
.icon-calendar::before { content: '📅'; }
.icon-clock::before { content: '⏰'; }
.icon-question::before { content: '❓'; }
.icon-default::before { content: 'ℹ️'; }

.cell-content {
  flex: 1;
}

.cell-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
  font-weight: 500;
}

.cell-value {
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

/* 倒计时 */
.countdown-box {
  margin-top: 6px;
  font-size: 12px;
  color: #ff7a45;
  font-weight: 600;
  background-color: #fff7e6;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
}

/* 议程编辑 */
.agenda-select {
  margin-bottom: 16px;
}

.select-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 14px;
  margin-top: 20px;
  color: #333;
  box-sizing: border-box;
  background-color: #fff;
}

.edit-form {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #f0f0f0;
}

.form-item {
  margin-bottom: 16px;
}

.form-label {
  font-size: 14px;
  color: #333;
  margin-bottom: 6px;
  display: block;
}

.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 14px;
  color: #333;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  border-color: #1989fa;
  outline: none;
}

.save-btn {
  width: 100%;
  padding: 12px 0;
  background-color: #1989fa;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.save-btn:hover:not(:disabled) {
  background-color: #1677ff;
}

.save-btn:disabled {
  background-color: #8cc5ff;
  cursor: not-allowed;
}

.toast-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  pointer-events: none;
}

.toast-content {
  background-color: rgba(0, 0, 0, 0.7);
  color: #ffffff;
  padding: 12px 24px;
  border-radius: 20px;
  font-size: 14px;
}
</style>