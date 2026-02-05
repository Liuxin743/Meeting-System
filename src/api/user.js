import request from '@/utils/request';

// 用户注册
export function register(data) {
  return request({
    url: '/users/register',
    method: 'POST',
    data
  });
}

// 用户登录
export function login(data) {
  return request({
    url: '/users/login',
    method: 'POST',
    data
  });
}

// 发送验证码
export function sendCode(phone) {
  return request({
    url: '/users/send-code',
    method: 'POST',
    data: { phone }
  });
}

// 手机验证码登录
export function loginByPhone(data) {
  return request({
    url: '/users/login-phone',
    method: 'POST',
    data
  });
}

// 微信手机号一键登录
export function loginByWxPhone(code) {
  return request({
    url: '/users/login-wx-phone',
    method: 'POST',
    data: { code }
  });
}

// 更新个人信息
export function updateProfile(data) {
  return request({
    url: '/users/profile',
    method: 'PUT',
    data
  });
}

// 修改密码
export function changePassword(data) {
  return request({
    url: '/users/change-password',
    method: 'POST',
    data
  });
}

// 更换手机号
export function changePhone(data) {
  return request({
    url: '/users/change-phone',
    method: 'POST',
    data
  });
}
