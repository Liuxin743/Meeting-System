import request from '@/utils/request';

// 创建会议
export const createMeeting = (data) => {
  return request({
    url: '/meetings',
    method: 'POST',
    data
  });
};

// 获取我创建的会议
export const getMyMeetings = () => {
  return request({
    url: '/meetings/my',
    method: 'GET'
  });
};

// 获取会议详情（包含会场）
export const getMeetingDetails = (id) => {
  return request({
    url: `/meetings/${id}`,
    method: 'GET'
  });
};

// 更新会议
export const updateMeeting = (id, data) => {
  return request({
    url: `/meetings/${id}`,
    method: 'PUT',
    data
  });
};

// 删除会议
export const deleteMeeting = (id) => {
  return request({
    url: `/meetings/${id}`,
    method: 'DELETE'
  });
};

// 加入会议
export const joinMeeting = (meeting_code) => {
  return request({
    url: '/meetings/join',
    method: 'POST',
    data: { meeting_code }
  });
};

