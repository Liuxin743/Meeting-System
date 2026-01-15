import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useScheduleStore = defineStore('schedule', () => {
  // 1. 重要通知列表
  const notifications = ref([]);

  // 2. 核心日程时间 + 个人专属日程
  const coreScheduleTime = ref({
    meetingTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    personalSchedule: []
  });

  // 3. 会议流程数据（主/分会场，供同步到个人日程用）
  const meetingFlows = ref({
    main: [
      {
        title: "会议开幕致辞",
        desc: "主持人介绍本次会议核心议题、参会嘉宾及会议整体安排",
        time: "09:00 - 09:15"
      },
      {
        title: "高层领导年度总结",
        desc: "公布上一年度会议落地成果、核心数据及存在的问题",
        time: "09:15 - 10:00"
      },
      {
        title: "核心项目进展汇报",
        desc: "各核心项目负责人依次汇报项目当前进展、后续计划及需协调资源",
        time: "10:00 - 11:30"
      },
      {
        title: "茶歇休息",
        desc: "参会人员自由交流，领取会议资料及伴手礼",
        time: "11:30 - 11:45"
      },
      {
        title: "未来规划部署",
        desc: "高层领导公布下一年度会议核心目标、战略布局及落地路径",
        time: "11:45 - 12:30"
      },
      {
        title: "主会场会议闭幕",
        desc: "主持人总结主会场核心内容，宣布分会场会议开始",
        time: "12:30 - 12:40"
      }
    ],
    branch: [
      {
        title: "分会场签到入场",
        desc: "参会人员按所属领域签到，领取分会场专属资料及座位牌",
        time: "14:00 - 14:15"
      },
      {
        title: "分会场议题解读",
        desc: "各分会场主持人解读本领域议题细节、讨论规则及预期成果",
        time: "14:15 - 14:30"
      },
      {
        title: "分组讨论交流",
        desc: "参会人员分组讨论本领域痛点、解决方案及落地建议，记录核心观点",
        time: "14:30 - 16:00"
      },
      {
        title: "小组成果汇报",
        desc: "各小组代表依次汇报讨论成果，其他小组可补充提问",
        time: "16:00 - 17:00"
      },
      {
        title: "分会场总结点评",
        desc: "分会场专家对各小组成果进行点评，提炼核心结论及可落地方案",
        time: "17:00 - 17:30"
      },
      {
        title: "分会场会议闭幕",
        desc: "主持人总结分会场成果，收集参会人员反馈，宣布会议结束",
        time: "17:30 - 17:40"
      }
    ]
  });

  // 4. 同步会议流程到个人专属日程
  const syncFlowToPersonalSchedule = (flowType = 'main') => {
    const targetFlow = meetingFlows.value[flowType];
    if (!targetFlow) return;

    // 转换为个人专属日程格式
    coreScheduleTime.value.personalSchedule = targetFlow.map(step => ({
      time: step.time,
      content: step.title,
      icon: 'calendar-o'
    }));
  };

  // 5. 添加议程修改通知
  const addAgendaEditNotification = (agenda) => {
    const newNotice = {
      id: Date.now(),
      type: '议程修改',
      title: `议程“${agenda.title}”已更新`,
      content: `更新后时间：${agenda.time}`,
      status: '已生效',
      createTime: new Date().toLocaleString()
    };
    notifications.value.unshift(newNotice);
  };

  // 6. 更新核心日程时间
  const updateCoreScheduleTime = (newTime, newPersonalSchedule = null) => {
    coreScheduleTime.value.meetingTime = newTime;
    if (newPersonalSchedule && Array.isArray(newPersonalSchedule)) {
      coreScheduleTime.value.personalSchedule = newPersonalSchedule;
    }
  };

  // 7. 清空通知
  const clearNotifications = () => {
    notifications.value = [];
  };

  return {
    notifications,
    coreScheduleTime,
    meetingFlows,
    addAgendaEditNotification, 
    updateCoreScheduleTime,
    clearNotifications,
    syncFlowToPersonalSchedule
  };
});