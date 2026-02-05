<template>
  <div class="home-page">
    <div class="home-scroll-content">
      <div class="page-content">
        <!-- 会议状态卡片 -->
        <el-card class="mb-4" shadow="hover">
          <template #header>
            <h3 class="card-title">会议状态</h3>
          </template>
          <div class="upcoming-container">
            <div class="empty-tip" v-if="meetingStatusAgendas.length === 0 && !loading">
              暂无相关会议议程
            </div>
            <div
              class="upcoming-item"
              v-for="agenda in meetingStatusAgendas"
              :key="agenda.id"
              :class="{
                'status-ongoing': agenda.meetingStatus === 'ongoing',
                'status-upcoming': agenda.meetingStatus === 'upcoming',
                'status-ended': agenda.meetingStatus === 'ended'
              }"
            >
              <div class="upcoming-header">
                <div class="upcoming-title">{{ agenda.title }}</div>
                <div class="upcoming-status-tag">
                  {{ 
                    agenda.meetingStatus === 'ongoing' ? '正在进行' : 
                    agenda.meetingStatus === 'upcoming' ? '即将开始' : '已结束' 
                  }}
                </div>
              </div>
              <div class="upcoming-time">会议时间：{{ agenda.time }}</div>
              <div class="upcoming-tags" v-if="agenda.tags.length > 0">
                <span class="tag-item" v-for="tag in agenda.tags" :key="tag">{{ tag }}</span>
              </div>
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
            暂无会议议程，前往「我的」页面创建吧~
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
              <button class="btn-normal mini-btn" @click="openTagDialog(agenda)" :disabled="agendaLoading">
                标签
              </button>
              <button
                class="btn-normal mini-btn"
                @click="openRemarkDialog(agenda)"
                :disabled="agendaLoading"
              >
                备注
              </button>
              <button
                class="btn-normal mini-btn"
                :class="{ collected: agenda.isCollected }"
                @click="handleToggleCollect(agenda.id)"
                :disabled="collectLoading"
              >
                {{ agenda.isCollected ? "已收藏" : "收藏" }}
              </button>
              <button
                class="btn-normal mini-btn"
                @click="openShareDialog(agenda)"
                :disabled="agendaLoading"
              >
                分享
              </button>
              <!-- 会议提醒按钮 -->
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
                :disabled="agendaLoading"
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
                <button class="btn-normal mini-btn remark-edit" @click="openRemarkDialog(agenda)" :disabled="agendaLoading">
                  修改
                </button>
                <button class="btn-danger mini-btn remark-delete" @click="deleteAgendaRemark(agenda.id)" :disabled="agendaLoading">
                  删除
                </button>
              </div>
            </div>
          </div>
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
        <div class="dialog-btn-group">
          <button
            class="dialog-cancel-btn"
            @click="editDialogVisible = false"
            :disabled="agendaLoading"
          >
            取消
          </button>
          <button class="dialog-confirm-btn" @click="handleEditAgenda" :disabled="agendaLoading">
            <span v-if="agendaLoading">提交中...</span>
            <span v-else>确认修改</span>
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
            :disabled="agendaLoading"
          >
            {{ tag }}
          </div>
        </div>
        <button class="dialog-confirm-btn" @click="saveTags" :disabled="agendaLoading">
          <span v-if="agendaLoading">保存中...</span>
          <span v-else>确认保存</span>
        </button>
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
          :disabled="agendaLoading"
        ></textarea>
        <div class="dialog-btn-group">
          <button
            class="dialog-cancel-btn"
            @click="remarkDialogVisible = false"
            :disabled="agendaLoading"
          >
            取消
          </button>
          <button class="dialog-confirm-btn" @click="saveRemark" :disabled="agendaLoading">
            <span v-if="agendaLoading">提交中...</span>
            <span v-else>确认</span>
          </button>
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

    <!-- 操作提示-->
    <div class="toast-mask" v-if="toastVisible">
      <div class="toast-content">
        {{ toastText }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAgendaStore } from '../../stores/agendaStore'
