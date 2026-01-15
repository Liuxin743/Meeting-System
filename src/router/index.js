import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home/index.vue'
import Process from '../views/Process/index.vue'
import Detail from '../views/Detail/index.vue' 
import Mine from '../views/Mine/index.vue'
import CollectionPage from '../views/CollectionPage.vue'
import RemarkPage from '../views/RemarkPage.vue'
import SettingPage from '../views/SettingPage.vue'

const routes = [
  { path: '/', redirect: '/home' },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    meta: { tabIndex: 0, module: '首页' }
  },
  {
    path: '/process',
    name: 'Process',
    component: Process,
    meta: { tabIndex: 1, module: '会议流程' }
  },
  {
    path: '/detail', // 对应“会议详情（日程安排）”
    name: 'Detail',
    component: Detail,
    meta: { tabIndex: 2, module: '会议详情-日程安排' }
  },
  {
    path: '/mine',
    name: 'Mine',
    component: Mine,
    meta: { tabIndex: 3, module: '我的' }
  },
  {
    path: '/collection',
    name: 'Collection',
    component: CollectionPage
  },
  {
    path: '/remark',
    name: 'Remark',
    component: RemarkPage
  },
  {
    path: '/setting',
    name: 'Setting',
    component: SettingPage
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router