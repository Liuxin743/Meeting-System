import request from '@/utils/request';

// 创建议程
export const createAgenda = (data) => {
  return request({
    url: '/agendas',
    method: 'POST',
    data
  });
};

// 获取我的议程
export const getMyAgendas = () => {
  return request({
    url: '/agendas',
    method: 'GET'
  });
};

// 根据会议ID获取议程
export const getAgendasByMeeting = (meetingId) => {
  return request({
    url: `/agendas/meeting/${meetingId}`,
    method: 'GET'
  });
};

// 根据会场ID获取议程
export const getAgendasByVenue = (venueId) => {
  return request({
    url: `/agendas/venue/${venueId}`,
    method: 'GET'
  });
};

// 更新议程
export const updateAgenda = (id, data) => {
  return request({
    url: `/agendas/${id}`,
    method: 'PUT',
    data
  });
};

// 删除议程
export const deleteAgenda = (id) => {
  return request({
    url: `/agendas/${id}`,
    method: 'DELETE'
  });
};

// 补充：1. 获取用户收藏的议程列表（和组件逻辑匹配）
export const getCollectedAgendas = (params) => {
  return request({
    url: '/agendas/collected', // 接口路径根据后端实际地址调整，保持和现有风格一致
    method: 'GET',
    params // 传递用户ID等查询参数
  });
};

// 补充：2. 取消议程收藏（和组件逻辑匹配）
export const cancelAgendaCollect = (data) => {
  return request({
    url: '/agendas/cancel-collect', // 接口路径根据后端实际地址调整
    method: 'POST', // 也可根据后端要求改为 DELETE，保持和后端一致即可
    data // 传递 userId 和 agendaId
  });
};