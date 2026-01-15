<template>
  <div class="home-page">
    <!-- 1. 滚动内容区：适配tabbar，内容不被遮挡 -->
    <div class="home-scroll-content">
      <div class="page-content">
        <!-- 会议倒计时卡片 -->
        <el-card class="mb-4" shadow="hover">
          <template #header>
            <h3 class="card-title">会议倒计时</h3>
          </template>
          <div class="countdown-container">
            <el-countdown
              :time="coreScheduleTime.meetingTime"
              format="DD 天 HH 时 mm 分 ss 秒"
              class="countdown-text"
            />
            <div class="countdown-tip">会议即将开始，敬请准备</div>
            <div class="countdown-enter">
              <button class="enter-meeting-btn" @click="jumpToMeetingFlow">
                点击进入会议流程
              </button>
            </div>
          </div>
        </el-card>

        <!-- 重要通知卡片 -->
        <el-card class="mb-4" shadow="hover">
          <template #header>
            <h3 class="card-title">重要通知</h3>
          </template>
          <div class="notice-container">
            <div class="notice-empty" v-if="notifications.length === 0">
              暂无未处理通知，敬请关注
            </div>
            <div class="notice-item" v-for="(item, index) in notifications" :key="item.id">
              <div class="notice-header">
                <span class="notice-type">{{ item.type }}</span>
                <span class="notice-status" :class="item.status">{{ item.status }}</span>
              </div>
              <div class="notice-content">
                <p class="notice-title">{{ item.title }}</p>
                <p class="notice-desc">{{ item.content }}</p>
                <p class="notice-time">创建时间：{{ item.createTime }}</p>
              </div>
              <div class="notice-divider" v-if="index < notifications.length - 1"></div>
            </div>
          </div>
        </el-card>

        <!-- 创建议程按钮 -->
        <button class="create-agenda-btn" @click="openCreateDialog">
          + 创建新议程
        </button>

        <!-- 加载/错误提示 -->
        <div class="loading-mask" v-if="loading">
          <div class="loading-content">加载中...</div>
        </div>
        <div class="error-bar" v-if="errorMsg" @click="clearErrorMsg">
          ❌ {{ errorMsg }} <span class="error-close">×</span>
        </div>

        <!-- 议程列表 -->
        <div class="agenda-list">
          <div class="empty-tip" v-if="agendaList.length === 0 && !loading">
            暂无会议议程，点击添加创建吧~
          </div>
          <div
            class="agenda-item card-common"
            v-for="(agenda, index) in agendaList"
            :key="agenda.id"
          >
            <div class="agenda-header">
              <div class="agenda-title" @click="openEditDialog(agenda)">
                {{ agenda.title }}
              </div>
              <div class="agenda-time">
                {{ agenda.time }}
              </div>
            </div>

            <div class="agenda-actions">
              <button class="btn-normal mini-btn" @click="openTagDialog(agenda)">
                标签
              </button>
              <button
                class="btn-normal mini-btn"
                @click="openRemarkDialog(agenda)"
              >
                备注
              </button>
              <button
                class="btn-normal mini-btn"
                :class="{ collected: agenda.isCollected }"
                @click="handleToggleCollect(agenda.id)"
              >
                {{ agenda.isCollected ? "已收藏" : "收藏" }}
              </button>
              <button
                class="btn-normal mini-btn"
                @click="openShareDialog(agenda)"
              >
                分享
              </button>
              <!-- 新增：会议提醒按钮（贴合现有样式） -->
              <button
                class="btn-normal mini-btn"
                style="background-color: #f0fff4; color: #52c41a;"
                @click="setBrowserReminder(agenda)"
              >
                设置提醒
              </button>
              <button
                class="btn-normal mini-btn"
                style="background-color: #fff7e6; color: #fa8c16;"
                @click="addToMobileCalendar(agenda)"
              >
                添加到日历
              </button>
              <button
                class="btn-danger mini-btn"
                @click="handleDeleteAgenda(agenda.id)"
              >
                删除
              </button>
            </div>

            <div class="agenda-tags" v-if="agenda.tags.length > 0">
              <span class="tag-item" v-for="tag in agenda.tags" :key="tag">{{ tag }}</span>
            </div>

            <div class="agenda-remark" v-if="agenda.remark">
              <div class="remark-label">备注：</div>
              <div class="remark-content" v-html="agenda.remark"></div>
              <div class="remark-actions">
                <button class="btn-normal mini-btn remark-edit" @click="openRemarkDialog(agenda)">
                  修改
                </button>
                <button class="btn-danger mini-btn remark-delete" @click="deleteAgendaRemark(agenda.id)">
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建议程弹窗 -->
    <div
      class="dialog-mask"
      v-if="createDialogVisible"
      @click="createDialogVisible = false"
    >
      <div class="dialog-content" @click.stop>
        <h3 class="dialog-title">创建新议程</h3>
        <div class="form-item">
          <label class="form-label">议程标题：</label>
          <input
            class="form-input"
            v-model="newAgenda.title"
            placeholder="请输入议程标题"
          />
        </div>
        <div class="form-item">
          <label class="form-label">议程时间：</label>
          <input
            class="form-input"
            type="datetime-local"
            v-model="newAgenda.time"
          />
        </div>
        <div class="dialog-btn-group">
          <button
            class="dialog-cancel-btn"
            @click="createDialogVisible = false"
          >
            取消
          </button>
          <button class="dialog-confirm-btn" @click="handleCreateAgenda">
            确认创建
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑议程弹窗 -->
    <div
      class="dialog-mask"
      v-if="editDialogVisible"
      @click="editDialogVisible = false"
    >
      <div class="dialog-content" @click.stop>
        <h3 class="dialog-title">编辑议程</h3>
        <div class="form-item">
          <label class="form-label">议程标题：</label>
          <input
            class="form-input"
            v-model="editAgenda.title"
            placeholder="请输入议程标题"
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
        <div class="dialog-btn-group">
          <button
            class="dialog-cancel-btn"
            @click="editDialogVisible = false"
          >
            取消
          </button>
          <button class="dialog-confirm-btn" @click="handleEditAgenda">
            确认修改
          </button>
        </div>
      </div>
    </div>

    <!-- 标签选择弹窗 -->
    <div
      class="dialog-mask"
      v-if="tagDialogVisible"
      @click="tagDialogVisible = false"
    >
      <div class="dialog-content" @click.stop>
        <h3 class="dialog-title">选择标签</h3>
        <div class="tag-group">
          <div
            class="tag-option"
            v-for="tag in allTags"
            :key="tag"
            :class="{ selected: currentAgendaTags.includes(tag) }"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </div>
        </div>
        <button class="dialog-confirm-btn" @click="saveTags">确认保存</button>
      </div>
    </div>

    <!-- 备注弹窗 -->
    <div
      class="dialog-mask"
      v-if="remarkDialogVisible"
      @click="remarkDialogVisible = false"
    >
      <div class="dialog-content dialog-lg" @click.stop>
        <h3 class="dialog-title">添加/编辑备注</h3>
        <textarea
          class="remark-input"
          v-model="currentRemark"
          placeholder="请输入该议程的备注信息（支持简单HTML格式，如&lt;br/&gt;换行）"
          rows="8"
        ></textarea>
        <div class="dialog-btn-group">
          <button
            class="dialog-cancel-btn"
            @click="remarkDialogVisible = false"
          >
            取消
          </button>
          <button class="dialog-confirm-btn" @click="saveRemark">确认</button>
        </div>
      </div>
    </div>

    <!-- 分享弹窗 -->
    <div
      class="dialog-mask"
      v-if="shareDialogVisible"
      @click="shareDialogVisible = false"
    >
      <div class="dialog-content" @click.stop>
        <h3 class="dialog-title">分享该议程</h3>
        <div class="share-content">
          <div class="share-tips">复制下方链接分享给他人</div>
          <div class="share-link">{{ currentShareLink }}</div>
          <button class="btn-primary mini-btn" @click="copyLink">
            复制链接
          </button>
        </div>
        <button
          class="dialog-confirm-btn"
          @click="shareDialogVisible = false"
          style="margin-top: 10px"
        >
          关闭
        </button>
      </div>
    </div>

    <!-- 操作提示Toast -->
    <div class="toast-mask" v-if="toastVisible">
      <div class="toast-content">
        {{ toastText }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAgendaStore } from '../../stores/agendaStore'
