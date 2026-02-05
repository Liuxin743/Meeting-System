import request from '@/utils/request'

// 提交回执
export function submitReceipt(data) {
  return request({
    url: '/receipts',
    method: 'POST',
    data
  })
}

// 获取某会议的回执列表
export function getReceiptsByMeeting(meetingId) {
  return request({
    url: `/receipts/meeting/${meetingId}`,
    method: 'GET'
  })
}

// 根据会议号查询会议信息
export function getMeetingByCode(code) {
  return request({
    url: `/meetings/check-code?code=${code}`,
    method: 'GET'
  })
}
