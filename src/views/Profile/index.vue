<template>
  <div class="profile-container">
    <div class="profile-card">
      <!-- 返回箭头 -->
      <div class="back-btn" @click="goBack">
        <el-icon><arrow-left /></el-icon>
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
            />
            <el-icon v-else class="default-avatar"><User /></el-icon>
          </div>
          <div class="avatar-upload-btn">
            <input
              type="file"
              accept="image/*"
              @change="handleAvatarUpload"
              class="avatar-file-input"
              id="avatar-upload"
            />
            <label for="avatar-upload" class="upload-btn">
              <el-icon><Upload /></el-icon> 上传头像
            </label>
            <button
              v-if="userForm.avatar"
              class="reset-avatar-btn"
              @click="resetAvatar"
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
        <button class="save-btn" @click="saveUserInfo">保存修改</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowLeft, User, Upload } from "@element-plus/icons-vue";
import userApi from "@/api/userApi"; // 只去掉大括号，没有 * as
// 1. 导入 Pinia 用户仓库
import { useUserStore } from "@/stores/userStore";

const router = useRouter();
// 2. 实例化 Pinia 用户仓库
const userStore = useUserStore();

// 表单数据（仅用于前端展示和普通数据提交）
const userForm = reactive({
  id: "",
  username: "",
  phone: "",
  avatar: "",
});

// 原始头像文件对象（传给后端的核心数据，不存储 base64）
const avatarFile = ref(null);

// 校验头像地址是否有效（和 Mine 页保持一致，避免格式不匹配）
const isValidAvatarUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('http') || url.startsWith('data:image/');
};

onMounted(async () => {
  try {
    // 修复点：从 Pinia 中获取当前登录用户的 username，传递给后端
    const postData = {
      username: userStore.userInfo.username || 'test12345' // 兜底默认值，和后端对应
    };
    // 传递参数给 getProfile 接口
    const res = await userApi.getProfile(postData);

    if (res && res.code === 200 && res.data) {
      // 后续逻辑不变（省略）
      const validAvatar = isValidAvatarUrl(res.data.avatar) 
        ? res.data.avatar 
        : userStore.userInfo.avatar || userForm.avatar;

      userForm.id = res.data.id || "10001";
      userForm.username = res.data.username || "会议参与者";
      userForm.phone = res.data.phone || "";
      userForm.avatar = validAvatar || "";

      userStore.updateUserInfo({
        id: res.data.id,
        username: res.data.username,
        phone: res.data.phone,
        avatar: validAvatar,
      });

      localStorage.setItem("userInfo", JSON.stringify({
        id: res.data.id,
        username: res.data.username,
        phone: res.data.phone,
        avatar: validAvatar,
      }));
    }
  }catch (err) {
    // 接口失败时：优先读取 Pinia，再读取本地缓存
    if (userStore.id) {
      // Pinia 有数据，直接赋值
      userForm.id = userStore.id;
      userForm.username = userStore.username;
      userForm.phone = userStore.phone || "";
      userForm.avatar = userStore.avatar || "";
    } else {
      // Pinia 无数据，读取本地缓存
      const savedUserInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      userForm.id = savedUserInfo.id || "10001";
      userForm.username = savedUserInfo.username || "会议参与者";
      userForm.phone = savedUserInfo.phone || "";
      userForm.avatar = savedUserInfo.avatar || "";

      // 同步到 Pinia 全局状态
      userStore.updateUserInfo(savedUserInfo);
    }
    ElMessage.warning("获取个人信息失败，使用缓存数据");
  }
});

// 返回上一页（跳转到我的页面）
const goBack = () => {
  router.push("/mine");
};

// 处理头像上传（预览用 base64，提交用原始文件）
const handleAvatarUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // 校验文件类型
  if (!file.type.startsWith("image/")) {
    ElMessage.error("请上传图片格式的文件（JPG/PNG等）");
    return;
  }

  // 校验文件大小（2MB）
  if (file.size > 2 * 1024 * 1024) {
    ElMessage.error("头像大小不能超过2MB");
    return;
  }

  // 保存原始文件对象（用于提交）
  avatarFile.value = file;

  // 生成 base64 用于前端预览
  const reader = new FileReader();
  reader.onload = (event) => {
    userForm.avatar = event.target.result; // base64 格式，符合 Mine 页校验规则
  };
  reader.readAsDataURL(file);
};

// 重置头像（清空所有相关存储）
const resetAvatar = () => {
  // 清空表单头像
  userForm.avatar = "";
  // 清空原始文件对象
  avatarFile.value = null;
  // 清空文件输入框
  const fileInput = document.getElementById("avatar-upload");
  if (fileInput) fileInput.value = "";
  // 同步清空 Pinia 和本地存储
  const updatedUserInfo = {
    id: userForm.id,
    username: userForm.username,
    phone: userForm.phone,
    avatar: "", // 重置为空，显示默认图标
  };
  userStore.updateUserInfo(updatedUserInfo);
  localStorage.setItem("userInfo", JSON.stringify(updatedUserInfo));
  ElMessage.info("头像已重置");
};

// 保存个人信息（核心：FormData 提交 + 同步 Pinia 全局状态）
const saveUserInfo = async () => {
  // 简单校验
  if (!userForm.username.trim()) {
    ElMessage.warning("请输入用户名");
    return;
  }

  try {
    // 1. 构建 FormData 对象
    const formDataObj = new FormData();

    // 2. 追加普通数据
    formDataObj.append("id", userForm.id);
    formDataObj.append("username", userForm.username.trim());

    // 3. 追加头像文件（字段名 'avatar' 必须和后端 multer 一致）
    if (avatarFile.value) {
      formDataObj.append("avatar", avatarFile.value);
    }

    // 4. 调用后端接口
    const res = await userApi.updateProfile(formDataObj);

    if (res && res.code === 200) {
      ElMessage.success("个人信息保存成功");

      // 整理更新后的用户信息，优先保留有效头像
      const backendAvatar = res.data?.avatar || "";
      const finalAvatar = isValidAvatarUrl(backendAvatar) 
        ? backendAvatar 
        : (isValidAvatarUrl(userForm.avatar) ? userForm.avatar : "");

      const updatedUserInfo = {
        id: userForm.id,
        username: userForm.username.trim(),
        phone: userForm.phone,
        avatar: finalAvatar, // 最终生效的有效头像
      };

      // 5. 关键：更新 Pinia 全局状态（实现我的页面实时同步）
      userStore.updateUserInfo(updatedUserInfo);

      // 6. 同步更新本地存储（持久化，防止页面刷新丢失）
      localStorage.setItem("userInfo", JSON.stringify(updatedUserInfo));

      // 7. 返回我的页面
      goBack();
    }
  } catch (err) {
    ElMessage.error("保存失败：" + (err.response?.data?.msg || "服务器错误"));
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

.upload-btn:hover {
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

.reset-avatar-btn:hover {
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

.save-btn:hover {
  background-color: #1677ff;
}
</style>