import { useScheduleStore } from '../../stores/scheduleStore'

// 初始化Pinia仓库
const agendaStore = useAgendaStore()
const scheduleStore = useScheduleStore()

// 解构仓库响应式数据
const { agendaList } = storeToRefs(agendaStore)
const { coreScheduleTime, notifications } = storeToRefs(scheduleStore)

// 初始化路由（用于跳转会议流程）
const router = useRouter()

// 页面响应式数据
const loading = ref(false)
const errorMsg = ref("")
const toastVisible = ref(false)
const toastText = ref("")

const allTags = ref(["重点", "待讨论", "已完成", "延期", "需汇报"])
const tagDialogVisible = ref(false)
const currentAgendaId = ref(null)
const currentAgendaTags = ref([])

const remarkDialogVisible = ref(false)
const currentRemark = ref("")

const shareDialogVisible = ref(false)
const currentShareLink = ref("")

const createDialogVisible = ref(false)
const newAgenda = ref({
  title: "",
  time: ""
})

const editDialogVisible = ref(false)
const editAgenda = ref({
  id: null,
  title: "",
  time: ""
})

// 新增：会议提醒相关响应式数据（存储定时器，避免内存泄漏）
const reminderTimers = ref([])

// 工具方法：格式化当前时间
const formatCurrentDateTime = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hour}:${minute}`
}

// 新增：工具方法1 - 验证日期是否为未来日期（有效日期）
const isFutureDate = (date) => {
  if (!(date instanceof Date)) return false
  const now = new Date()
  return date.getTime() > now.getTime()
}

// 新增：工具方法2 - 格式化日历日期（符合iCal标准，用于唤起手机日历）
const formatCalendarDate = (date) => {
  if (!(date instanceof Date)) return ''
  return date.toISOString()
    .replace(/-/g, '')
    .replace(/:/g, '')
    .replace(/\.\d{3}Z/, 'Z')
}

// 新增：工具方法3 - 格式化时间显示（用于提醒提示）
const formatLocaleTime = (date) => {
  if (!(date instanceof Date)) return ''
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 页面挂载初始化
onMounted(() => {
  loading.value = true
  try {
    agendaStore.loadAgendaFromLocalStorage()
  } catch (err) {
    errorMsg.value = "数据加载失败，请刷新页面"
    console.error(err)
  } finally {
    loading.value = false
  }
})

// 新增：页面卸载时清除所有提醒定时器（避免内存泄漏、无效通知）
onUnmounted(() => {
  reminderTimers.value.forEach(item => {
    clearTimeout(item.timer)
  })
})

// 提示方法
const showToast = (text) => {
  toastText.value = text
  toastVisible.value = true
  setTimeout(() => {
    toastVisible.value = false
  }, 2000)
}

const clearErrorMsg = () => {
  errorMsg.value = ""
}

// 标签相关方法
const openTagDialog = (agenda) => {
  currentAgendaId.value = agenda.id
  currentAgendaTags.value = [...agenda.tags]
  tagDialogVisible.value = true
}

const toggleTag = (tag) => {
  const index = currentAgendaTags.value.findIndex(item => item === tag)
  if (index > -1) {
    currentAgendaTags.value.splice(index, 1)
  } else {
    currentAgendaTags.value.push(tag)
  }
}

const saveTags = () => {
  if (!currentAgendaId.value) return
  agendaStore.saveAgendaTags(currentAgendaId.value, currentAgendaTags.value)
  tagDialogVisible.value = false
  showToast("标签保存成功")
}

// 备注相关方法
const openRemarkDialog = (agenda) => {
  currentAgendaId.value = agenda.id
  currentRemark.value = agenda.remark || ""
  remarkDialogVisible.value = true
}

const saveRemark = () => {
  if (!currentAgendaId.value) return
  agendaStore.saveAgendaRemark(currentAgendaId.value, currentRemark.value.trim())
  remarkDialogVisible.value = false
  showToast("备注保存成功")
}

const deleteAgendaRemark = (agendaId) => {
  agendaStore.saveAgendaRemark(agendaId, "")
  showToast("备注已删除")
}

// 分享相关方法
const openShareDialog = (agenda) => {
  currentShareLink.value = `https://meeting-system.com/agenda/${agenda.id}?title=${encodeURIComponent(agenda.title)}`
  shareDialogVisible.value = true
}

