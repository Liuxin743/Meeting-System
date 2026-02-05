<template>
  <div class="meeting-venue-container">
    <!-- 宣传图 -->
    <div class="meeting-banner">
      <img
        class="banner-img"
        :src="bannerImageUrl || defaultBannerUrl"
        alt="会议宣传图"
        loading="lazy"
      />
    </div>

    <!-- 标题 -->
    <div class="page-title-wrap">
      <h1 class="page-title">会议会场详情</h1>
    </div>

    <!-- 会场切换标签 -->
    <div class="tab-switch-container">
      <div
        class="tab-item"
        v-for="(venue, index) in customVenues"
        :key="venue.id"
        :class="{ active: activeVenueId === venue.id }"
        @click="switchVenue(venue.id)"
      >
        {{ venue.name }}
      </div>
    </div>

    <!-- 空会场提示/加载中提示 -->
    <div class="empty-venue-tip" v-if="!loading && customVenues.length === 0">
      暂无自定义会场，请先在个人中心创建会场
    </div>
    <div class="empty-venue-tip" v-if="loading">
      正在加载会场数据...
    </div>

    <!-- 会场内容 -->
    <div class="page-content" v-else>
      <!-- 当前会场信息卡片 -->
      <div class="venue-card" :style="{ borderLeft: `4px solid ${currentVenue.color}` }">
        <div class="venue-header">
          <span class="venue-tag" :style="{ backgroundColor: currentVenue.color }">{{ currentVenue.type }}</span>
          <h2 class="venue-title">{{ currentVenue.name }}</h2>
        </div>
        <div class="venue-info">
          <div class="info-item">
            <span class="info-label">会议时间：</span>
            <span class="info-content">{{ formatTime(currentVenue.time) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">会议地址：</span>
            <span class="info-content">{{ currentVenue.address }}</span>
          </div>
          <div class="info-item content-item">
            <span class="info-label">会场描述：</span>
            <div class="info-content content-desc">{{ currentVenue.desc || '无描述' }}</div>
          </div>
        </div>
      </div>

      <!-- 当前会场的议程列表 -->
      <div class="flow-content">
        <div class="flow-header">
          <h3 class="flow-title">{{ currentVenue.name }}会议流程</h3>
        </div>

        <!-- 空议程提示/加载中提示 -->
        <div class="empty-tip" v-if="!loading && currentVenueAgendas.length === 0">
          暂无该会场的议程，请先在个人中心创建议程
        </div>
        <div class="empty-tip" v-if="loading">
          正在加载议程数据...
        </div>

        <!-- 议程列表 -->
        <div class="flow-step-list" v-else>
          <div 
            class="agenda-item" 
            v-for="(agenda, aIndex) in currentVenueAgendas" 
            :key="agenda.id"
          >
            <!-- 议程标题 -->
            <div 
              class="agenda-title" 
              @click="toggleAgendaExpand(agenda.id)"
              :style="{ borderLeftColor: currentVenue.color }"
            >
              <span class="agenda-num" :style="{ backgroundColor: currentVenue.color, color: '#fff' }">
                {{ aIndex + 1 }}
              </span>
              <span class="expand-icon" :class="{ expanded: expandedAgendaIds.includes(agenda.id) }">
                {{ expandedAgendaIds.includes(agenda.id) ? '▼' : '▶' }}
              </span>
              {{ agenda.title }}
            </div>
            
            <!-- 当前议程的流程步骤 -->
            <div class="custom-flow-list" v-if="expandedAgendaIds.includes(agenda.id)">
              <div 
                class="custom-flow-step" 
                v-for="(step, sIndex) in agenda.flows" 
                :key="`${agenda.id}-${sIndex}`"
              >
                <div class="custom-step-header">
                  <span class="custom-step-num" :style="{ backgroundColor: currentVenue.color, color: '#fff' }">
                    {{ sIndex + 1 }}
                  </span>
                  <div class="step-info-wrap">
                    <h4 class="custom-step-title">{{ step.title }}</h4>
                    <div class="custom-step-desc">{{ step.desc || '无描述' }}</div>
                    <div class="step-meta">
                      <span class="custom-step-time" :style="{ color: currentVenue.color }">
                        {{ formatTime(step.time || agenda.time) }}
                      </span>
                      <span class="custom-step-address">
                        地址：{{ step.address || currentVenue.address }}
                      </span>
                    </div>
                    <!-- 收藏/备注 -->
                    <div class="step-actions-bottom">
                      <span 
                        class="action-btn collect-btn"
                        :class="{ collected: isFlowStepCollected(agenda.id, sIndex) }"
                        @click.stop="toggleFlowStepCollect(agenda.id, sIndex)"
                        :disabled="apiLoading"
                      >
                        {{ apiLoading ? '处理中...' : (isFlowStepCollected(agenda.id, sIndex) ? '已收藏' : '收藏') }}
                      </span>
                      <span 
                        class="action-btn remark-btn"
                        @click.stop="openFlowStepRemarkModal(agenda.id, sIndex, step)"
                      >
                        {{ getFlowStepRemark(agenda.id, sIndex) ? '已备注' : '备注' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 流程步骤备注弹窗 -->
  <div class="modal-mask" v-if="stepRemarkModalVisible" @click="closeStepRemarkModal">
    <div class="modal-content" @click.stop>
      <h3 class="modal-title">备注 - {{ currentStepRemarkTitle }}</h3>
      <textarea
        class="form-input remark-input"
        v-model="currentStepRemarkContent"
        placeholder="请输入备注内容..."
        rows="3"
      ></textarea>
      <div class="modal-btns">
        <button class="modal-btn cancel-btn" @click="closeStepRemarkModal">取消</button>
        <button class="modal-btn confirm-btn" @click="saveFlowStepRemark" :disabled="apiLoading">
          {{ apiLoading ? '保存中...' : '保存备注' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import { useAgendaStore } from '../../stores/agendaStore';
import { useScheduleStore } from '../../stores/scheduleStore';
import { meetingApi, venueApi, agendaApi, collectApi } from '../../api/index'; // 替换为你的 api 实际路径

// 初始化仓库
const agendaStore = useAgendaStore();
const scheduleStore = useScheduleStore();

// 新增：API 加载状态（防止重复操作，优化用户体验）
const loading = ref(false); // 页面初始化加载状态
const apiLoading = ref(false); // 操作类 API 加载状态

// 会场数据（从后端拉取，不再从 localStorage 读取）
const customVenues = ref([]);
// 备注数据（暂时保留本地，如需持久化可新增 remarkApi 对接后端）
const userRemarks = ref({
  agendas: {},
  flowSteps: {}
});

// 宣传图数据（暂时保留本地，如需对接后端可新增 bannerApi）
const bannerImageUrl = ref(localStorage.getItem('meetingBannerUrl') || '');
const defaultBannerUrl = ref('https://img.ixintu.com/download/jpg/202308/6673017c157638922.jpg');

// 激活的会场ID
const activeVenueId = ref('');
// 折叠/展开状态
const expandedAgendaIds = ref([]);

// 备注弹窗
const stepRemarkModalVisible = ref(false);
const currentStepRemarkAgendaId = ref('');
const currentStepRemarkIndex = ref(-1);
const currentStepRemarkTitle = ref('');
const currentStepRemarkContent = ref('');

// 当前选中的会场
const currentVenue = computed(() => {
  return customVenues.value.find(venue => venue.id === activeVenueId.value) || {};
});

// 会场的议程（从后端拉取的议程列表中过滤）
const currentVenueAgendas = computed(() => {
  return agendaStore.agendaList.filter(agenda => agenda.venueId === activeVenueId.value);
});

// 时间格式化方法（保留原有逻辑，优化兼容性）
function formatTime(datetimeStr) {
  if (!datetimeStr) return '未设置';
  
  // 处理不同时间格式
  let date;
  if (datetimeStr.includes('T')) {
    date = new Date(datetimeStr);
  } else if (datetimeStr.includes(' ')) {
    const [datePart, timePart] = datetimeStr.split(' ');
    date = new Date(`${datePart}T${timePart}`);
  } else {
    date = new Date(datetimeStr);
  }

  if (isNaN(date.getTime())) {
    if (datetimeStr.includes('-')) return datetimeStr;
    return '时间格式错误';
  }

  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')} - ${date.getHours() + 1}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// ========== 收藏相关方法（对接后端 API，核心修改） ==========
function isFlowStepCollected(agendaId, stepIndex) {
  return scheduleStore.isFlowStepCollected(agendaId, stepIndex);
}

async function toggleFlowStepCollect(agendaId, stepIndex) {
  try {
    apiLoading.value = true;
    // 1. 调用后端收藏/取消收藏 API
    const isCollected = isFlowStepCollected(agendaId, stepIndex);
    if (isCollected) {
      // 取消收藏
      await collectApi.removeCollect(agendaId, stepIndex);
    } else {
      // 新增收藏
      await collectApi.addCollect({ agendaId, stepIndex });
    }

    // 2. 同步前端仓库状态
    scheduleStore.toggleFlowStepCollect(agendaId, stepIndex);
    agendaStore.toggleAgendaCollect(agendaId);
    
    setTimeout(() => {
      agendaStore.agendaList = [...agendaStore.agendaList];
    }, 0);

    // 3. 提示用户操作结果
    ElMessage.success(isCollected ? '已取消收藏' : '已收藏');
  } catch (error) {
    ElMessage.error('收藏操作失败：' + (error.response?.data?.msg || '网络异常'));
    console.error('收藏操作失败：', error);
  } finally {
    apiLoading.value = false;
  }
}

// ========== 备注相关方法（暂时保留本地，可后续对接后端） ==========
function getFlowStepRemark(agendaId, stepIndex) {
  const key = `${agendaId}_${stepIndex}`;
  return userRemarks.value.flowSteps[key] || '';
}

function openFlowStepRemarkModal(agendaId, stepIndex, step) {
  currentStepRemarkAgendaId.value = agendaId;
  currentStepRemarkIndex.value = stepIndex;
  currentStepRemarkTitle.value = step.title;
  currentStepRemarkContent.value = getFlowStepRemark(agendaId, stepIndex);
  stepRemarkModalVisible.value = true;
}

function closeStepRemarkModal() {
  stepRemarkModalVisible.value = false;
  currentStepRemarkContent.value = '';
}

function saveFlowStepRemark() {
  if (currentStepRemarkAgendaId.value && currentStepRemarkIndex.value > -1) {
    const key = `${currentStepRemarkAgendaId.value}_${currentStepRemarkIndex.value}`;
    if (currentStepRemarkContent.value.trim()) {
      userRemarks.value.flowSteps[key] = currentStepRemarkContent.value.trim();
    } else {
      delete userRemarks.value.flowSteps[key];
    }

    // 如需备注持久化，此处调用后端保存备注 API
    // 示例：await remarkApi.saveRemark({ agendaId: currentStepRemarkAgendaId.value, stepIndex: currentStepRemarkIndex.value, content: currentStepRemarkContent.value.trim() });

    ElMessage.success('备注保存成功');
    closeStepRemarkModal();
  }
}

// ========== 会场切换方法（保留原有交互） ==========
function switchVenue(venueId) {
  activeVenueId.value = venueId;
  expandedAgendaIds.value = [];
}

// ========== 议程折叠/展开方法（保留原有交互） ==========
function toggleAgendaExpand(agendaId) {
  if (expandedAgendaIds.value.includes(agendaId)) {
    expandedAgendaIds.value = expandedAgendaIds.value.filter(id => id !== agendaId);
  } else {
    expandedAgendaIds.value.push(agendaId);
  }
}

// ========== 新增：加载后端数据的核心方法 ==========
/**
 * 加载我创建的会场列表
 */
async function loadMyVenues() {
  try {
    loading.value = true;
    // 调用后端获取「我的会议」接口（包含会场信息）
    const res = await meetingApi.getMyMeetings();
    customVenues.value = res.data || [];

    // 初始化激活的会场（默认选中第一个）
    if (customVenues.value.length > 0 && !activeVenueId.value) {
      activeVenueId.value = customVenues.value[0].id;
    }
  } catch (error) {
    ElMessage.error('加载会场数据失败：' + (error.response?.data?.msg || '网络异常'));
    console.error('加载会场失败：', error);
  } finally {
    loading.value = false;
  }
}

/**
 * 加载我的议程列表
 */
async function loadMyAgendas() {
  try {
    loading.value = true;
    // 调用后端获取「我的议程」接口
    const res = await agendaApi.getMyAgendas();
    agendaStore.agendaList = res.data || [];
  } catch (error) {
    ElMessage.error('加载议程数据失败：' + (error.response?.data?.msg || '网络异常'));
    console.error('加载议程失败：', error);
  } finally {
    loading.value = false;
  }
}

/**
 * 加载我的收藏列表（初始化收藏状态）
 */
async function loadMyCollects() {
  try {
    // 调用后端获取「我的收藏」接口
    const res = await collectApi.getMyCollects();
    scheduleStore.collectedFlowSteps = res.data || [];
  } catch (error) {
    ElMessage.error('加载收藏数据失败：' + (error.response?.data?.msg || '网络异常'));
    console.error('加载收藏失败：', error);
  }
}

// ========== 页面挂载逻辑（替换本地存储加载，改为后端数据加载） ==========
onMounted(async () => {
  // 并行加载后端核心数据
  await Promise.all([
    loadMyVenues(),
    loadMyAgendas(),
    loadMyCollects()
  ]);

  // 监听议程列表变化，确保实时更新
  watch(() => agendaStore.agendaList, () => {
    // 强制触发scheduleStore的计算属性更新
    scheduleStore.coreScheduleTime = { ...scheduleStore.coreScheduleTime };
  }, { deep: true });
});
</script>

<style scoped>
/* 样式部分保持不变，仅新增禁用状态样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.meeting-venue-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 顶部横幅 */
.meeting-banner {
  width: 100%;
  height: 180px;
  overflow: hidden;
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 页面标题 */
.page-title-wrap {
  background-color: #fff;
  padding: 12px 0;
  text-align: center;
  border-bottom: 1px solid #eee;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

/* 会场切换标签 */
.tab-switch-container {
  display: flex;
  background-color: #fff;
  border-bottom: 1px solid #eee;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  font-size: 16px;
  color: #999;
  cursor: pointer;
  position: relative;
}

.tab-item.active {
  color: #1989fa;
  font-weight: 500;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #1989fa;
}

/* 空状态提示 */
.empty-venue-tip, .empty-tip {
  text-align: center;
  padding: 30px 0;
  color: #999;
  font-size: 14px;
  background-color: #fff;
  margin: 15px;
  border-radius: 8px;
}

/* 页面内容区 */
.page-content {
  padding: 15px;
}

/* 会场信息卡片 */
.venue-card {
  background-color: #fff;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.08);
}

.venue-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.venue-tag {
  padding: 3px 8px;
  border-radius: 2px;
  color: #fff;
  font-size: 12px;
  margin-right: 8px;
}

.venue-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.venue-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  gap: 5px;
  font-size: 14px;
}

.info-label {
  color: #666;
  min-width: 70px;
}

.info-content {
  color: #333;
}

.content-desc {
  line-height: 1.6;
  white-space: pre-wrap;
  color: #333;
}

/* 流程内容 */
.flow-content {
  background-color: #fff;
  border-radius: 4px;
  padding: 15px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.08);
}

.flow-header {
  margin-bottom: 15px;
}

.flow-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

/* 议程列表 */
.agenda-item {
  margin-bottom: 12px;
  border-radius: 6px;
  background-color: #fafafa;
  overflow: hidden;
}

/* 议程标题 */
.agenda-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  padding: 12px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  border-left: 3px solid #1989fa;
  background-color: #f0f7ff;
}

/* 议程序号 */
.agenda-num {
  width: 20px;  
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;  
  font-weight: bold;
  flex-shrink: 0;
}

/* 折叠/展开图标 */
.expand-icon {
  font-size: 14px;
  color: #1989fa;
  transition: transform 0.2s;
}
.expand-icon.expanded {
  transform: rotate(90deg);
}

/* 流程步骤列表 */
.custom-flow-list {
  padding: 0 15px 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.custom-flow-step {
  padding: 10px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.custom-step-header {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

/* 流程步骤序号 */
.custom-step-num {
  width: 18px; 
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;  
  font-weight: normal;
  flex-shrink: 0;
  margin-top: 2px;
  opacity: 0.8;  
}

.step-info-wrap {
  flex: 1;
}

.custom-step-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0 0 5px 0;
}

.custom-step-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 6px;
}

/* 时间+地址 */
.step-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  margin-bottom: 8px;
}

.custom-step-time {
  font-weight: 500;
}

.custom-step-address {
  color: #666;
}

.step-actions-bottom {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  transition: opacity 0.2s;
}

.collect-btn {
  background-color: #f0f8ff;
  color: #1989fa;
}

.collect-btn.collected {
  background-color: #1989fa;
  color: #fff;
}

.remark-btn {
  background-color: #f7f3e9;
  color: #faad14;
}

/* 新增：禁用状态样式 */
.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 备注弹窗 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-top: 0;
  margin-bottom: 15px;
  text-align: center;
}

.form-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.remark-input {
  resize: none;
  line-height: 1.5;
}

.modal-btns {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.modal-btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.cancel-btn {
  background-color: #f0f0f0;
  color: #666;
}

.confirm-btn {
  background-color: #1989fa;
  color: #fff;
}

.modal-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>