import { useScheduleStore } from '../../stores/scheduleStore'
// 引入收藏API（如需直接调用，也可从Store方法复用）
import { collectApi } from '../../api/index'

// 初始化Pinia仓库
const agendaStore = useAgendaStore()
const scheduleStore = useScheduleStore()

// 解构仓库响应式数据（包含后端加载状态和错误信息）
const { agendaList, agendaLoading, agendaError } = storeToRefs(agendaStore)
const { notifications, collectLoading, collectError } = storeToRefs(scheduleStore)

// 解构仓库异步方法（对接后端API）
const { 
  fetchMyAgendas, 
  updateAgenda, 
  saveAgendaTags, 
  saveAgendaRemark, 
  deleteAgenda 
} = agendaStore
const { toggleFlowStepCollect } = scheduleStore

// 初始化路由
const router = useRouter()

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

const editDialogVisible = ref(false)
const editAgenda = ref({
  id: null,
  title: "",
  time: ""
})

const reminderTimers = ref([])

// 配置常量（保持原有业务逻辑）
const CLEAN_HOUR = 8 // 次日早上清理时间（默认8:00）
const UPCOMING_RANGE = 2 * 60 * 60 * 1000 // 即将开始：2小时内
const ENDED_RANGE = 1 * 60 * 60 * 1000 // 正在进行：会议开始后1小时内
let dailyCleanTimer = null // 每日清理定时器

// 格式化日期（获取年月日）
const formatDate = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

// 判断是否为前一天的日期
const isYesterday = (agendaTime) => {
  const today = new Date()
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  const agendaDate = new Date(agendaTime.replace(' ', 'T'))

  // 比较年月日
  const agendaDateStamp = formatDate(agendaDate)
  const yesterdayStamp = formatDate(yesterday)
  const todayStamp = formatDate(today)

  // 前一天日期 && 早于当天0点（已结束）
  return agendaDateStamp === yesterdayStamp && agendaDateStamp < todayStamp
}

// 筛选会议状态：即将开始/正在进行/已结束（业务逻辑不变，数据来源改为后端）
const meetingStatusAgendas = computed(() => {
  if (!agendaList.value || agendaList.value.length === 0) return []

  const now = new Date()
  const todayStamp = formatDate(now)

  return agendaList.value
    .map(agenda => {
      // 解析议程时间
      const agendaTimeStr = agenda.time.replace(' ', 'T')
      const agendaDate = new Date(agendaTimeStr)
      const timeDiff = agendaDate.getTime() - now.getTime()
      const agendaDateStamp = formatDate(agendaDate)

      // 标记状态
      let meetingStatus = ''
      if (agendaDateStamp >= todayStamp) { // 当天及未来的会议
        if (timeDiff > 0 && timeDiff <= UPCOMING_RANGE) {
          meetingStatus = 'upcoming' // 即将开始（绿色）
        } else if (timeDiff <= 0 && timeDiff >= -ENDED_RANGE) {
          meetingStatus = 'ongoing' // 正在进行（橙色）
        } else if (timeDiff < -ENDED_RANGE) {
          meetingStatus = 'ended' // 当天已结束（灰色）
        }
      } else if (agendaDateStamp === formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))) {
        // 前一天的会议（保留，待次日早上清理）
        meetingStatus = 'ended' // 已结束（灰色）
      }

      return {
        ...agenda,
        meetingStatus
      }
    })
    .filter(agenda => agenda.meetingStatus) // 只保留有状态的议程
    .sort((a, b) => {
      // 优先级：正在进行 > 即将开始 > 已结束
      const statusOrder = { ongoing: 0, upcoming: 1, ended: 2 }
      if (a.meetingStatus !== b.meetingStatus) {
        return statusOrder[a.meetingStatus] - statusOrder[b.meetingStatus]
      }
      // 同状态按会议时间升序排列（自动叠加）
      const aTime = new Date(a.time.replace(' ', 'T')).getTime()
      const bTime = new Date(b.time.replace(' ', 'T')).getTime()
      return aTime - bTime
    })
})

