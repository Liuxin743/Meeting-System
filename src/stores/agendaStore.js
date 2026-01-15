import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAgendaStore = defineStore('agenda', () => {
  // 核心：响应式议程列表（跨页面共享，实时同步）
  const agendaList = ref([]);

  // 1. 切换收藏状态（翻转 isCollected，持久化存储）
  const toggleAgendaCollect = (agendaId) => {
    const agenda = agendaList.value.find(item => item.id === agendaId);
    if (agenda) {
      agenda.isCollected = !agenda.isCollected;
      localStorage.setItem('agendaList', JSON.stringify(agendaList.value));
    }
  };

  // 2. 获取所有已收藏的议程
  const getCollectedAgendas = () => {
    return agendaList.value.filter(agenda => agenda.isCollected === true) || [];
  };

  // 3. 获取所有带备注的议程
  const getRemarkAgendas = () => {
    return agendaList.value.filter(agenda => agenda.remark && agenda.remark.trim() !== '') || [];
  };

  // 4. 保存议程标签
  const saveAgendaTags = (agendaId, tags) => {
    const agenda = agendaList.value.find(item => item.id === agendaId);
    if (agenda) {
      agenda.tags = tags;
      localStorage.setItem('agendaList', JSON.stringify(agendaList.value));
    }
  };

  // 5. 保存议程备注
  const saveAgendaRemark = (agendaId, remark) => {
    const agenda = agendaList.value.find(item => item.id === agendaId);
    if (agenda) {
      agenda.remark = remark;
      localStorage.setItem('agendaList', JSON.stringify(agendaList.value));
    }
  };

  // 6. 加载本地持久化数据
  const loadAgendaFromLocalStorage = () => {
    const savedAgendas = localStorage.getItem('agendaList');
    if (savedAgendas) {
      agendaList.value = JSON.parse(savedAgendas);
    }
  };

  // 7. 清除议程缓存
  const clearAgendaStorage = () => {
    agendaList.value = [];
    localStorage.removeItem('agendaList');
  };

  // 8. 添加新议程
  const addNewAgenda = (newAgenda) => {
    const agendaId = Date.now() + Math.floor(Math.random() * 1000);
    let agendaTime = newAgenda.time;
    if (agendaTime) {
      agendaTime = agendaTime.replace('T', ' ');
    } else {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hour = String(now.getHours()).padStart(2, '0');
      const minute = String(now.getMinutes()).padStart(2, '0');
      agendaTime = `${year}-${month}-${day} ${hour}:${minute}`;
    }
    const agenda = {
      id: agendaId,
      title: newAgenda.title || '未命名议程',
      time: agendaTime,
      tags: [],
      remark: '',
      isCollected: false
    };
    agendaList.value.push(agenda);
    localStorage.setItem('agendaList', JSON.stringify(agendaList.value));
    return agendaId;
  };

  // 9.更新议程（标题/时间）
  const updateAgenda = (agendaId, updateData) => {
    const agenda = agendaList.value.find(item => item.id === agendaId);
    if (agenda) {
      Object.assign(agenda, updateData);
      localStorage.setItem('agendaList', JSON.stringify(agendaList.value));
    }
  };

  // 导出响应式数据和方法
  return {
    agendaList,
    toggleAgendaCollect,
    getCollectedAgendas,
    getRemarkAgendas,
    saveAgendaTags,
    saveAgendaRemark,
    loadAgendaFromLocalStorage,
    clearAgendaStorage,
    addNewAgenda,
    updateAgenda
  };
});