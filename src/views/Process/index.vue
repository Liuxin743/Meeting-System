<template>
  <div class="meeting-venue-container">
    <!-- 会议广告图 -->
    <div class="meeting-banner">
      <img
        class="banner-img"
        src="https://pic1.zhimg.com/v2-ea1f5938445a9fb94d869d76c1d2c2a4_1440w.jpg"
        alt="会议宣传图"
        loading="lazy"
      />
    </div>

    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">会议会场详情</h1>
    </div>

    <!-- 主/分会场切换 -->
    <div class="tab-switch-container">
      <div
        class="tab-item"
        :class="{ active: activeTab === 'main' }"
        @click="switchTab('main')"
      >
        主会场
      </div>
      <div
        class="tab-item"
        :class="{ active: activeTab === 'branch' }"
        @click="switchTab('branch')"
      >
        分会场
      </div>
    </div>

    <!-- 切换对应的内容 -->
    <div class="page-content">
      <!-- 主会场内容 -->
      <div v-if="activeTab === 'main'">
        <!-- 主会场核心信息卡片 -->
        <div class="venue-card main-venue">
          <div class="venue-header">
            <span class="venue-tag main-tag">主会场</span>
            <h2 class="venue-title">核心会议主会场</h2>
          </div>
          <div class="venue-info">
            <div class="info-item time-item">
              <span class="info-label">会议时间：</span>
              <span class="info-content">2026-01-20 09:00 - 12:00</span>
            </div>
            <div class="info-item content-item">
              <span class="info-label">核心内容：</span>
              <div class="info-content content-desc">1. 宣布本次会议核心议题及议程安排；2. 高层领导做年度会议总结及未来规划部署；3. 公布核心项目进展及落地成果；4. 现场答疑，解决各分会场提交的关键问题。</div>
            </div>
          </div>
        </div>

        <!-- 主会场会议流程 -->
        <div class="flow-content main-flow">
          <h3 class="flow-title">主会场会议流程</h3>
          <div class="flow-step-list">
            <div class="flow-step" v-for="(step, index) in meetingFlows.main" :key="index">
              <div class="step-num">{{ index + 1 }}</div>
              <div class="step-content">
                <div class="step-title">{{ step.title }}</div>
                <div class="step-desc">{{ step.desc }}</div>
                 <div class="step-time">{{ step.time }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 分会场内容 -->
      <div v-if="activeTab === 'branch'">
        <!-- 分会场列表 -->
        <div class="venue-list-title">分会场列表</div>
        <div class="venue-card branch-venue" v-for="(venue, index) in branchVenues" :key="index">
          <div class="venue-header">
            <span class="venue-tag branch-tag">分会场 {{ index + 1 }}</span>
            <h2 class="venue-title">{{ venue.name }}</h2>
          </div>
          <div class="venue-info">
            <div class="info-item time-item">
              <span class="info-label">会议时间：</span>
              <span class="info-content">{{ venue.time }}</span>
            </div>
            <div class="info-item content-item">
              <span class="info-label">会议内容：</span>
              <div class="info-content content-desc">{{ venue.content }}</div>
            </div>
          </div>
        </div>

        <!-- 分会场会议流程 -->
        <div class="flow-content branch-flow">
          <h3 class="flow-title">分会场会议流程</h3>
          <div class="flow-step-list">
            <div class="flow-step" v-for="(step, index) in meetingFlows.branch" :key="index">
              <div class="step-num">{{ index + 1 }}</div>
              <div class="step-content">
                <div class="step-title">{{ step.title }}</div>
                <div class="step-desc">{{ step.desc }}</div>
                <div class="step-time">{{ step.time }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useScheduleStore } from '../../stores/scheduleStore'
import { storeToRefs } from 'pinia'

// 初始化路由
const router = useRouter();
// 初始化scheduleStore
const scheduleStore = useScheduleStore()
const { meetingFlows, coreScheduleTime } = storeToRefs(scheduleStore)
// 默认主会场
const activeTab = ref("main");

// 分会场列表数据
const branchVenues = ref([
  {
    name: "技术分会场",
    time: "2026-01-20 14:00 - 16:00",
    content: "1. 讨论核心技术架构优化方案；2. 分享最新技术落地案例及经验；3. 确定下阶段技术研发任务及分工；4. 收集技术难点及解决方案建议。"
  },
  {
    name: "运营分会场",
    time: "2026-01-20 14:00 - 17:00",
    content: "1. 总结上阶段运营数据及成果；2. 分析当前运营痛点及优化方向；3. 制定下阶段运营推广策略及目标；4. 讨论跨部门运营协作流程及机制。"
  },
  {
    name: "市场分会场",
    time: "2026-01-20 15:00 - 18:00",
    content: "1. 分析当前市场环境及竞争对手动态；2. 汇报最新市场拓展成果及客户反馈；3. 制定下阶段市场布局及推广计划；4. 确定市场预算分配及考核指标。"
  }
]);

// 自动同步会议信息到个人专属日程
const autoSyncMeetingToPersonalSchedule = () => {
  // 定义要同步的日程数据数组
  let syncScheduleData = [];

  if (activeTab.value === 'main') {
    // 主会场：同步主会场名称+时间 + 流程步骤
    // 1. 主会场核心会议
    syncScheduleData.push({
      time: "2026-01-20 09:00 - 12:00",
      content: "核心会议主会场",
      icon: 'calendar-o'
    });
    // 2. 主会场流程步骤
    meetingFlows.value.main.forEach(step => {
      syncScheduleData.push({
        time: step.time,
        content: step.title,
        icon: 'calendar-o'
      });
    });
  } else {
    // 分会场：同步所有分会场名称+时间 + 流程步骤
    // 各分会场核心会议
    branchVenues.value.forEach(venue => {
      syncScheduleData.push({
        time: venue.time,
        content: venue.name,
        icon: 'calendar-o'
      });
    });
    // 2. 分会场通用流程步骤
    meetingFlows.value.branch.forEach(step => {
      syncScheduleData.push({
        time: step.time,
        content: step.title,
        icon: 'calendar-o'
      });
    });
  }

  // 同步到个人专属日程
  coreScheduleTime.value.personalSchedule = syncScheduleData;
};

// 1. 页面挂载时自动同步一次
onMounted(() => {
  autoSyncMeetingToPersonalSchedule();
});

// 切换标签（主/分会场）时，自动重新同步
watch(activeTab, () => {
  autoSyncMeetingToPersonalSchedule();
});

// 切换标签
const switchTab = (tabType) => {
  activeTab.value = tabType;
};

// 返回上一页
const handleBack = () => {
  router.go(-1);
};
</script>

<style scoped>
/* 全局容器样式 */
.meeting-venue-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* 顶部广告图样式 */
.meeting-banner {
  width: 100%;
  height: auto;
  overflow: hidden;
}

.banner-img {
  width: 100%;
  height: 180px; 
  object-fit: cover; 
  display: block; 
}

/* 页面头部 */
.page-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  background-color: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  background-color: transparent;
  border: none;
  color: #1989fa;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.page-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.empty-btn {
  width: 60px; 
}

