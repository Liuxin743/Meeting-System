import { defineStore } from 'pinia';
import { ref } from 'vue';
import { agendaApi } from '@/api/index'; 

export const useAgendaStore = defineStore('agenda', () => {
  // 议程列表
  const agendaList = ref([]);
  // 加载状态
  const agendaLoading = ref(false);
  // 错误信息
  const agendaError = ref('');

  // 从后端获取我的议程
  const fetchMyAgendas = async () => {
    try {
      agendaLoading.value = true;
      agendaError.value = '';
      const res = await agendaApi.getMyAgendas(); 
      agendaList.value = res.data || []; 
    } catch (error) {
      agendaError.value = '获取议程列表失败，请稍后重试';
      console.error('获取议程失败:', error);
      agendaList.value = [];
    } finally {
      agendaLoading.value = false;
    }
  };

  const createAgenda = async (data) => {
    try {
      await agendaApi.createAgenda(data);
      await fetchMyAgendas(); 
      return true;
    } catch (error) {
      console.error('创建议程失败:', error);
      return false;
    }
  };

  const updateAgenda = async (id, data) => {
    try {
      await agendaApi.updateAgenda(id, data);
      await fetchMyAgendas(); // 更新成功后刷新列表
      return true;
    } catch (error) {
      console.error('更新议程失败:', error);
      return false;
    }
  };

  const deleteAgenda = async (id) => {
    try {
      await agendaApi.deleteAgenda(id);
      await fetchMyAgendas(); // 删除成功后刷新列表
      return true;
    } catch (error) {
      console.error('删除议程失败:', error);
      return false;
    }
  };

  return {
    agendaList,
    agendaLoading,
    agendaError,
    fetchMyAgendas,
    createAgenda,
    updateAgenda,
    deleteAgenda
  };
});