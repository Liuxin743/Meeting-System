import request from '@/utils/request'

// 创建通知
export function createNotice(data) {
  return request({
    url: '/notices',
    method: 'POST',
    data
  })
}

// 获取我的通知
export function getMyNotices() {
  return request({
    url: '/notices/my',
    method: 'GET'
  })
}
