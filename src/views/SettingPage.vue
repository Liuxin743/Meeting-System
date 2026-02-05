<template>
  <div class="setting-page">
    <div class="page-header">
      <van-icon
        name="arrow-left"
        size="20"
        color="#1989fa"
        class="back-icon"
        @click="goBack"
        :disabled="isOperating"
      />
      <div class="page-title">系统设置</div>
    </div>

    <!-- 内容区域 -->
    <div class="page-content">
      <div class="setting-card card-common">
        <div class="setting-item" @click="goToSecurityCenter" :class="{ disabled: isOperating }">
          <div class="setting-label">安全中心</div>
          <van-icon name="arrow-right" size="16" color="#c8c9cc" />
        </div>
        <!-- 通用设置项 -->
        <div class="setting-item">
          <div class="setting-label">清除缓存</div>
          <button class="btn-normal mini-btn" @click="clearCache" :disabled="isOperating">
            {{ isOperating ? '处理中...' : '一键清除' }}
          </button>
        </div>
        <div class="setting-item">
          <div class="setting-label">消息通知</div>
          <van-switch 
            v-model="notificationSwitch" 
            color="#1989fa"
            :disabled="isOperating"
            @change="handleNotificationSwitchChange"
          />
        </div>

        <div class="setting-item" @click="goToAbout" :class="{ disabled: isOperating }">
          <div class="setting-label">关于我们</div>
          <van-icon
            name="arrow-right"
            size="16"
            color="#c8c9cc"
          />
        </div>
        <div class="setting-item">
          <div class="setting-label">版本信息</div>
          <div class="version-text">v1.0.0</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useAgendaStore } from "../stores/agendaStore";
import { useUserStore } from "../stores/userStore"; 
import { ElMessage, ElMessageBox } from "element-plus";

const router = useRouter();
const agendaStore = useAgendaStore();
const userStore = useUserStore();

const notificationSwitch = ref(true);
const isOperating = ref(false); // 操作加载状态，防止重复点击

// 页面挂载初始化消息通知开关
onMounted(() => {
  const savedSwitch = localStorage.getItem("notificationSwitch");
  if (savedSwitch !== null) {
    notificationSwitch.value = savedSwitch === "true";
  }
});

// 返回我的页面
const goBack = () => {
  if (!isOperating.value) {
    router.push({ path: "/mine" });
  }
};

// 跳转到安全中心
const goToSecurityCenter = () => {
  if (!isOperating.value) {
    router.push("/security");
  }
};

// 清除缓存
const clearCache = async () => {
  if (isOperating.value) return;
  try {
    await ElMessageBox.confirm(
      "确定要清除所有缓存吗？清除后本地保存的非云端数据将丢失",
      "提示",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
  } catch (err) {
    ElMessage.info("已取消清除缓存");
    return;
  }

  try {
    isOperating.value = true;
    agendaStore.clearAgendaStorage();
    localStorage.removeItem("userInfo");
    localStorage.removeItem("userName");
    localStorage.removeItem("userAvatar");
    localStorage.removeItem("notificationSwitch");
    localStorage.removeItem("redirect");
    userStore.clearLocalUserCache();
    ElMessage.success("缓存已清除完成！");
  } catch (err) {
    ElMessage.error("缓存清除失败：" + err.message);
    console.error("清除缓存报错：", err);
  } finally {
    setTimeout(() => {
      isOperating.value = false;
    }, 500);
  }
};

const goToAbout = () => {
  if (isOperating.value) return;
  ElMessage.info("会议管理系统 v1.0.0，专注于高效会议议程管理");
};

const handleNotificationSwitchChange = async (newValue) => {
  if (isOperating.value) return;

  localStorage.setItem("notificationSwitch", newValue);
  try {
    const token = localStorage.getItem("token");
    const userInfo = userStore.userInfo;
    if (token && userInfo.id) {
      isOperating.value = true;

      // 调用后端更新消息通知状态接口（需封装 api）
      // const res = await userApi.updateNotificationStatus({
      //   userId: userInfo.id,
      //   notificationStatus: newValue
      // });

      // 模拟接口调用
      await new Promise(resolve => setTimeout(resolve, 300));
      ElMessage.success(newValue ? "已开启消息通知" : "已关闭消息通知");
    }
  } catch (err) {
    ElMessage.warning("消息通知状态云端同步失败，仅本地生效");
    console.error("同步消息通知状态报错：", err);
  } finally {
    // 关闭操作状态
    isOperating.value = false;
  }
};

// 监听消息通知开关变化
watch(notificationSwitch, (newValue) => {
  if (!isOperating.value) {
    localStorage.setItem("notificationSwitch", newValue);
  }
});
</script>

<style scoped>
/* 整体样式 */
.setting-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.page-header {
  display: flex;
  align-items: center;
  position: relative;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  padding: 15px;
  background-color: #ffffff;
  border-bottom: 1px solid #f0f0f0;
}

/* 返回图标样式 */
.back-icon {
  cursor: pointer;
  margin-right: 12px;
  transition: color 0.2s;
}
.back-icon:disabled {
  color: #c8c9cc;
  cursor: not-allowed;
}
.back-icon:hover:not(:disabled) {
  color: #1677ff;
}

/* 标题 */
.page-title {
  flex: 1;
  text-align: center;
  margin-right: 20px;
}

/* 内容*/
.page-content {
  padding: 10px;
  width: 100%;
  box-sizing: border-box;
}

/* 通用卡片样式 */
.card-common {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 10px;
}

/* 系统设置项样式 */
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}
.setting-item:last-child {
  border-bottom: none;
}
.setting-item.disabled {
  background-color: #f9fafb;
  color: #c8c9cc;
  cursor: not-allowed;
}
.setting-item:hover:not(.disabled) {
  background-color: #f5fafe;
}

.setting-label {
  font-size: 14px;
  color: #333;
}

.version-text {
  font-size: 12px;
  color: #666;
}

/* 按钮样式 */
.btn-normal {
  background-color: #e6f7ff;
  color: #1989fa;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
.btn-normal:disabled {
  background-color: #d9efff;
  color: #8cc5ff;
  cursor: not-allowed;
}
.btn-normal:hover:not(:disabled) {
  background-color: #d1eaff;
}

.mini-btn {
  padding: 4px 8px;
  font-size: 12px;
}
</style>