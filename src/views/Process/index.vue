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
          <div 
            class="flow-step" 
            v-for="(agenda, aIndex) in currentVenueAgendas" 
            :key="agenda.id"
          >
            <!-- 流程步骤列表 -->
            <div class="custom-flow-list">
              <div 
                class="custom-flow-step" 
                v-for="(step, sIndex) in agenda.flows" 
                :key="sIndex"
              >
                <div class="custom-step-header">
                  <!-- 步骤序号 -->
                  <span class="custom-step-num" :style="{ backgroundColor: currentVenue.color, color: '#fff' }">
                    {{ sIndex+1 }}
                  </span>
                  <div class="step-info-wrap">
                    <h4 class="custom-step-title">{{ step.title }}</h4>
                    <div class="custom-step-desc">{{ step.desc || '无描述' }}</div>
                    <!-- 步骤操作按钮 -->
                    <div class="sub-step-actions">
                      <span 
                        class="action-btn collect-btn mini"
                        :class="{ collected: isFlowStepCollected(agenda.id, sIndex) }"
                        @click.stop="toggleFlowStepCollect(agenda.id, sIndex)"
                      >
                        {{ isFlowStepCollected(agenda.id, sIndex) ? '已收藏' : '收藏' }}
                      </span>
                      <span 
                        class="action-btn remark-btn mini"
                        @click.stop="openFlowStepRemarkModal(agenda.id, sIndex, step)"
                      >
                        {{ getFlowStepRemark(agenda.id, sIndex) ? '已备注' : '备注' }}
                      </span>
                    </div>
                  </div>
                </div>
                <!-- 时间+地址 -->
                <div class="step-meta">
                  <span class="custom-step-time" :style="{ color: currentVenue.color }">
                    {{ formatTime(step.time) }}
                  </span>
                  <span class="custom-step-address">
                    地址：{{ step.address || currentVenue.address }}
                  </span>
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";

const customVenues = ref(JSON.parse(localStorage.getItem('customVenues')) || []);
const customAgendas = ref(JSON.parse(localStorage.getItem('customAgendas')) || []);
const userCollections = ref(JSON.parse(localStorage.getItem('userCollections')) || {
  agendaIds: [],
  flowSteps: []
});
const userRemarks = ref(JSON.parse(localStorage.getItem('userRemarks')) || {
  agendas: {},
  flowSteps: {}
});

const bannerImageUrl = ref(localStorage.getItem('meetingBannerUrl') || '');
// 参考图
const defaultBannerUrl = ref('https://img.ixintu.com/download/jpg/202308/6673017c157638922.jpg');

const activeVenueId = ref(customVenues.value[0]?.id || '');

// 备注弹窗
const stepRemarkModalVisible = ref(false);
const currentStepRemarkAgendaId = ref('');
const currentStepRemarkIndex = ref(-1);
const currentStepRemarkTitle = ref('');
const currentStepRemarkContent = ref('');

const currentVenue = computed(() => {
  return customVenues.value.find(venue => venue.id === activeVenueId.value) || {};
});

const currentVenueAgendas = computed(() => {
  return customAgendas.value.filter(agenda => agenda.venueId === activeVenueId.value);
});

function formatTime(datetimeStr) {
  if (!datetimeStr) return '未设置';
  const date = new Date(datetimeStr);
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')} - ${date.getHours() + 1}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function syncGlobalDataToLocal() {
  localStorage.setItem('userCollections', JSON.stringify(userCollections.value));
  localStorage.setItem('userRemarks', JSON.stringify(userRemarks.value));
  localStorage.setItem('customVenues', JSON.stringify(customVenues.value));
  localStorage.setItem('customAgendas', JSON.stringify(customAgendas.value));
}

// 收藏
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

// 备注
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

function switchVenue(venueId) {
  activeVenueId.value = venueId;
}
onMounted(() => {
  window.addEventListener('storage', (e) => {
    if (e.key === 'userCollections') {
      userCollections.value = JSON.parse(e.newValue || JSON.stringify({ agendaIds: [], flowSteps: [] }));
    } else if (e.key === 'userRemarks') {
      userRemarks.value = JSON.parse(e.newValue || JSON.stringify({ agendas: {}, flowSteps: {} }));
    } else if (e.key === 'customVenues') {
      customVenues.value = JSON.parse(e.newValue || '[]');
    } else if (e.key === 'customAgendas') {
      customAgendas.value = JSON.parse(e.newValue || '[]');
    }
  });
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

/* 流程步骤列表 */
.custom-flow-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.custom-flow-step {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f5f5f5;
}

.custom-flow-step:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.custom-step-header {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

/* 步骤序号 */
.custom-step-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
  margin-top: 2px;
}

.step-info-wrap {
  flex: 1;
}

.custom-step-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin: 0 0 5px 0;
}

.custom-step-desc {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 8px;
}

/* 步骤操作按钮 */
.sub-step-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 5px;
}

.action-btn {
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 12px;
  cursor: pointer;
  user-select: none;
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

/* 时间+地址 */
.step-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-left: 32px;
  font-size: 13px;
}

.custom-step-time {
  font-weight: 500;
}

.custom-step-address {
  color: #666;
}

/* 备注弹窗样式 */
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