/* 2. 主/分会场切换标签样式 */
.tab-switch-container {
  display: flex;
  background-color: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 48px; 
  z-index: 10;
}

.tab-item {
  flex: 1; 
  text-align: center;
  padding: 12px 0;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

/* 激活态样式 */
.tab-item.active {
  color: #1989fa;
  font-weight: 500;
}

/* 激活态底部下划线 */
.tab-item.active::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 2px;
  background-color: #1989fa;
  border-radius: 1px;
}

/* 页面主体内容 */
.page-content {
  flex: 1;
  padding: 16px 12px;
  box-sizing: border-box;
}

/* 分会场列表标题 */
.venue-list-title {
  font-size: 14px;
  color: #666;
  margin: 0 0 10px 8px;
}

/* 会场卡片通用样式 */
.venue-card {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 12px;
}

/* 主会场专属样式 */
.main-venue {
  border-left: 4px solid #1989fa;
}

/* 分会场专属样式 */
.branch-venue {
  border-left: 4px solid #52c41a;
}

/* 会场头部 */
.venue-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.venue-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #ffffff;
}

.main-tag {
  background-color: #1989fa;
}

.branch-tag {
  background-color: #52c41a;
}

.venue-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

/* 会场信息 */
.venue-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.time-item {
  flex-direction: row;
  align-items: center;
}

.info-label {
  font-size: 12px;
  color: #666;
}

.info-content {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.content-desc {
  line-height: 1.6;
  white-space: pre-line; 
  padding-left: 0;
}

/* 3. 流程内容样式 */
.flow-content {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-top: 12px;
}

.flow-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

/* 流程步骤列表 */
.flow-step-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.flow-step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  position: relative;
}

/* 步骤序号 */
.step-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #e6f7ff;
  color: #1989fa;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* 分会场步骤序号颜色区分 */
.branch-flow .step-num {
  background-color: #f0fff4;
  color: #52c41a;
}

/* 步骤内容 */
.step-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.step-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.step-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.5;
}

.step-time {
  font-size: 12px;
  color: #1989fa;
  background-color: #f5fafe;
  padding: 2px 6px;
  border-radius: 4px;
  width: fit-content;
}

/* 分会场 */
.branch-flow .step-time {
  color: #52c41a;
  background-color: #f0fff4;
}

/* 响应式适配小屏幕 */
@media (max-width: 375px) {
  .banner-img {
    height: 150px; 
  }

  .venue-title {
    font-size: 14px;
  }

  .info-content {
    font-size: 13px;
  }

  .flow-title {
    font-size: 14px;
  }

  .step-title {
    font-size: 13px;
  }
}
</style>