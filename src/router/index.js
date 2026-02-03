import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus' 

import Home from '../views/Home/index.vue'
import Process from '../views/Process/index.vue'
import Detail from '../views/Detail/index.vue' 
import Mine from '../views/Mine/index.vue'
import CollectionPage from '../views/CollectionPage.vue'
import RemarkPage from '../views/RemarkPage.vue'
import SettingPage from '../views/SettingPage.vue'
import Login from '../views/Login/index.vue'
import Register from '../views/Register/index.vue'
import Profile from '../views/Profile/index.vue'
import SecurityCenter from '../views/Profile/SecurityCenter.vue'
import ChangePhone from '../views/Profile/ChangePhone.vue'
import ChangePassword from '../views/Profile/ChangePassword.vue'

const routes = [
  // 默认跳转到登录页
  { path: '/', redirect: '/login' },
  
  // 登录路由
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { 
      requiresAuth: false,
      title: '登录',
      showTabbar: false 
    } 
  },

  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { 
      requiresAuth: false, 
      title: '注册',
      showTabbar: false 
    }
  },

  {
    path: '/home',
    name: 'Home',
    component: Home,
    meta: { 
      tabIndex: 0, 
      module: '首页', 
      requiresAuth: true, 
      title: '首页',
      showTabbar: true 
    }
  },

  // 会议流程
  {
    path: '/process',
    name: 'Process',
    component: Process,
    meta: { 
      tabIndex: 1, 
      module: '会议流程', 
      requiresAuth: true,
      title: '会议流程',
      showTabbar: true 
    }
  },

  // 会议详情
  {
    path: '/detail',
    name: 'Detail',
    component: Detail,
    meta: { 
      tabIndex: 2, 
      module: '会议详情-日程安排', 
      requiresAuth: true,
      title: '会议详情',
      showTabbar: true
    }
  },

  {
    path: '/mine',
    name: 'Mine',
    component: Mine,
    meta: { 
      tabIndex: 3, 
      module: '我的', 
      requiresAuth: true,
      title: '个人中心',
      showTabbar: true 
    }
  },

  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { 
      requiresAuth: true,
      title: '个人信息管理',
      showTabbar: false 
    }
  },

  {
    path: '/collection',
    name: 'Collection',
    component: CollectionPage,
    meta: { 
      requiresAuth: true,
      title: '我的收藏',
      showTabbar: false 
    }
  },

  {
    path: '/remark',
    name: 'Remark',
    component: RemarkPage,
    meta: { 
      requiresAuth: true,
      title: '我的备注',
      showTabbar: false 
    }
  },

  {
    path: '/setting',
    name: 'Setting',
    component: SettingPage,
    meta: { 
      requiresAuth: true,
      title: '系统设置',
      showTabbar: false 
    }
  },

  {
    path: '/security',
    name: 'SecurityCenter',
    component: SecurityCenter,
    meta: { 
      requiresAuth: true, 
      title: '安全中心',
      showTabbar: false 
    }
  },
  {
    path: '/security/change-phone',
    name: 'ChangePhone',
    component: ChangePhone,
    meta: { 
      requiresAuth: true, 
      title: '换绑手机',
      showTabbar: false
    }
  },
  {
    path: '/security/change-password',
    name: 'ChangePassword',
    component: ChangePassword,
    meta: { 
      requiresAuth: true, 
      title: '修改密码',
      showTabbar: false 
    }
  },

  // 404路由（兜底）
  {
    path: '/:pathMatch(.*)*',
    redirect: '/home',
    meta: { 
      requiresAuth: true,
      showTabbar: true 
    }
  }
]

const router = createRouter({
  history: createWebHistory(), 
  routes,
  // 路由跳转时滚动到顶部（优化体验）
  scrollBehavior() {
    return { top: 0 }
  }
})

// 路由守卫：权限校验 + 页面标题设置
router.beforeEach((to, from, next) => {
  // 1. 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title
  }

  // 2. 权限校验
  const requiresAuth = to.meta.requiresAuth || false
  const token = localStorage.getItem('token')
  
  if (requiresAuth) {
    // 需要登录的页面
    if (token) {
      // 简单校验JWT Token格式（三段式）
      if (token.split('.').length === 3) {
        next() // Token有效，放行
      } else {
        // Token格式错误，清除无效Token并跳转登录
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        ElMessage.error('登录状态无效，请重新登录！')
        next('/login')
      }
    } else {
      // 无Token，提示并跳转登录
      ElMessage.warning('请先登录后再操作！')
      next('/login')
    }
  } else {
    // 无需登录的页面（登录/注册）
    if (to.path === '/login' && token) {
      // 已登录状态访问登录页，自动跳首页
      ElMessage.info('您已登录，即将跳转到首页')
      next('/home')
    } else if (to.path === '/register' && token) {
      // 已登录状态访问注册页，自动跳首页
      ElMessage.info('您已登录，无需注册')
      next('/home')
    } else {
      next() // 放行
    }
  }
})

export default router