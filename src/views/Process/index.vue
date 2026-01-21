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

    <!-- 空会场提示 -->
    <div class="empty-venue-tip" v-if="customVenues.length === 0">
      暂无自定义会场，请先在个人中心创建会场
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
            <span class="info-content">{{ currentVenue.time }}</span>
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

        <!-- 空议程提示 -->
        <div class="empty-tip" v-if="currentVenueAgendas.length === 0">
          暂无该会场的议程，请先在个人中心创建议程
        </div>

        <!-- 议程列表 -->
        <div class="flow-step-list" v-else>
          <!-- 议程 -->
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
              <!-- 议程序号 -->
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
                  <!-- 流程步骤序号 -->
                  <span class="custom-step-num" :style="{ backgroundColor: currentVenue.color, color: '#fff' }">
                    {{ sIndex + 1 }}
                  </span>
                  <div class="step-info-wrap">
                    <h4 class="custom-step-title">{{ step.title }}</h4>
                    <div class="custom-step-desc">{{ step.desc || '无描述' }}</div>
                    <!-- 时间+地址 -->
                    <div class="step-meta">
                      <span class="custom-step-time" :style="{ color: currentVenue.color }">
                        {{ formatTime(step.time) }}
                      </span>
                      <span class="custom-step-address">
                        地址：{{ step.address || currentVenue.address }}
                      </span>
                    </div>
                    <!-- 收藏/备注-->
                    <div class="step-actions-bottom">
                      <span 
                        class="action-btn collect-btn"
                        :class="{ collected: isFlowStepCollected(agenda.id, sIndex) }"
                        @click.stop="toggleFlowStepCollect(agenda.id, sIndex)"
                      >
                        {{ isFlowStepCollected(agenda.id, sIndex) ? '已收藏' : '收藏' }}
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
        <button class="modal-btn confirm-btn" @click="saveFlowStepRemark">保存备注</button>
      </div>
    </div>
  </div>
</template>

<script setup>
// JS部分完全不变
import { ref, onMounted, computed, watch } from "vue";
import { useAgendaStore } from '../../stores/agendaStore';

// 初始化Pinia仓库
const agendaStore = useAgendaStore();

// 会场数据
const customVenues = ref(JSON.parse(localStorage.getItem('customVenues')) || []);
// 收藏/备注数据
const userCollections = ref(JSON.parse(localStorage.getItem('userCollections')) || {
  agendaIds: [],
  flowSteps: []
});
const userRemarks = ref(JSON.parse(localStorage.getItem('userRemarks')) || {
  agendas: {},
  flowSteps: {}
});

// 宣传图数据
const bannerImageUrl = ref(localStorage.getItem('meetingBannerUrl') || '');
const defaultBannerUrl = ref('https://img.ixintu.com/download/jpg/202308/6673017c157638922.jpg');

// 激活的会场ID
const activeVenueId = ref(customVenues.value[0]?.id || '');

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

// 会场的议程
const currentVenueAgendas = computed(() => {
  return agendaStore.agendaList.filter(agenda => agenda.venueId === activeVenueId.value);
});

// 时间格式化方法
function formatTime(datetimeStr) {
  if (!datetimeStr) return '未设置';
  const date = new Date(datetimeStr);
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')} - ${date.getHours() + 1}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 同步数据到本地存储
function syncGlobalDataToLocal() {
  localStorage.setItem('userCollections', JSON.stringify(userCollections.value));
  localStorage.setItem('userRemarks', JSON.stringify(userRemarks.value));
  localStorage.setItem('customVenues', JSON.stringify(customVenues.value));
}

// 收藏相关方法
function isFlowStepCollected(agendaId, stepIndex) {
  return userCollections.value.flowSteps.some(item => 
    item.agendaId === agendaId && item.stepIndex === stepIndex
  );
}

function toggleFlowStepCollect(agendaId, stepIndex) {
  const index = userCollections.value.flowSteps.findIndex(item => 
    item.agendaId === agendaId && item.stepIndex === stepIndex
  );
  
  if (index > -1) {
    userCollections.value.flowSteps.splice(index, 1);
  } else {
    userCollections.value.flowSteps.push({ agendaId, stepIndex });
  }
  syncGlobalDataToLocal();
}

// 备注相关方法
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
    syncGlobalDataToLocal();
    closeStepRemarkModal();
  }
}

// 切换会场方法
function switchVenue(venueId) {
  activeVenueId.value = venueId;
  // 切换会场后重置折叠状态
  expandedAgendaIds.value = [];
}

// 切换议程的折叠/展开状态
function toggleAgendaExpand(agendaId) {
  if (expandedAgendaIds.value.includes(agendaId)) {
    expandedAgendaIds.value = expandedAgendaIds.value.filter(id => id !== agendaId);
  } else {
    expandedAgendaIds.value.push(agendaId);
  }
}

// 页面挂载逻辑
onMounted(() => {
  // 1. 加载Pinia仓库中的议程数据
  agendaStore.loadAgendaFromLocalStorage();
  
  // 2. 同步会场/收藏/备注数据
  window.addEventListener('storage', (e) => {
    if (e.key === 'userCollections') {
      userCollections.value = JSON.parse(e.newValue || JSON.stringify({ agendaIds: [], flowSteps: [] }));
    } else if (e.key === 'userRemarks') {
      userRemarks.value = JSON.parse(e.newValue || JSON.stringify({ agendas: {}, flowSteps: {} }));
    } else if (e.key === 'customVenues') {
      customVenues.value = JSON.parse(e.newValue || '[]');
      if (customVenues.value.length > 0 && !activeVenueId.value) {
        activeVenueId.value = customVenues.value[0].id;
      }
    } else if (e.key === 'agendaList') {
      agendaStore.loadAgendaFromLocalStorage();
    }
  });

  // 3. 监听会场数据变化，自动保存到本地
  watch(customVenues, () => {
    localStorage.setItem('customVenues', JSON.stringify(customVenues.value));
  }, { deep: true });

  // 4. 监听收藏/备注变化，自动保存
  watch([userCollections, userRemarks], () => {
    syncGlobalDataToLocal();
  }, { deep: true });
});
</script>

<style scoped>
/* 全局样式 */
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
  margin-bottom: 8px; /* 给下方按钮留间距 */
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
}

.cancel-btn {
  background-color: #f0f0f0;
  color: #666;
}

.confirm-btn {
  background-color: #1989fa;
  color: #fff;
}
</style>