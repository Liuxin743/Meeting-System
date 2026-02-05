<template>
  <div class="profile-container">
    <div class="profile-card">
      <!-- 返回箭头 -->
      <div class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
      </div>

      <h2 class="profile-title">个人信息管理</h2>

      <!-- 头像上传区域 -->
      <div class="avatar-section">
        <label class="form-label">用户头像</label>
        <div class="avatar-upload-wrap">
          <div class="avatar-preview">
            <img
              v-if="userForm.avatar"
              :src="userForm.avatar"
              alt="用户头像"
              class="avatar-img"
              loading="lazy"
            />
            <el-icon v-else class="default-avatar"><User /></el-icon>
          </div>
          <div class="avatar-upload-btn">
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif"
              @change="handleAvatarUpload"
              class="avatar-file-input"
              id="avatar-upload"
              :disabled="saveLoading"
            />
            <label for="avatar-upload" class="upload-btn" :class="{ disabled: saveLoading }">
              <el-icon><Upload /></el-icon> 上传头像
            </label>
            <button
              v-if="userForm.avatar"
              class="reset-avatar-btn"
              @click="resetAvatar"
              :disabled="saveLoading"
            >
              重置头像
            </button>
          </div>
        </div>
      </div>

      <!-- 用户名编辑 -->
      <div class="form-item">
        <label class="form-label">用户名</label>
        <input
          v-model="userForm.username"
          type="text"
          class="form-input"
          placeholder="请输入用户名"
          maxlength="20"
          :disabled="saveLoading"
        />
      </div>

      <!-- 手机号显示 -->
      <div class="form-item">
        <label class="form-label">手机号</label>
        <input
          v-model="userForm.phone"
          type="text"
          class="form-input readonly-input"
          readonly
          placeholder="未绑定手机号"
        />
      </div>

      <!-- 用户ID（只读） -->
      <div class="form-item">
        <label class="form-label">用户ID</label>
        <input
          v-model="userForm.id"
          type="text"
          class="form-input readonly-input"
          readonly
          placeholder="系统自动生成"
        />
      </div>

      <div class="btn-group">
        <button class="save-btn" @click="saveUserInfo" :disabled="saveLoading || !userForm.username.trim()">
          {{ saveLoading ? '保存中...' : '保存修改' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import userApi from "@/api/index"; 
import { useUserStore } from "@/stores/userStore";

const router = useRouter();
const userStore = useUserStore();

// 表单数据
const userForm = reactive({
  id: "",
  username: "",
  phone: "",
  avatar: "",
});

// 核心状态变量
const avatarFile = ref(null);
const saveLoading = ref(false);
let fileReader = null;

// 校验头像地址
const isValidAvatarUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('http') || url.startsWith('data:image/');
};

// 页面挂载：获取个人信息
onMounted(async () => {
  try {
    // 构建请求参数
    const postData = {
      username: userStore.userInfo?.username || 'test12345'
    };
    // 调用修复后的getProfile接口
    const res = await userApi.getProfile(postData);

    if (res && res.code === 200 && res.data) {
      const validAvatar = isValidAvatarUrl(res.data.avatar) 
        ? res.data.avatar 
        : (userStore.userInfo?.avatar || "");

      // 赋值表单数据
      userForm.id = res.data.id || "10001";
      userForm.username = res.data.username || "会议参与者";
      userForm.phone = res.data.phone || "";
      userForm.avatar = validAvatar;

      // 同步Pinia和本地存储
      const updatedUserInfo = {
        id: res.data.id,
        username: res.data.username,
        phone: res.data.phone,
        avatar: validAvatar,
      };
      userStore.updateUserInfo(updatedUserInfo);
      localStorage.setItem("userInfo", JSON.stringify(updatedUserInfo));
    }
  } catch (err) {
    // 降级处理
    const savedUserInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    userForm.id = savedUserInfo.id || "10001";
    userForm.username = savedUserInfo.username || "会议参与者";
    userForm.phone = savedUserInfo.phone || "";
    userForm.avatar = savedUserInfo.avatar || "";

    userStore.updateUserInfo(savedUserInfo);
    ElMessage.warning("获取个人信息失败，使用本地缓存数据");
  }
});

// 组件销毁
onUnmounted(() => {
  if (fileReader && fileReader.readyState !== 2) {
    fileReader.abort();
  }
  fileReader = null;
  avatarFile.value = null;
});

// 返回我的页面
const goBack = () => {
  if (!saveLoading.value) {
    router.push("/mine");
  }
};

// 处理头像上传
const handleAvatarUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    ElMessage.error("请上传 JPG/PNG/GIF 格式的图片");
    return;
  }

  const maxSize = 2 * 1024 * 1024;
  if (file.size > maxSize) {
    ElMessage.error("头像大小不能超过 2MB");
    return;
  }

  avatarFile.value = file;
  fileReader = new FileReader();
  fileReader.onload = (event) => {
    const base64Url = event.target.result;
    if (isValidAvatarUrl(base64Url)) {
      userForm.avatar = base64Url;
    }
  };
  fileReader.onerror = () => {
    ElMessage.error("图片读取失败，请重新上传");
    avatarFile.value = null;
  };
  fileReader.readAsDataURL(file);
};