const copyLink = () => {
  navigator.clipboard.writeText(currentShareLink.value).then(() => {
    showToast("链接已复制到剪贴板")
  }).catch(() => {
    showToast("复制失败，请手动复制")
  })
}

// 收藏相关方法
const handleToggleCollect = (agendaId) => {
  agendaStore.toggleAgendaCollect(agendaId)
  const latestAgenda = agendaList.value.find(item => item.id === agendaId)
  if (latestAgenda) {
    showToast(latestAgenda.isCollected ? "收藏成功" : "已取消收藏")
  }
}

// 删除议程方法
const handleDeleteAgenda = (agendaId) => {
  // 新增：删除议程时，同时清除对应的提醒定时器
  reminderTimers.value = reminderTimers.value.filter(item => {
    if (item.agendaId === agendaId) {
      clearTimeout(item.timer)
      return false
    }
    return true
  })

  if (confirm("确定要删除该议程吗？删除后不可恢复")) {
    agendaStore.agendaList = agendaStore.agendaList.filter(item => item.id !== agendaId)
    localStorage.setItem('agendaList', JSON.stringify(agendaStore.agendaList))
    showToast("议程已删除")
  }
}

// 创建议程相关方法
const openCreateDialog = () => {
  newAgenda.value = {
    title: "",
    time: formatCurrentDateTime()
  }
  createDialogVisible.value = true
}

