<template>
  <div class="change-phone-container">
    <!-- 返回箭头 -->
    <div class="back-btn" @click="goBack">
      <el-icon><ArrowLeft /></el-icon>
    </div>

    <h2 class="page-title">换绑手机</h2>

    <div class="form-container">
      <!-- 新手机号 -->
      <div class="form-item">
        <label class="form-label">新手机号</label>
        <input
          v-model="phoneForm.phone"
          type="tel"
          class="form-input"
          placeholder="请输入新手机号"
          maxlength="11"
          @input="formatPhone"
        />
      </div>

      <!-- 验证码 -->
      <div class="form-item">
        <label class="form-label">验证码</label>
        <div class="code-wrap">
          <input
            v-model="phoneForm.code"
            type="text"
            class="form-input code-input"
            placeholder="请输入验证码"
            maxlength="6"
          />
          <button
            class="get-code-btn"
            @click="sendCode"
            :disabled="isCodeDisabled || sendLoading"
          >
            {{ sendLoading ? '发送中...' : codeText }}
          </button>
        </div>
      </div>

      <!-- 确认更换按钮 -->
      <button
        class="confirm-btn"
        @click="handleChangePhone"
        :disabled="!phoneForm.phone || !phoneForm.code || confirmLoading"
      >
        {{ confirmLoading ? '处理中...' : '确认更换' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowLeft } from "@element-plus/icons-vue";
import userApi from "@/api/userApi";

const router = useRouter();

// 表单数据
const phoneForm = reactive({
  phone: "",
  code: "",
});

// 验证码相关状态
const isCodeDisabled = ref(false);
const codeText = ref("获取验证码");
const sendLoading = ref(false); // 1. 新增：发送验证码加载状态
const confirmLoading = ref(false); // 1. 新增：确认更换加载状态
let timer = null;

// 格式化手机号
const formatPhone = () => {
  phoneForm.phone = phoneForm.phone.replace(/\D/g, "");
};

// 手机号格式校验正则
const validatePhone = (phone) => {
  return /^1[3-9]\d{9}$/.test(phone);
};

// 验证码格式校验正则
const validateCode = (code) => {
  return /^\d{6}$/.test(code);
};

const goBack = () => {
  router.back();
};

// 发送验证码
const sendCode = async () => {
  // 第一步：手机号格式校验
  if (!validatePhone(phoneForm.phone)) {
    ElMessage.warning("请输入有效的11位手机号");
    return;
  }

  try {
    // 第二步：设置发送加载状态
    sendLoading.value = true;

    // 第三步：调用后端发送验证码接口
    await userApi.sendCode(phoneForm.phone);
    ElMessage.success("验证码已发送，请注意查收");

    // 第四步：启动倒计时（优化健壮性）
    isCodeDisabled.value = true;
    let count = 60;
    codeText.value = `${count}s后重发`;

    // 清除残留定时器（防止重复创建）
    if (timer) clearInterval(timer);

    timer = setInterval(() => {
      count--;
      codeText.value = `${count}s后重发`;
      if (count <= 0) {
        clearInterval(timer);
        timer = null; // 重置定时器变量
        isCodeDisabled.value = false;
        codeText.value = "获取验证码";
      }
    }, 1000);
  } catch (err) {
    // 第五步：优化错误提示，适配后端返回字段
    const errMsg = err.response?.data?.msg || err.response?.data?.message || "验证码发送失败，请稍后重试";
    ElMessage.error(errMsg);
    console.error("发送验证码报错：", err);
  } finally {
    // 第六步：关闭发送加载状态
    sendLoading.value = false;
  }
};

// 提交更换手机号
const handleChangePhone = async () => {
  //前端二次校验
  if (!validatePhone(phoneForm.phone)) {
    ElMessage.warning("请输入有效的11位手机号");
    return;
  }

  if (!validateCode(phoneForm.code)) {
    ElMessage.warning("请输入有效的6位数字验证码");
    return;
  }

  try {
    // 第二步：设置确认加载状态
    confirmLoading.value = true;

    // 第三步：调用后端更换手机号接口
    await userApi.changePhone({
      phone: phoneForm.phone,
      code: phoneForm.code,
    });

    // 第四步：操作成功处理
    ElMessage.success("手机号更换成功");

    // 更新本地存储的用户信息
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    if (userInfo) {
      userInfo.phone = phoneForm.phone;
      localStorage.setItem("userInfo", JSON.stringify(userInfo));
    }

    // 延迟返回，让用户看到成功提示
    setTimeout(() => {
      goBack();
    }, 1500);
  } catch (err) {
    // 第五步：优化错误提示
    const errMsg = err.response?.data?.msg || err.response?.data?.message || "手机号更换失败，请检查验证码是否正确或已过期";
    ElMessage.error(errMsg);
    console.error("更换手机号报错：", err);
  } finally {
    // 第六步：关闭确认加载状态
    confirmLoading.value = false;
  }
};

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
});
</script>

<style scoped>
.change-phone-container {
  min-height: 100vh;
  background-color: #ffffff;
  padding: 20px;
  position: relative;
  max-width: 600px;
  margin: 0 auto;
}

.back-btn {
  position: absolute;
  top: 30px;
  left: 30px;
  font-size: 20px;
  color: #333;
  cursor: pointer;
}

.page-title {
  text-align: center;
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 30px 0 40px;
}

.form-container {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 20px;
}

.form-item {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #1989fa;
}

.code-wrap {
  display: flex;
  gap: 10px;
  align-items: center;
}

.code-input {
  flex: 1;
}

.get-code-btn {
  width: 120px;
  padding: 12px 0;
  background-color: #1989fa;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.get-code-btn:disabled {
  background-color: #c8c9cc;
  cursor: not-allowed;
}

.confirm-btn {
  width: 100%;
  padding: 14px 0;
  background: linear-gradient(90deg, #1989fa, #40a9ff);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.confirm-btn:disabled {
  background: #c8c9cc;
  cursor: not-allowed;
}

.confirm-btn:hover:not(:disabled) {
  opacity: 0.9;
}
</style>