// 会议状态列表实时刷新
watch(agendaList, () => {}, { deep: true })

// 格式化当前时间
const formatCurrentDateTime = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hour}:${minute}`
}

// 验证日期是否为未来日期（用于提醒功能）
const isFutureDate = (date) => {
  if (!(date instanceof Date)) return false
  const now = new Date()
  return date.getTime() > now.getTime()
}

// 格式化日历日期（符合iCal标准，用于手机日历导入）
const formatCalendarDate = (date) => {
  if (!(date instanceof Date)) return ''
  return date.toISOString()
    .replace(/-/g, '')
    .replace(/:/g, '')
    .replace(/\.\d{3}Z/, 'Z')
}

// 格式化时间显示
const formatLocaleTime = (date) => {
  if (!(date instanceof Date)) return ''
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 改造：清理前一天已结束的会议（对接后端接口，不再修改本地存储）
const clearYesterdayAgendas = async () => {
  if (!agendaList.value || agendaList.value.length === 0) return

  try {
    // 1. 筛选出需要清理的前一天议程ID
    const needDeleteIds = agendaList.value
      .filter(agenda => isYesterday(agenda.time))
      .map(agenda => agenda.id)

    if (needDeleteIds.length === 0) return

    // 2. 批量调用后端删除接口（若后端无批量接口，可循环调用单个删除）
    for (const id of needDeleteIds) {
      await deleteAgenda(id)
    }

    // 3. 刷新前端议程列表（拉取最新数据）
    await fetchMyAgendas()

    // 4. 提示用户
    showToast(`已自动清理${needDeleteIds.length}条前一天已结束的会议`)
    console.log(`[每日自动清理] 已清空${needDeleteIds.length}条前一天已结束的会议`)
  } catch (err) {
    console.error('每日清理议程失败：', err)
    showToast('自动清理已结束会议失败，请手动处理')
  }
}

// 计算距离次日清理时间的毫秒数
const getTimeToNextClean = () => {
  const now = new Date()
  // 次日清理时间
  const nextClean = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    CLEAN_HOUR,
    0,
    0,
    0
  )
  return nextClean.getTime() - now.getTime()
}

// 启动每日定时清理任务（逻辑不变，内部调用异步后端方法）
const startDailyCleanTask = () => {
  // 清除已有定时器
  if (dailyCleanTimer) clearTimeout(dailyCleanTimer)

  // 计算距离下次清理的时间
  const timeToNextClean = getTimeToNextClean()

  // 设置一次性定时器，到点执行清理
  dailyCleanTimer = setTimeout(() => {
    // 执行异步清理
    clearYesterdayAgendas()
    // 清理完成后，重新启动下一日的定时任务
    startDailyCleanTask()
  }, timeToNextClean)
}

// 改造：页面挂载时加载后端数据（不再加载本地存储）
onMounted(async () => {
  loading.value = true
  try {
    // 1. 从后端拉取议程列表（核心：替换本地存储加载）
    await fetchMyAgendas()

    // 2. 从后端拉取收藏列表（同步收藏状态）
    await scheduleStore.fetchMyCollects()

    // 3. 检查当前时间是否已过今日清理时间，如需立即清理
    const now = new Date()
    const todayClean = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      CLEAN_HOUR,
      0,
      0,
      0
    )

    if (now.getTime() > todayClean.getTime()) {
      await clearYesterdayAgendas()
    }

    // 4. 启动每日定时清理任务
    startDailyCleanTask()
  } catch (err) {
    errorMsg.value = "数据加载失败，请刷新页面"
    console.error("数据加载异常：", err)
  } finally {
    loading.value = false
  }

  // 监听Store错误信息，同步到页面
  watch([agendaError, collectError], ([agendaErr, collectErr]) => {
    if (agendaErr) errorMsg.value = agendaErr
    if (collectErr && !errorMsg.value) errorMsg.value = collectErr
  }, { immediate: true })
})

// 页面卸载时：清除所有定时器
onUnmounted(() => {
  // 清除会议提醒定时器
  reminderTimers.value.forEach(item => {
    clearTimeout(item.timer)
  })

  // 清除每日清理定时器
  if (dailyCleanTimer) {
    clearTimeout(dailyCleanTimer)
    dailyCleanTimer = null
  }
})

// 提示方法
const showToast = (text) => {
  toastText.value = text
  toastVisible.value = true
  setTimeout(() => {
    toastVisible.value = false
  }, 2000)
}

// 清除错误提示条
const clearErrorMsg = () => {
  errorMsg.value = ""
}

// 打开标签选择弹窗
const openTagDialog = (agenda) => {
  currentAgendaId.value = agenda.id
  currentAgendaTags.value = [...agenda.tags]
  tagDialogVisible.value = true
}

// 切换标签选中状态
const toggleTag = (tag) => {
  const index = currentAgendaTags.value.findIndex(item => item === tag)
  if (index > -1) {
    currentAgendaTags.value.splice(index, 1)
  } else {
    currentAgendaTags.value.push(tag)
  }
}

// 改造：保存标签修改（异步对接后端）
const saveTags = async () => {
  if (!currentAgendaId.value || agendaLoading.value) return

  try {
    await saveAgendaTags(currentAgendaId.value, currentAgendaTags.value)
    tagDialogVisible.value = false
    showToast("标签保存成功")
  } catch (err) {
    console.error('保存标签失败：', err)
    showToast("标签保存失败，请稍后重试")
  }
}

// 打开备注编辑弹窗
const openRemarkDialog = (agenda) => {
  currentAgendaId.value = agenda.id
  currentRemark.value = agenda.remark || ""
  remarkDialogVisible.value = true
}

// 改造：保存备注修改（异步对接后端）
const saveRemark = async () => {
  if (!currentAgendaId.value || agendaLoading.value) return

  try {
    await saveAgendaRemark(currentAgendaId.value, currentRemark.value.trim())
    remarkDialogVisible.value = false
    showToast("备注保存成功")
  } catch (err) {
    console.error('保存备注失败：', err)
    showToast("备注保存失败，请稍后重试")
  }
}

// 改造：删除备注（异步对接后端）
const deleteAgendaRemark = async (agendaId) => {
  if (agendaLoading.value) return

  try {
    await saveAgendaRemark(agendaId, "")
    showToast("备注已删除")
  } catch (err) {
    console.error('删除备注失败：', err)
    showToast("备注删除失败，请稍后重试")
  }
}

// 打开分享弹窗
const openShareDialog = (agenda) => {
  // 改造：分享链接对接后端域名（可配置为全局环境变量）
  const baseUrl = import.meta.env.VITE_APP_BASE_URL || "https://meeting-system.com"
  currentShareLink.value = `${baseUrl}/agenda/${agenda.id}?title=${encodeURIComponent(agenda.title)}`
  shareDialogVisible.value = true
}

// 复制分享链接到剪贴板
const copyLink = () => {
  navigator.clipboard.writeText(currentShareLink.value).then(() => {
    showToast("链接已复制到剪贴板")
  }).catch(() => {
    showToast("复制失败，请手动复制")
  })
}

// 改造：切换议程收藏状态（异步对接后端收藏API）
const handleToggleCollect = async (agendaId) => {
  if (collectLoading.value) return

  // 找到当前议程（获取stepIndex，默认0，若有多步骤需调整）
  const agenda = agendaList.value.find(item => item.id === agendaId)
  if (!agenda) return showToast("议程不存在，无法操作收藏")

  // 调用Store中的异步收藏切换方法（对接后端）
  const success = await toggleFlowStepCollect(agendaId, 0) // 此处stepIndex默认0，根据实际业务调整
  if (!success) {
    showToast(collectError.value || "收藏操作失败，请稍后重试")
    return
  }

  // 操作成功提示
  const latestAgenda = agendaList.value.find(item => item.id === agendaId)
  if (latestAgenda) {
    showToast(latestAgenda.isCollected ? "收藏成功" : "已取消收藏")
  }
}

// 改造：删除指定议程并清除对应提醒定时器（异步对接后端）
const handleDeleteAgenda = async (agendaId) => {
  if (agendaLoading.value) return

  // 清除该议程对应的提醒定时器
  reminderTimers.value = reminderTimers.value.filter(item => {
    if (item.agendaId === agendaId) {
      clearTimeout(item.timer)
      return false
    }
    return true
  })

  // 确认删除
  if (!confirm("确定要删除该议程吗？删除后不可恢复")) return

  try {
    await deleteAgenda(agendaId)
    // 刷新议程列表
    await fetchMyAgendas()
    showToast("议程已删除")
  } catch (err) {
    console.error('删除议程失败：', err)
    showToast("议程删除失败，请稍后重试")
  }
}

// 打开编辑弹窗
const openEditDialog = (agenda) => {
  const editTime = agenda.time.replace(' ', 'T')
  editAgenda.value = {
    id: agenda.id,
    title: agenda.title,
    time: editTime
  }
  editDialogVisible.value = true
}

// 改造：保存编辑修改（异步对接后端）
const handleEditAgenda = async () => {
  if (agendaLoading.value) return
  if (!editAgenda.value.title.trim()) {
    return showToast("请输入议程标题")
  }

  try {
    // 格式化时间（适配后端存储格式）
    const formattedTime = editAgenda.value.time.replace('T', ' ')
    // 调用异步更新方法
    const success = await updateAgenda(editAgenda.value.id, {
      title: editAgenda.value.title,
      time: formattedTime
    })

    if (!success) throw new Error("更新议程接口返回失败")

    editDialogVisible.value = false
    showToast("议程修改成功")
  } catch (err) {
    console.error('修改议程失败：', err)
    showToast("议程修改失败，请稍后重试")
  }
}

/**
 * 设置浏览器本地通知提醒（提前15分钟触发）（原有逻辑不变，仅数据来源为后端）
 * @param {object} agenda 议程对象
 */
const setBrowserReminder = (agenda) => {
  // 1. 解析议程时间
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

  // 3. 检查并请求浏览器通知权限
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
 * 创建浏览器提醒定时器（原有逻辑不变）
 * @param {object} agenda 议程对象
 * @param {Date} reminderDate 提醒触发日期
 */
const createBrowserReminderTimer = (agenda, reminderDate) => {
  // 清除该议程已存在的提醒定时器
  reminderTimers.value = reminderTimers.value.filter(item => {
    if (item.agendaId === agenda.id) {
      clearTimeout(item.timer)
      return false
    }
    return true
  })

  // 计算当前到提醒时间的差值
  const now = new Date()
  const timeDiff = reminderDate.getTime() - now.getTime()

  // 创建新的定时器
  const timer = setTimeout(() => {
    const notification = new Notification('【会议倒计时提醒】', {
      body: `《${agenda.title}》即将在15分钟后开始（会议时间：${agenda.time}），请做好准备！`,
      icon: '/favicon.ico', 
      requireInteraction: true, 
      tag: `agenda-reminder-${agenda.id}`
    })

    // 通知点击事件：聚焦到当前页面并关闭通知
    notification.onclick = () => {
      window.focus()
      notification.close()
    }

    // 弹出内部提示
    showToast(`《${agenda.title}》即将开始，请注意查收！`)
  }, timeDiff)

  // 保存定时器到列表
  reminderTimers.value.push({
    agendaId: agenda.id,
    timer: timer
  })

  // 提示用户提醒已设置成功
  showToast(`提醒已设置成功！将在${formatLocaleTime(reminderDate)}发送通知（会议提前15分钟）`)
}

/**
 * 添加议程到手机原生日历（兼容iOS/Android）（原有逻辑不变）
 * @param {object} agenda 议程对象
 */
const addToMobileCalendar = (agenda) => {
  // 1. 解析议程时间
  const agendaTimeStr = agenda.time.replace(' ', 'T')
  const agendaDate = new Date(agendaTimeStr)

  // 2. 校验时间有效性
  if (!isFutureDate(agendaDate)) {
    return showToast('会议时间已过期，无法添加到日历')
  }

  // 3. 设定会议结束时间（默认1小时）
  const endDate = new Date(agendaDate.getTime() + 1 * 60 * 60 * 1000)

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

  // 8. 提示用户操作结果
  showToast(isIOS ? '日历文件已生成，请导入手机日历' : '正在唤起日历APP，请稍候')
}
</script>

<style scoped>
/* 页面基础 */
.home-page {
  min-height: 100vh;
  box-sizing: border-box;
  background-color: #f5f5f5;
}

.home-scroll-content {
  padding: 10px;
  padding-bottom: 65px; 
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

/* 会议状态 */
.upcoming-container {
  padding: 8px 0;
}

.upcoming-item {
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

/* 正在进行 */
.upcoming-item.status-ongoing {
  background-color: #fff7e6;
  border: 1px solid #fa8c16;
}

.upcoming-item.status-ongoing .upcoming-status-tag {
  background-color: #fa8c16;
  color: #fff;
}

/* 即将开始 */
.upcoming-item.status-upcoming {
  background-color: #f0fff4;
  border: 1px solid #52c41a;
}

.upcoming-item.status-upcoming .upcoming-status-tag {
  background-color: #52c41a;
  color: #fff;
}

/* 已结束 */
.upcoming-item.status-ended {
  background-color: #f5f5f5;
  border: 1px solid #d9d9d9;
}

.upcoming-item.status-ended .upcoming-status-tag {
  background-color: #8c8c8c;
  color: #fff;
}

.upcoming-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.upcoming-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upcoming-status-tag {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  white-space: nowrap;
}

.upcoming-time {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.upcoming-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* 重要通知 */
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
  margin: 0 0 4px 0;
}

.notice-desc {
  margin: 0 0 4px 0;
}

.notice-time {
  color: #999;
  margin: 0;
}

.notice-divider {
  height: 1px;
  background-color: #f0f0f0;
  margin: 12px 0;
}

/* 加载/错误提示 */
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
/* 议程列表 */
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

/* 议程操作按钮 */
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

.btn-normal:hover:not(:disabled) {
  background-color: #e5e5e5;
}

.btn-normal.collected {
  background-color: #fff2f2;
  color: #ff4d4f;
}

.btn-normal:disabled {
  background-color: #f9f9f9;
  color: #ccc;
  cursor: not-allowed;
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

.btn-danger:hover:not(:disabled) {
  background-color: #ff3333;
}

.btn-danger:disabled {
  background-color: #ffcccc;
  cursor: not-allowed;
}

.mini-btn {
  white-space: nowrap;
}

/* 标签 */
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

/* 备注 */
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

/* 弹窗通用 */
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

.form-input:disabled {
  background-color: #f9f9f9;
  border-color: #eee;
  color: #ccc;
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
  transition: background-color 0.3s ease;
}

.dialog-cancel-btn:hover:not(:disabled) {
  background-color: #e5e5e5;
}

.dialog-cancel-btn:disabled {
  background-color: #f9f9f9;
  color: #ccc;
  cursor: not-allowed;
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
  transition: background-color 0.3s ease;
}

.dialog-confirm-btn:hover:not(:disabled) {
  background-color: #096dd9;
}

.dialog-confirm-btn:disabled {
  background-color: #8cc5ff;
  cursor: not-allowed;
}

/* 标签选择弹窗 */
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
  transition: all 0.3s ease;
}

.tag-option.selected {
  background-color: #e6f7ff;
  color: #1989fa;
}

.tag-option:disabled {
  background-color: #f9f9f9;
  color: #ccc;
  cursor: not-allowed;
}

/* 备注弹窗 */
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

.remark-input:disabled {
  background-color: #f9f9f9;
  border-color: #eee;
  color: #ccc;
}

/* 分享弹窗 */
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

.btn-primary {
  background-color: #1989fa;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn-primary:hover {
  background-color: #096dd9;
}
 /* 提示样式 */
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