const handleCreateAgenda = () => {
  if (!newAgenda.value.title.trim()) {
    showToast("请输入议程标题")
    return
  }
  agendaStore.addNewAgenda(newAgenda.value)
  createDialogVisible.value = false
  showToast("议程创建成功")
}

// 编辑议程相关方法
const openEditDialog = (agenda) => {
  const editTime = agenda.time.replace(' ', 'T')
  editAgenda.value = {
    id: agenda.id,
    title: agenda.title,
    time: editTime
  }
  editDialogVisible.value = true
}

const handleEditAgenda = () => {
  if (!editAgenda.value.title.trim()) {
    showToast("请输入议程标题")
    return
  }
  agendaStore.updateAgenda(editAgenda.value.id, {
    title: editAgenda.value.title,
    time: editAgenda.value.time.replace('T', ' ')
  })
  editDialogVisible.value = false
  showToast("议程修改成功")
}

// 跳转至会议流程页面
const jumpToMeetingFlow = () => {
  router.push('/process').catch(err => {
    console.warn('跳转异常：', err)
  })
}

/**
 * 方法1：设置浏览器本地通知提醒（提前15分钟）
 * @param {object} agenda 议程对象
 */
const setBrowserReminder = (agenda) => {
  // 1. 解析议程时间
  console.log('agenda.time:', agenda.time);
  const agendaTimeStr = agenda.time.replace(' ', 'T')
  const agendaDate = new Date(agendaTimeStr)
  const reminderDate = new Date(agendaDate.getTime() - 15 * 60 * 1000) // 提前15分钟

  // 2. 校验时间有效性
  if (!isFutureDate(agendaDate)) {
    return showToast('会议时间已过期，无法设置提醒')
  }
  if (!isFutureDate(reminderDate)) {
    return showToast('会议将在15分钟内开始，无法设置提前15分钟提醒')
  }

  // 3. 检查并请求通知权限
  if (Notification.permission !== 'granted') {
    Notification.requestPermission().then(permission => {
      if (permission !== 'granted') {
        return showToast('你已拒绝通知权限，无法接收浏览器提醒')
      }
      // 权限授权成功，创建提醒定时器
      createBrowserReminderTimer(agenda, reminderDate)
    }).catch(err => {
      console.error('请求通知权限失败：', err)
      showToast('请求通知权限失败，无法设置提醒')
    })
    return
  }

  // 4. 已授权，直接创建提醒定时器
  createBrowserReminderTimer(agenda, reminderDate)
}

/**
 * 辅助方法：创建浏览器提醒定时器
 * @param {object} agenda 议程对象
 * @param {Date} reminderDate 提醒日期
 */
