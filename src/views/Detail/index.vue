<template>
  <div class="detail-view">
    <div class="page-content">
      <!-- 个人专属日程 -->
      <div class="schedule-card card-common">
        <h3 class="card-title">个人专属日程</h3>
        <div class="cell-group">
          <!-- 无内容时的提示 -->
          <div v-if="coreScheduleTime.personalSchedule.length === 0" class="empty-tip">
            暂无日程，请前往「会议流程」页同步数据
          </div>
          <!-- 有内容时的列表展示 -->
          <div 
            class="cell-item" 
            v-for="(item, index) in coreScheduleTime.personalSchedule" 
            :key="index"
          >
            <div class="cell-icon">
              <span :class="getIconClass(item.icon)"></span>
            </div>
            <div class="cell-content">
              <div class="cell-title">{{ item.time }}</div>
              <div class="cell-value">{{ item.content }}</div>
            </div>
          </div>
        </div>
      </div>

      
      <div class="adjust-card card-common" style="margin-top: 10px;">
        <h3 class="card-title">编辑会议议程</h3>
        <!-- 选择要编辑的议程 -->
        <div class="agenda-select">
          <select v-model="selectedAgendaId" class="select-input">
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
            />
          </div>
          <div class="form-item">
            <label class="form-label">议程时间：</label>
            <input 
              class="form-input" 
              type="datetime-local" 
              v-model="editAgenda.time"
            />
          </div>
          <button class="btn-primary save-btn" @click="saveAgendaEdit">
            保存修改
          </button>
        </div>
      </div>
    </div>

    <!-- 修改成功提示Toast -->
    <div class="toast-mask" v-if="toastVisible">
      <div class="toast-content">
        ✅ 议程修改成功，通知已更新！
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useScheduleStore } from '../../stores/scheduleStore'
import { useAgendaStore } from '../../stores/agendaStore'

// 初始化Pinia仓库
const scheduleStore = useScheduleStore()
const agendaStore = useAgendaStore()
const { coreScheduleTime } = storeToRefs(scheduleStore)
const { agendaList } = storeToRefs(agendaStore)
const { updateAgenda, loadAgendaFromLocalStorage } = agendaStore
//  页面响应式数据
const selectedAgendaId = ref('') // 选中的议程ID
const selectedAgenda = ref(null) // 选中的议程详情
const editAgenda = ref({ title: '', time: '' }) // 编辑表单数据
const toastVisible = ref(false) // 提示Toast显示状态

// 页面挂载时加载数据
onMounted(() => {
  // 加载本地存储的议程数据
  loadAgendaFromLocalStorage()
})

// 监听选中的议程ID，同步填充编辑表单
watch(selectedAgendaId, (newId) => {
  // 重置表单状态
  selectedAgenda.value = null
  editAgenda.value = { title: '', time: '' }

  if (newId) {
    // 查找选中的议程（转换为数字类型匹配ID）
    const targetAgenda = agendaList.value.find(item => item.id === Number(newId))
    if (targetAgenda) {
      selectedAgenda.value = targetAgenda
      // 格式化时间：适配datetime-local组件（将" "替换为"T"）
      const formattedTime = targetAgenda.time.replace(' ', 'T')
      // 填充编辑表单
      editAgenda.value = {
        title: targetAgenda.title,
        time: formattedTime
      }
    }
  }
}, { immediate: false })

// 获取日程图标类名
const getIconClass = (iconName) => {
  switch (iconName) {
    case 'calendar-o': return 'icon-calendar';
    case 'clock-o': return 'icon-clock';
    case 'question-o': return 'icon-question';
    default: return 'icon-default';
  }
}

// 保存议程修改
const saveAgendaEdit = () => {
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

  // 格式化时间：将datetime-local的"T"转换为空格，适配本地存储格式
  const formattedTime = editAgenda.value.time.replace('T', ' ')

  // 更新首页议程数据
  updateAgenda(selectedAgenda.value.id, {
    title: editAgenda.value.title.trim(),
    time: formattedTime
  })

  // 添加议程修改通知
  scheduleStore.addAgendaEditNotification({
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
</script>

<style scoped>
/* 页面基础样式 */
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

/* 通用卡片样式 */
.card-common {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}

/* 个人专属日程样式 */
.cell-group {
  width: 100%;
}

/* 无内容提示样式 */
.empty-tip {
  text-align: center;
  padding: 20px 0;
  font-size: 14px;
  color: #999;
}

.cell-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
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
}

.cell-value {
  font-size: 12px;
  color: #666;
}
/* 议程编辑样式 */
.agenda-select {
  margin-bottom: 16px;
}

.select-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 14px;
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

.save-btn:hover {
  background-color: #1677ff;
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