// 重置头像
const resetAvatar = () => {
  if (saveLoading.value) return;

  userForm.avatar = "";
  avatarFile.value = null;
  const fileInput = document.getElementById("avatar-upload");
  if (fileInput) fileInput.value = "";

  const updatedUserInfo = {
    id: userForm.id,
    username: userForm.username,
    phone: userForm.phone,
    avatar: "",
  };
  userStore.updateUserInfo(updatedUserInfo);
  localStorage.setItem("userInfo", JSON.stringify(updatedUserInfo));

  ElMessage.info("头像已重置");
};

// 保存个人信息
const saveUserInfo = async () => {
  const username = userForm.username.trim();
  if (!username) {
    ElMessage.warning("请输入有效的用户名");
    return;
  }

  try {
    saveLoading.value = true;

    // 构建FormData
    const formDataObj = new FormData();
    formDataObj.append("id", userForm.id);
    formDataObj.append("username", username);
    if (avatarFile.value) {
      formDataObj.append("avatar", avatarFile.value, avatarFile.value.name);
    }

    // 调用修复后的updateProfile接口
    const res = await userApi.updateProfile(formDataObj);

    if (res && res.code === 200) {
      ElMessage.success("个人信息保存成功");

      const backendAvatar = res.data?.avatar || "";
      const finalAvatar = isValidAvatarUrl(backendAvatar) 
        ? backendAvatar 
        : (isValidAvatarUrl(userForm.avatar) ? userForm.avatar : "");

      const updatedUserInfo = {
        id: userForm.id,
        username: username,
        phone: userForm.phone,
        avatar: finalAvatar,
      };
      userStore.updateUserInfo(updatedUserInfo);
      localStorage.setItem("userInfo", JSON.stringify(updatedUserInfo));

      setTimeout(() => {
        goBack();
      }, 1000);
    } else {
      ElMessage.warning("保存失败：" + (res?.data?.msg || "未知错误"));
    }
  } catch (err) {
    let errMsg = "服务器错误，请稍后重试";
    if (err.response?.status === 400) {
      errMsg = "参数错误：" + (err.response.data.msg || "用户名或头像格式无效");
    } else if (err.response?.status === 401) {
      errMsg = "登录状态失效，请重新登录";
      localStorage.removeItem("token");
      localStorage.removeItem("userInfo");
      userStore.clearUserInfo();
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } else if (err.response?.data?.msg) {
      errMsg = "保存失败：" + err.response.data.msg;
    }
    ElMessage.error(errMsg);
    console.error("个人信息更新报错：", err);
  } finally {
    saveLoading.value = false;
  }
};
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  height: 100%;
  background-color: #ffffff;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  box-sizing: border-box;
  padding: 0;
}

.profile-card {
  position: relative;
  width: 100%;
  max-width: 600px;
  min-height: 100vh;
  background: transparent;
  box-shadow: none;
  padding: 40px 20px;
  padding-top: 50px;
  box-sizing: border-box;
}

.back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  font-size: 20px;
  color: #333;
  cursor: pointer;
  transition: color 0.2s;
}

.back-btn:hover {
  color: #1989fa;
}

.profile-title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.avatar-section {
  margin-bottom: 24px;
}

.avatar-upload-wrap {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background-color: #f5fafe;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-avatar {
  font-size: 40px;
  color: #1989fa;
}

.avatar-upload-btn {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.avatar-file-input {
  display: none;
}

.upload-btn {
  padding: 8px 16px;
  background-color: #1989fa;
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  transition: background-color 0.2s;
}

.upload-btn.disabled {
  background-color: #c8c9cc;
  cursor: not-allowed;
}

.upload-btn:hover:not(.disabled) {
  background-color: #1677ff;
}

.reset-avatar-btn {
  padding: 8px 16px;
  background-color: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.reset-avatar-btn:disabled {
  background-color: #e8e8e8;
  color: #999;
  cursor: not-allowed;
}

.reset-avatar-btn:hover:not(:disabled) {
  background-color: #e8e8e8;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #1989fa;
}

.form-input:disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
}

.readonly-input {
  background-color: #f9fafb;
  color: #666;
  cursor: not-allowed;
}

.btn-group {
  display: flex;
  justify-content: center;
  margin-top: 30px;
  padding-top: 20px;
}

.save-btn {
  padding: 12px 32px;
  background-color: #1989fa;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-btn:disabled {
  background-color: #c8c9cc;
  cursor: not-allowed;
}

.save-btn:hover:not(:disabled) {
  background-color: #1677ff;
}
</style>