const createBrowserReminderTimer = (agenda, reminderDate) => {
  // 清除该议程已存在的提醒定时器（避免重复提醒）
  reminderTimers.value = reminderTimers.value.filter(item => {
    if (item.agendaId === agenda.id) {
      clearTimeout(item.timer)
      return false
    }
    return true
  })

  // 计算时间差（当前时间到提醒时间的毫秒数）
  const now = new Date()
  const timeDiff = reminderDate.getTime() - now.getTime()

  // 创建定时器
  const timer = setTimeout(() => {
    // 触发浏览器本地通知
    const notification = new Notification('【会议倒计时提醒】', {
      body: `《${agenda.title}》即将在15分钟后开始（会议时间：${agenda.time}），请做好准备！`,
      icon: '/favicon.ico', // 可替换为你的项目图标（根目录）
      requireInteraction: true, // 保持通知可见，直到用户关闭
      tag: `agenda-reminder-${agenda.id}` // 通知标签，避免重复通知
    })

    // 通知点击事件（可选，点击后聚焦当前页面）
    notification.onclick = () => {
      window.focus()
      notification.close()
    }

    // 提示用户（可选，配合Toast）
    showToast(`《${agenda.title}》即将开始，请注意查收！`)
  }, timeDiff)

  // 保存定时器，用于后续清除
  reminderTimers.value.push({
    agendaId: agenda.id,
    timer: timer
  })

  // 提示用户提醒已设置
  showToast(`提醒已设置成功！将在${formatLocaleTime(reminderDate)}发送通知（会议提前15分钟）`)
}

/**
 * 方法2：添加议程到手机原生日历（原生闹钟提醒，兼容iOS/Android）
 * @param {object} agenda 议程对象
 */
