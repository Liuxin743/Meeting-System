// src/stores/userStore.js
import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';

// 定义用户仓库，确保和页面的数据结构匹配
export const useUserStore = defineStore('user', () => {
  // 1. 定义用户信息（和页面的 userForm 字段一致）
  const userInfo = reactive({
    id: '',
    username: '',
    phone: '',
    avatar: ''
  });

  // 2. 定义 Token（登录必备，保持原有逻辑）
  const token = ref(localStorage.getItem('token') || '');

  // 3. 关键：添加 updateUserInfo 方法（页面中调用的就是这个）
  const updateUserInfo = (newUserInfo) => {
    // 合并新数据，保留原有未修改的字段，避免覆盖空值
    if (newUserInfo) {
      userInfo.id = newUserInfo.id || userInfo.id;
      userInfo.username = newUserInfo.username || userInfo.username;
      userInfo.phone = newUserInfo.phone || userInfo.phone;
      userInfo.avatar = newUserInfo.avatar || userInfo.avatar;
    }
  };

  // 4. 登录时初始化用户信息（可选，用于登录后直接赋值）
  const setUserInfo = (fullUserInfo) => {
    if (fullUserInfo) {
      userInfo.id = fullUserInfo.id || '';
      userInfo.username = fullUserInfo.username || '';
      userInfo.phone = fullUserInfo.phone || '';
      userInfo.avatar = fullUserInfo.avatar || '';
      // 同步 Token 并持久化
      if (fullUserInfo.token) {
        token.value = fullUserInfo.token;
        localStorage.setItem('token', fullUserInfo.token);
      }
    }
  };

  // 5. 退出登录时清空所有数据（避免残留）
  const logout = () => {
    // 清空用户信息
    userInfo.id = '';
    userInfo.username = '';
    userInfo.phone = '';
    userInfo.avatar = '';
    // 清空 Token
    token.value = '';
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
  };

  // 6. 新增：initUserInfo 方法（解决报错，从本地存储初始化用户信息）
  const initUserInfo = () => {
    try {
      // 从本地存储读取之前保存的用户信息
      const savedUserInfo = localStorage.getItem('userInfo');
      if (savedUserInfo) {
        // 解析 JSON 字符串为对象（避免格式错误）
        const parsedUserInfo = JSON.parse(savedUserInfo);
        // 调用已有的 setUserInfo 方法赋值，复用逻辑，避免冗余
        setUserInfo(parsedUserInfo);
      }
    } catch (error) {
      console.error('初始化用户信息失败：', error);
      // 解析失败时清空本地异常数据，防止下次再报错
      localStorage.removeItem('userInfo');
    }
  };

  return {
    userInfo,
    token,
    updateUserInfo,
    setUserInfo,
    logout,
    initUserInfo // 关键：暴露这个方法，让页面可以调用
  };
});