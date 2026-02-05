import { defineStore } from 'pinia'
import { ref } from 'vue'

// 定义并导出 Pinia 仓库
export const useUserStore = defineStore('user', () => {
  // 全局用户信息状态
  const userInfo = ref(null)

  const initUserInfo = () => {
    // 从 localStorage 中读取缓存的用户信息
    const savedUserInfo = localStorage.getItem('userInfo')
    if (savedUserInfo) {
      try {
        userInfo.value = JSON.parse(savedUserInfo)
      } catch (err) {
        console.error('解析用户信息失败：', err)
        userInfo.value = null
        localStorage.removeItem('userInfo')
      }
    } else {
      userInfo.value = null
    }
  }

  // 更新用户信息
  const updateUserInfo = (newUserInfo) => {
    if (newUserInfo && typeof newUserInfo === 'object') {
      // 合并原有用户信息和新信息
      userInfo.value = {
        ...userInfo.value,
        ...newUserInfo
      }
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
    }
  }

  //  清空用户信息
  const clearUserInfo = () => {
    userInfo.value = null
    localStorage.removeItem('userInfo')
    localStorage.removeItem('token')
  }

  // 设置用户信息
  const setUserInfo = (fullUserInfo) => {
    userInfo.value = fullUserInfo
    if (fullUserInfo) {
      localStorage.setItem('userInfo', JSON.stringify(fullUserInfo))
    } else {
      localStorage.removeItem('userInfo')
    }
  }

  // 导出状态和方法，供页面调用
  return {
    userInfo,
    initUserInfo,
    updateUserInfo,
    clearUserInfo,
    setUserInfo
  }
})