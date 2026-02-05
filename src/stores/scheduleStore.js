import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useAgendaStore } from './agendaStore';
import { collectApi } from '@/api/index'; 

export const useScheduleStore = defineStore('schedule', () => {
  const agendaStore = useAgendaStore();

  // 核心状态
  const notifications = ref([]);
  const coreScheduleTime = ref({
    meetingTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    personalSchedule: []
  });

  // 收藏的流程步骤
  const collectedFlowSteps = ref([]);
  // 收藏相关加载状态
  const collectLoading = ref(false);
  // 收藏相关错误信息
  const collectError = ref('');

  const fetchMyCollects = async () => {
    try {
      collectLoading.value = true;
      collectError.value = '';
      const res = await collectApi.getMyCollects(); // 调用后端接口
      collectedFlowSteps.value = res.data || []; 
    } catch (error) {
      collectError.value = '获取收藏列表失败，请稍后重试';
      console.error('获取收藏列表失败:', error);
      collectedFlowSteps.value = [];
    } finally {
      collectLoading.value = false;
    }
  };

  // 个人专属日程
  const personalSchedule = computed(() => {
    const allSteps = [];
    // 先判断议程列表是否存在
    if (!agendaStore.agendaList || agendaStore.agendaList.length === 0) {
      return allSteps;
    }

    agendaStore.agendaList.forEach(agenda => {
      if (agenda.flows && agenda.flows.length) {
        agenda.flows.forEach((step, stepIndex) => {
          const isCollected = collectedFlowSteps.value.some(item => 
            item.agendaId === agenda.id && item.stepIndex === stepIndex
          );
          const isEnded = isStepEnded(step.time || agenda.time);
          
          allSteps.push({
            id: `${agenda.id}-${stepIndex}`,
            agendaId: agenda.id,
            stepIndex,
            title: step.title || '未命名步骤',
            time: step.time || agenda.time || '时间未设置',
            content: step.title || '未命名步骤', 
            desc: step.desc || '无描述',
            icon: 'calendar-o', 
            isCollected,
            isEnded,
            countdown: calculateCountdown(step.time || agenda.time)
          });
        });
      }
    });

    return allSteps;
  });

  // 想听日程
  const wishSchedule = computed(() => {
    const collectedSteps = [];
    if (!agendaStore.agendaList || agendaStore.agendaList.length === 0) {
      return collectedSteps;
    }

    collectedFlowSteps.value.forEach(collected => {
      const agenda = agendaStore.agendaList.find(item => item.id === collected.agendaId);
      if (agenda && agenda.flows && agenda.flows[collected.stepIndex]) {
        const step = agenda.flows[collected.stepIndex];
        const isEnded = isStepEnded(step.time || agenda.time);
        
        collectedSteps.push({
          id: `${agenda.id}-${collected.stepIndex}`,
          agendaId: agenda.id,
          stepIndex: collected.stepIndex,
          title: step.title || '未命名步骤',
          time: step.time || agenda.time || '时间未设置',
          content: step.title || '未命名步骤',
          desc: step.desc || '无描述',
          icon: 'calendar-o', 
          isEnded,
          countdown: calculateCountdown(step.time || agenda.time)
        });
      }
    });

    return collectedSteps;
  });

  // 判断流程是否已结束
  function isStepEnded(timeStr) {
    if (!timeStr) return false;
    
    try {
      let endTime;
      if (timeStr.includes('-') && !timeStr.includes('T')) {
        const [_, endStr] = timeStr.split('-').map(t => t.trim());
        const today = new Date();
        const [endHour, endMinute] = endStr.split(':').map(Number);
        endTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), endHour, endMinute);
      } 
      else {
        const formattedTime = timeStr.replace(' ', 'T');
        endTime = new Date(formattedTime);
        if (!isNaN(endTime.getTime()) && endTime.getHours() === 0 && endTime.getMinutes() === 0) {
          endTime = new Date(endTime);
          endTime.setHours(23, 59, 59);
        }
      }
      
      return !isNaN(endTime.getTime()) && new Date() > endTime;
    } catch (error) {
      console.error('判断流程是否结束失败:', error);
      return false;
    }
  }

  // 计算倒计时
  function calculateCountdown(timeStr) {
    if (!timeStr) return '时间未设置';
    
    try {
      let startTime;
      // 处理时间段格式
      if (timeStr.includes('-') && !timeStr.includes('T')) {
        const [startStr] = timeStr.split('-').map(t => t.trim());
        const today = new Date();
        const [startHour, startMinute] = startStr.split(':').map(Number);
        startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), startHour, startMinute);
      } 
      else {
        const formattedTime = timeStr.replace(' ', 'T');
        startTime = new Date(formattedTime);
      }

      // 验证时间是否有效
      if (isNaN(startTime.getTime())) {
        return '时间格式错误';
      }
      
      const now = new Date();
      const diff = startTime - now;

      // 已结束
      if (diff < 0) return '已结束';

      // 计算天、时、分、秒
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      // 拼接倒计时文本
      let countdownText = '';
      if (days > 0) {
        countdownText += `${days}天`;
      }
      if (hours > 0 || days > 0) {
        countdownText += `${hours}时`;
      }
      if (minutes > 0 || hours > 0 || days > 0) {
        countdownText += `${minutes}分`;
      }
      countdownText += `${seconds}秒后开始`;
      
      return countdownText;
    } catch (error) {
      console.error('计算倒计时失败:', error);
      return '时间解析失败';
    }
  }

  const toggleFlowStepCollect = async (agendaId, stepIndex) => {
    try {
      collectLoading.value = true;
      collectError.value = '';
      const index = collectedFlowSteps.value.findIndex(item => 
        item.agendaId === agendaId && item.stepIndex === stepIndex
      );
      
      if (index > -1) {
        // 取消收藏
        await collectApi.removeCollect(agendaId, stepIndex);
        collectedFlowSteps.value.splice(index, 1);
      } else {
        // 新增收藏
        const collectData = { agendaId, stepIndex };
        await collectApi.addCollect(collectData);
        collectedFlowSteps.value.push(collectData);
      }
      
      // 触发计算属性更新
      coreScheduleTime.value = { ...coreScheduleTime.value };
      return true;
    } catch (error) {
      collectError.value = '操作收藏失败，请稍后重试';
      console.error('切换收藏状态失败:', error);
      return false;
    } finally {
      collectLoading.value = false;
    }
  };

  // 判断是否已收藏
  const isFlowStepCollected = (agendaId, stepIndex) => {
    return collectedFlowSteps.value.some(item => 
      item.agendaId === agendaId && item.stepIndex === stepIndex
    );
  };

  const clearEndedPersonalSchedule = async () => {
    try {
      collectLoading.value = true;
      collectError.value = '';
      const endedItems = personalSchedule.value.filter(item => item.isEnded);
      if (endedItems.length === 0) return;
      
      // 批量删除已结束的收藏
      for (const item of endedItems) {
        const { agendaId, stepIndex } = item;
        const collectIndex = collectedFlowSteps.value.findIndex(col => 
          col.agendaId === agendaId && col.stepIndex === stepIndex
        );
        if (collectIndex > -1) {
          // 先调用后端删除
          await collectApi.removeCollect(agendaId, stepIndex);
          // 再更新前端状态
          collectedFlowSteps.value.splice(collectIndex, 1);
        }
      }
      
      // 触发更新
      coreScheduleTime.value = { ...coreScheduleTime.value };
      console.log(`已自动清空 ${endedItems.length} 个已结束的日程`);
    } catch (error) {
      collectError.value = '清空已结束日程失败，请稍后重试';
      console.error('自动清空已结束日程失败:', error);
    } finally {
      collectLoading.value = false;
    }
  };

  // 自动清空定时器
  const getTomorrow8AM = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    return tomorrow.getTime();
  };

  const startAutoClearTimer = () => {
    // 防止重复启动
    if (window.autoClearTimer) {
      clearTimeout(window.autoClearTimer);
    }
    
    const now = new Date().getTime();
    const tomorrow8AM = getTomorrow8AM();
    const delay = tomorrow8AM - now;

    // 设置定时器
    window.autoClearTimer = setTimeout(() => {
      clearEndedPersonalSchedule();
      // 循环启动下一天的定时器
      startAutoClearTimer();
    }, delay);
    console.log(`自动清空定时器已启动，将在 ${new Date(tomorrow8AM).toLocaleString()} 执行`);
  };

  watch(collectedFlowSteps, () => {
    // 确保只启动一次定时器
    if (!window.autoClearTimerStarted) {
      startAutoClearTimer();
      window.autoClearTimerStarted = true;
    }
  }, { immediate: true });


  const addAgendaEditNotification = (agenda) => {
    notifications.value.unshift({
      id: Date.now(),
      title: `议程「${agenda.title}」已更新`,
      content: `更新后时间：${agenda.time}`,
      status: '已生效',
      createTime: new Date().toLocaleString()
    });
    // 可选：对接后端创建通知接口
    // try {
    //   await noticeApi.createNotice({
    //     title: `议程「${agenda.title}」已更新`,
    //     content: `更新后时间：${agenda.time}`,
    //     status: '已生效'
    //   });
    // } catch (error) {
    //   console.error('创建后端通知失败:', error);
    // }
  };

  // 清空通知
  const clearNotifications = () => {
    notifications.value = [];
  };

  return {
    // 状态
    notifications,
    coreScheduleTime,
    personalSchedule,
    wishSchedule,
    collectedFlowSteps,
    collectLoading,
    collectError,
    // 方法
    toggleFlowStepCollect,
    isFlowStepCollected,
    calculateCountdown,
    addAgendaEditNotification,
    clearNotifications,
    clearEndedPersonalSchedule,
    fetchMyCollects 
  };
});