const addToMobileCalendar = (agenda) => {
  // 1. 解析议程时间（兼容现有议程格式）
  const agendaTimeStr = agenda.time.replace(' ', 'T')
  const agendaDate = new Date(agendaTimeStr)

  // 2. 校验时间有效性
  if (!isFutureDate(agendaDate)) {
    return showToast('会议时间已过期，无法添加到日历')
  }

  // 3. 设定会议结束时间（默认1小时，可修改）
  const endDate = new Date(agendaDate.getTime() + 60 * 60 * 1000)

  // 4. 格式化日历所需日期
  const startDateStr = formatCalendarDate(agendaDate)
  const endDateStr = formatCalendarDate(endDate)
  if (!startDateStr || !endDateStr) {
    return showToast('格式化日期失败，无法添加到日历')
  }

  // 5. 构造日历事件内容
  const calendarTitle = encodeURIComponent(`【会议】${agenda.title}`)
  const calendarDesc = encodeURIComponent(`会议时间：${agenda.time}\n备注：${agenda.remark || '无'}\n标签：${agenda.tags.join('、') || '无'}`)

  // 6. 兼容iOS和Android系统
  let calendarUrl = ''
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)

  if (isIOS) {
    // iOS：生成iCal格式文件，触发下载.ics
    calendarUrl = `data:text/calendar;charset=utf-8,BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Meeting System//CN//EN
BEGIN:VEVENT
TITLE:${calendarTitle}
DESCRIPTION:${calendarDesc}
DTSTART:${startDateStr}
DTEND:${endDateStr}
PRIORITY:5
END:VEVENT
END:VCALENDAR`.replace(/\n/g, '')
  } else {
    // Android：唤起Google日历（兼容国产日历APP）
    calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE
&text=${calendarTitle}
&details=${calendarDesc}
&dates=${startDateStr}/${endDateStr}
&hl=zh-CN
&ctz=Asia/Shanghai`.replace(/\n/g, '')
  }

  // 7. 触发日历跳转/下载
  const link = document.createElement('a')
  link.href = calendarUrl
  link.download = isIOS ? `${agenda.title}.ics` : ''
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // 8. 提示用户
  showToast(isIOS ? '日历文件已生成，请导入手机日历' : '正在唤起日历APP，请稍候')
}
</script>

<style scoped>
/* 页面基础样式 */
.home-page {
  min-height: 100vh;
  box-sizing: border-box;
  background-color: #f5f5f5;
}

.home-scroll-content {
  padding: 10px;
  padding-bottom: 65px; /* 预留tabbar空间 */
  overflow-y: auto;
  height: calc(100vh - 0px);
  box-sizing: border-box;
}

.page-content {
  width: 100%;
  box-sizing: border-box;
}

.mb-4 {
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

/* 倒计时样式 */
.countdown-container {
  text-align: center;
  padding: 10px 0;
}

.countdown-text {
  font-size: 18px;
  color: #ff4d4f;
  margin-bottom: 8px;
}

.countdown-tip {
  font-size: 12px;
  color: #666;
}

/* 会议流程跳转按钮样式 */
.countdown-enter {
  margin-top: 12px;
  text-align: center;
}

.enter-meeting-btn {
  background-color: #1989fa;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  padding: 6px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.enter-meeting-btn:hover {
  background-color: #1677ff;
}

/* 重要通知样式 */
.notice-container {
  padding: 8px 0;
}

.notice-empty {
  font-size: 14px;
  color: #999;
  text-align: center;
  padding: 20px 0;
}

.notice-item {
  padding: 12px 0;
}

.notice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.notice-type {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.notice-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  background-color: #e6f7ff;
  color: #1989fa;
}

.notice-status.已生效 {
  background-color: #f0fff4;
  color: #52c41a;
}

.notice-content {
  font-size: 12px;
  color: #666;
  line-height: 1.6;
}

.notice-title {
  font-weight: 500;
  color: #333;
}

.notice-desc {
  margin: 4px 0;
}

.notice-time {
  color: #999;
  margin-top: 4px;
}

.notice-divider {
  height: 1px;
  background-color: #f0f0f0;
  margin: 12px 0;
}

/* 创建议程按钮样式 */
.create-agenda-btn {
  background-color: #1989fa;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}

.create-agenda-btn:hover {
  background-color: #1677ff;
}

/* 加载/错误提示样式 */
.loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 999;
}

.loading-content {
  font-size: 14px;
  color: #1989fa;
}

.error-bar {
  background-color: #fff2f2;
  color: #ff4d4f;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.error-close {
  font-size: 16px;
  font-weight: bold;
}

/* 议程列表样式 */
.agenda-list {
  width: 100%;
}

.empty-tip {
  font-size: 14px;
  color: #999;
  text-align: center;
  padding: 40px 0;
  background-color: #fff;
  border-radius: 8px;
  margin-bottom: 10px;
}

.agenda-item {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 10px;
}

.agenda-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.agenda-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  cursor: pointer;
  word-wrap: break-word;
  line-height: 1.5;
  flex: 1;
  margin-right: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agenda-time {
  font-size: 12px;
  color: #666;
  background-color: #f5fafe;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

/* 议程操作按钮样式 */
.agenda-actions {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.btn-normal {
  background-color: #f5f5f5;
  color: #333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  padding: 3px 6px;
  font-size: 12px;
}

.btn-normal:hover {
  background-color: #e5e5e5;
}

.btn-normal.collected {
  background-color: #fff2f2;
  color: #ff4d4f;
}

.btn-danger {
  background-color: #ff4d4f;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  padding: 4px 8px;
  transition: background-color 0.3s ease;
}

.btn-danger:hover {
  background-color: #ff3333;
}

/* 标签样式 */
.agenda-tags {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.tag-item {
  padding: 2px 6px;
  font-size: 12px;
  background-color: #e6f7ff;
  color: #1989fa;
  border-radius: 4px;
}

/*备注样式 */
.agenda-remark {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.remark-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
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

.remark-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-start;
}

.remark-edit {
  background-color: #e6f7ff !important;
  color: #1989fa !important;
}

/* 弹窗样式 */
.dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
  width: 80%;
  max-width: 400px;
}

.dialog-lg {
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.dialog-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
  text-align: center;
}

.form-item {
  margin-bottom: 16px;
}

.form-label {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
  display: block;
}

.form-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.dialog-btn-group {
  display: flex;
  gap: 10px;
}

.dialog-cancel-btn {
  flex: 1;
  padding: 10px 0;
  background-color: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.dialog-confirm-btn {
  width: 50%;
  padding: 10px 0;
  background-color: #1989fa;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

/* 标签选择弹窗样式 */
.tag-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.tag-option {
  padding: 6px 12px;
  font-size: 14px;
  background-color: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
}

.tag-option.selected {
  background-color: #e6f7ff;
  color: #1989fa;
}

/* 备注输入框样式 */
.remark-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  resize: none;
  margin-bottom: 16px;
}

/* 分享弹窗样式 */
.share-content {
  margin-bottom: 20px;
}

.share-tips {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
}

.share-link {
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
  word-break: break-all;
  color: #666;
  margin-bottom: 10px;
}

/* Toast提示样式 */
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
  padding: 12px 20px;
  border-radius: 20px;
  font-size: 14px;
}
</style>