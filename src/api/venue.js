import request from '@/utils/request';

// 创建会场
export const createVenue = (data) => {
  return request({
    url: '/meeting-sessions',
    method: 'POST',
    data
  });
};

// 更新会场
export const updateVenue = (id, data) => {
  return request({
    url: `/meeting-sessions/${id}`,
    method: 'PUT',
    data
  });
};

// 删除会场
export const deleteVenue = (id) => {
  return request({
    url: `/meeting-sessions/${id}`,
    method: 'DELETE'
  });
};
