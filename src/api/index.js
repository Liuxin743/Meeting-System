import request from '@/utils/request';

// ========== 议程相关 API ==========
export const agendaApi = {
  // 创建议程
  createAgenda: (data) => request({ url: '/agendas', method: 'POST', data, timeout: 15000 }),
  // 获取我的议程
  getMyAgendas: () => request({ url: '/agendas', method: 'GET' }),
  // 根据会议ID获取议程
  getAgendasByMeeting: (meetingId) => request({ url: `/agendas/meeting/${meetingId}`, method: 'GET' }),
  // 根据会场ID获取议程
  getAgendasByVenue: (venueId) => request({ url: `/agendas/venue/${venueId}`, method: 'GET' }),
  // 更新议程
  updateAgenda: (id, data) => request({ url: `/agendas/${id}`, method: 'PUT', data }),
  // 删除议程
  deleteAgenda: (id) => request({ url: `/agendas/${id}`, method: 'DELETE' }),
  
  // 【新增】获取我的备注议程列表
  getRemarkAgendas: (data) => request({ url: '/agendas/remarks', method: 'POST', data }),
  // 【新增】删除议程备注
  deleteAgendaRemark: (data) => request({ url: '/agendas/remarks/delete', method: 'POST', data })
};

// ========== 会议相关 API ==========
export const meetingApi = {
  // 创建会议
  createMeeting: (data) => request({ url: '/meetings', method: 'POST', data, timeout: 15000 }),
  // 获取我创建的会议
  getMyMeetings: () => request({ url: '/meetings/my', method: 'GET' }),
  // 获取会议详情（包含会场）
  getMeetingDetails: (id) => request({ url: `/meetings/${id}`, method: 'GET' }),
  // 更新会议
  updateMeeting: (id, data) => request({ url: `/meetings/${id}`, method: 'PUT', data }),
  // 删除会议
  deleteMeeting: (id) => request({ url: `/meetings/${id}`, method: 'DELETE' }),
  // 加入会议
  joinMeeting: (meeting_code) => request({ url: '/meetings/join', method: 'POST', data: { meeting_code } }),
  // 根据会议号查询会议信息
  getMeetingByCode: (code) => request({ url: `/meetings/check-code?code=${code}`, method: 'GET' })
};

// ========== 通知相关 API ==========
export const noticeApi = {
  // 创建通知
  createNotice: (data) => request({ url: '/notices', method: 'POST', data }),
  // 获取我的通知
  getMyNotices: () => request({ url: '/notices/my', method: 'GET' })
};

// ========== 回执相关 API ==========
export const receiptApi = {
  // 提交回执
  submitReceipt: (data) => request({ url: '/receipts', method: 'POST', data }),
  // 获取某会议的回执列表
  getReceiptsByMeeting: (meetingId) => request({ url: `/receipts/meeting/${meetingId}`, method: 'GET' })
};

// ========== 用户相关 API ==========
export const userApi = {
  // 用户注册
  register: (data) => request({ url: '/users/register', method: 'POST', data }),
  // 用户登录（密码登录）
  login: (data) => request({ url: '/users/login', method: 'POST', data }),
  // 发送验证码
  sendCode: (phone) => request({ url: '/users/send-code', method: 'POST', data: { phone } }),
  // 手机验证码登录
  loginByPhone: (data) => request({ url: '/users/login-phone', method: 'POST', data }),
  // 微信手机号一键登录
  loginByWxPhone: (code) => request({ url: '/users/login-wx-phone', method: 'POST', data: { code } }),
  // 更新个人信息（适配 FormData 上传，支持头像上传）
  updateProfile: (data) => request({ 
    url: '/users/profile', 
    method: 'PUT', 
    data,
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  // 修改密码
  changePassword: (data) => request({ url: '/users/change-password', method: 'POST', data }),
  // 更换手机号
  changePhone: (data) => request({ url: '/users/change-phone', method: 'POST', data }),
  // 获取个人信息（修正路径：/user → /users，统一规范）
  getProfile: (data) => request({ url: '/users/getProfile', method: 'POST', data }),
  // 密码登录（兼容原前端代码，修正路径：/user → /users）
  loginByPwd: (data) => request({ url: '/users/loginByPwd', method: 'POST', data })
};

// ========== 会场相关 API ==========
export const venueApi = {
  // 创建会场
  createVenue: (data) => request({ url: '/meeting-sessions', method: 'POST', data, timeout: 15000 }),
  // 更新会场
  updateVenue: (id, data) => request({ url: `/meeting-sessions/${id}`, method: 'PUT', data }),
  // 删除会场
  deleteVenue: (id) => request({ url: `/meeting-sessions/${id}`, method: 'DELETE' })
};

// ========== 日程收藏相关 API ==========
export const collectApi = {
  // 获取我的日程收藏列表
  getMyCollects: () => request({ url: '/collects/flow-steps', method: 'GET' }),
  // 新增日程收藏
  addCollect: (data) => request({ url: '/collects/flow-steps', method: 'POST', data }),
  // 取消日程收藏（根据agendaId和stepIndex，用params传递查询参数）
  removeCollect: (agendaId, stepIndex) => request({ 
    url: '/collects/flow-steps', 
    method: 'DELETE', 
    params: { agendaId, stepIndex }
  })
};


export default {
  agendaApi,
  meetingApi,
  noticeApi,
  receiptApi,
  userApi,
  venueApi,
  collectApi
};