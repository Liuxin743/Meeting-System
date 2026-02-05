import axios from 'axios';

// 基础地址配置
let baseUrl = 'http://47.110.88.34:8889/api';

if (process.env.NODE_ENV === 'production') {
  baseUrl = '/api'; 
}

// 创建 axios 实例
const service = axios.create({
  baseURL: baseUrl,
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器：携带 Token
service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('请求拦截器错误：', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (response.status >= 200 && response.status < 300) {
      return res;
    } else {
      // 提示错误信息
      alert(res.message || '请求失败');
      return Promise.reject(res);
    }
  },
  (error) => {
    // 统一处理错误
    if (error.response) {
      const status = error.response.status;
      const res = error.response.data;
      if (status === 401) {
        alert(res.message || '请先登录');
        // router.push('/login');
      } else {
        alert(res.message || '请求失败');
      }
    } else {
      alert('网络请求失败，请检查网络连接');
    }
    console.error('响应拦截器错误：', error);
    return Promise.reject(error);
  }
);

export default service;