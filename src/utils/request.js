import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: 'http://localhost:3000/api', 
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
})

// 响应拦截器（匹配后端返回格式）
request.interceptors.response.use(
  (res) => {
    // 直接返回后端的完整响应数据，方便页面判断 code
    return res.data;
  },
  (err) => {
    const errorMsg = err.response?.data?.msg || '请求失败，请稍后重试'
    ElMessage.error(errorMsg)
    return Promise.reject(err)
  }
)

export default request