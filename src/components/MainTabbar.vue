<template>
  <div class="main-tabbar-container">
    <van-config-provider :theme-vars="themeVars">
      <router-view class="page-container" />
      <van-tabbar
        v-model="activeTab"
        class="bottom-tabbar"
        fixed
        @change="handleTabChange"
      >
        <van-tabbar-item icon="home-o" class="custom-tab-item">
          <span class="tab-custom-text">首页</span>
        </van-tabbar-item>
        <van-tabbar-item icon="label-o" class="custom-tab-item">
          <span class="tab-custom-text">会议流程</span>
        </van-tabbar-item>
        <van-tabbar-item icon="info-o" class="custom-tab-item">
          <span class="tab-custom-text">收藏议程</span>
        </van-tabbar-item>
        <van-tabbar-item icon="user-o" class="custom-tab-item">
          <span class="tab-custom-text">我的</span>
        </van-tabbar-item>
      </van-tabbar>
    </van-config-provider>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { reactive } from "vue";

const router = useRouter();
const route = useRoute();

const themeVars = reactive({
  "--van-font-size-base": "12px",
  "--van-cell-group-border-radius": "8px",
  "--van-card-border-radius": "8px",
  "--van-tabbar-height": "55px", 
  "--van-tabbar-background-color": "#ffffff",
  "--van-tabbar-item-icon-size": "20px", 
  "--van-tabbar-item-text-font-size": "12px", 
  "--van-tabbar-item-margin": "0", 
});

// Tabbar 激活状态
const activeTab = ref(0);

// 监听路由变化，更新Tabbar激活状态
watch(
  () => route.path,
  (newPath) => {
    const currentRoute = router
      .getRoutes()
      .find((route) => route.path === newPath);
    if (currentRoute && currentRoute.meta.tabIndex !== undefined) {
      activeTab.value = currentRoute.meta.tabIndex;
    }
  },
  { immediate: true }
);

// Tabbar 切换时，跳转对应路由
const handleTabChange = (index) => {
  const routeMap = [
    "/home", // 0: 首页
    "/process", // 1: 会议流程
    "/detail", // 2: 收藏议程
    "/mine", // 3: 我的
  ];
  if (index >= 0 && index < routeMap.length) {
    router.push(routeMap[index]);
  }
};
</script>

<style scoped>
.main-tabbar-container {
  min-height: 100vh;
  padding-bottom: 55px; 
  position: relative;
  box-sizing: border-box; 
}

.bottom-tabbar {
  height: 55px; 
  box-shadow: 0 -1px 10px rgba(0, 0, 0, 0.05);
  overflow: visible; 
}

.page-container {
  width: 100%;
  height: 100%;
}


.custom-tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px 0; 
  box-sizing: border-box;
}
</style>

<style>
.tab-custom-text {
  font-size: 12px !important; 
  color: #666 !important; 
  display: inline-block !important; 
  line-height: 1.2 !important; 
  margin-top: 2px !important; 
  opacity: 1 !important;
  white-space: nowrap; 
  text-align: center; 
  max-width: 60px; 
  overflow: hidden; 
  text-overflow: ellipsis; 
}

.van-tabbar-item--active .tab-custom-text {
  color: #1989fa !important; 
}


.van-tabbar-item__text {
  padding: 0 !important;
  margin: 0 !important;
}
</style>