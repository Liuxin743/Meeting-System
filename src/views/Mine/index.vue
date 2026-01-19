<template>
  <div class="mine-view">
    <div class="page-content">
      <!-- 个人信息卡片 -->
      <div class="user-card card-common" style="margin-bottom: 10px;" @click="openUserEditDialog">
        <div class="user-info">
          <div class="user-avatar">
            <van-icon v-if="!userAvatar" name="user" size="30" color="#1989fa" />
            <img v-else class="avatar-img" :src="userAvatar" alt="用户头像" />
          </div>
          <div class="user-detail">
            <div class="user-name">{{ userName }}</div>
            <div class="user-id">ID：10001</div>
            <div class="edit-tip">点击可编辑头像和名称</div>
          </div>
        </div>
      </div>

      <!-- 功能入口 -->
      <div class="function-group card-common" style="margin-top: 10px;">
        <div class="function-item" @click="goToCollection">
          <van-icon name="star" size="20" color="#1989fa" class="function-icon" />
          <span class="function-title">我的收藏</span>
          <van-icon name="arrow-right" size="16" color="#c8c9cc" class="function-arrow" />
        </div>
        <div class="function-item" @click="goToRemark">
          <van-icon name="edit" size="20" color="#1989fa" class="function-icon" />
          <span class="function-title">我的备注</span>
          <van-icon name="arrow-right" size="16" color="#c8c9cc" class="function-arrow" />
        </div>
        <div class="function-item" @click="goToSetting">
          <van-icon name="setting" size="20" color="#1989fa" class="function-icon" />
          <span class="function-title">系统设置</span>
          <van-icon name="arrow-right" size="16" color="#c8c9cc" class="function-arrow" />
        </div>
      </div>

      <!-- 新增：创建新议程按钮（迁移自首页） -->
      <button class="create-agenda-btn" @click="openCreateDialog" style="margin: 10px 0;">
        + 创建新议程
      </button>

      <!-- 我的收藏议程 -->
      <div class="collection-card card-common" style="margin-top: 10px;">
        <h3 class="card-title">我的收藏</h3>
        <div class="empty-tip" v-if="collectedAgendas.length === 0">
          暂无收藏的议程
        </div>
        <div class="collection-list" v-else>
          <div class="collection-item" v-for="agenda in collectedAgendas" :key="agenda.id">
            <div class="collection-content">
              <div class="collection-title">{{ agenda.title }}</div>
              <div class="collection-label">标签：{{ agenda.tags.join('、') || '无标签' }}</div>
            </div>
            <button class="btn-danger mini-btn" @click="handleCancelCollect(agenda.id)">
              取消收藏
            </button>
          </div>
        </div>
      </div>

      <!-- 我的备注记录 -->
      <div class="remark-card card-common" style="margin-top: 10px;">
        <h3 class="card-title">我的备注</h3>
        <div class="empty-tip" v-if="remarkAgendas.length === 0">
          暂无备注的议程
        </div>
        <div class="remark-list" v-else>
          <div class="remark-item" v-for="agenda in remarkAgendas" :key="agenda.id" @click="viewFullRemark(agenda)">
            <div class="remark-content">
              <div class="remark-title">{{ agenda.title }}</div>
              <div class="remark-desc">备注摘要：{{ getRemarkSummary(agenda.remark) }}</div>
            </div>
            <van-icon name="arrow-right" size="16" color="#c8c9cc" class="remark-arrow" />
          </div>
        </div>
      </div>
    </div>

    <!-- 新增：创建议程弹窗（迁移自首页） -->
    <div
      class="dialog-mask"
      v-if="createDialogVisible"
      @click="createDialogVisible = false"
    >
      <div class="dialog-content" @click.stop>
        <h3 class="dialog-title">创建新议程</h3>
        <div class="form-item">
          <label class="form-label">议程标题：</label>
          <input
            class="form-input"
            v-model="newAgenda.title"
            placeholder="请输入议程标题"
          />
        </div>
        <div class="form-item">
          <label class="form-label">议程时间：</label>
          <input
            class="form-input"
            type="datetime-local"
            v-model="newAgenda.time"
          />
        </div>
        <div class="dialog-btn-group">
          <button
            class="dialog-cancel-btn"
            @click="createDialogVisible = false"
          >
            取消
          </button>
          <button class="dialog-confirm-btn" @click="handleCreateAgenda">
            确认创建
          </button>
        </div>
      </div>
    </div>

    <!-- 完整备注弹窗 -->
    <div class="dialog-mask" v-if="remarkDialogVisible" @click="remarkDialogVisible = false">
      <div class="dialog-content dialog-lg" @click.stop>
        <h3 class="dialog-title">{{ currentRemarkAgenda.title }}</h3>
        <div class="full-remark" v-html="currentRemarkAgenda.remark"></div>
        <button class="dialog-confirm-btn" @click="remarkDialogVisible = false">
          关闭
        </button>
      </div>
    </div>

    <!-- 编辑用户信息弹窗 -->
    <van-dialog
      v-model:show="userEditDialogVisible"
      title="编辑个人信息"
      width="90%"
      confirm-button-text="保存"
      cancel-button-text="取消"
      @confirm="saveUserInfo"
      @cancel="resetUploader"
    >
      <div class="user-edit-content">
        <!-- 头像上传 -->
        <div class="edit-item">
          <label class="edit-label">头像：</label>
          <div class="avatar-upload">
            <div class="preview-avatar">
              <van-icon v-if="!tempAvatar && !userAvatar" name="user" size="25" color="#1989fa" />
              <img v-else class="preview-img" :src="tempAvatar || userAvatar" alt="预览头像" />
            </div>
            <van-uploader
              v-model="uploaderFiles"
              accept="image/*"
              max-count="1"
              :preview-size="0"
              :after-read="handleAfterRead"
              :before-delete="handleBeforeDelete"
              class="avatar-uploader"
            >
              <button class="upload-btn van-button van-button--primary van-button--mini">
                选择图片
              </button>
            </van-uploader>
            <div class="upload-tip">支持 JPG、PNG 格式，大小不超过 2MB</div>
          </div>
        </div>
      </div>

      <!-- 用户名修改 -->
      <div class="edit-item">
        <label class="edit-label">姓名：</label>
        <van-field
          v-model="tempUserName"
          placeholder="输入你的姓名"
          required
          class="name-input"
        />
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAgendaStore } from '../../stores/agendaStore'

const router = useRouter()
const agendaStore = useAgendaStore()
const userName = ref('会议参与者')
const userAvatar = ref('')

// 头像上传相关
const userEditDialogVisible = ref(false)
const tempUserName = ref('')
const tempAvatar = ref('')
const uploaderFiles = ref([])

// 备注弹窗相关响应式变量
const remarkDialogVisible = ref(false)
const currentRemarkAgenda = reactive({
  title: '',
  remark: ''
})

// 收藏/备注列表
const collectedAgendas = ref([])
const remarkAgendas = ref([])

// 新增：创建议程相关响应式数据（迁移自首页）
const createDialogVisible = ref(false)
const newAgenda = ref({
  title: "",
  time: ""
})

// 新增：格式化当前时间（用于自动补全议程时间，与首页一致）
const formatCurrentDateTime = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hour}:${minute}`
}

// 刷新收藏/备注列表
const refreshAgendaLists = () => {
  collectedAgendas.value = agendaStore.getCollectedAgendas() || []
  remarkAgendas.value = agendaStore.getRemarkAgendas() || []
}

// 头像上传相关方法
const handleAfterRead = (file) => {
  tempAvatar.value = file.content
  uploaderFiles.value = [file]
}

const handleBeforeDelete = () => {
  tempAvatar.value = ''
  uploaderFiles.value = []
  return true 
}

const resetUploader = () => {
  tempAvatar.value = ''
  uploaderFiles.value = []
}

// 打开个人信息编辑弹窗
const openUserEditDialog = () => {
  tempUserName.value = userName.value
  tempAvatar.value = '' 
  uploaderFiles.value = [] 
  userEditDialogVisible.value = true
}

// 保存个人信息
const saveUserInfo = () => {
  if (!tempUserName.value.trim()) {
    alert('姓名不能为空，请输入！')
    return
  }

  // 更新个人信息响应式变量
  userName.value = tempUserName.value.trim()
  if (tempAvatar.value) {
    userAvatar.value = tempAvatar.value
  }

  // 持久化存储到 localStorage
  localStorage.setItem('userName', userName.value)
  localStorage.setItem('userAvatar', userAvatar.value)

  // 重置上传组件并关闭弹窗
  resetUploader()
  userEditDialogVisible.value = false
}

// 页面跳转
const goToCollection = () => {
  router.push({
    path: '/collection',
    name: 'Collection'
  })
}

const goToRemark = () => {
  router.push({
    path: '/remark',
    name: 'Remark'
  })
}

const goToSetting = () => {
  router.push({
    path: '/setting',
    name: 'Setting'
  })
}

// 取消议程收藏
const handleCancelCollect = (agendaId) => {
  agendaStore.toggleAgendaCollect(agendaId)
  // 刷新列表，确保页面实时更新
  refreshAgendaLists()
  alert('已取消该议程收藏')
}

// 查看议程完整备注
const viewFullRemark = (agenda) => {
  currentRemarkAgenda.title = agenda.title
  currentRemarkAgenda.remark = agenda.remark
  remarkDialogVisible.value = true
}

// 获取备注摘要
const getRemarkSummary = (htmlContent) => {
  if (!htmlContent) return ''
  const plainText = htmlContent.replace(/<[^>]+>/g, '')
  return plainText.length > 20 ? `${plainText.slice(0, 20)}...` : plainText
}

// 新增：打开新建议程弹窗（迁移自首页）
const openCreateDialog = () => {
  newAgenda.value = {
    title: "",
    time: formatCurrentDateTime()
  }
  createDialogVisible.value = true
}

// 新增：保存新建议程（迁移自首页，与首页逻辑一致）
const handleCreateAgenda = () => {
  if (!newAgenda.value.title.trim()) {
    return alert("请输入议程标题")
  }
  agendaStore.addNewAgenda(newAgenda.value)
  createDialogVisible.value = false
  // 刷新收藏/备注列表（可选，确保创建后数据同步）
  refreshAgendaLists()
  alert("议程创建成功")
}

// 初始化所有数据
onMounted(() => {
  agendaStore.loadAgendaFromLocalStorage()
  refreshAgendaLists()
  const savedName = localStorage.getItem('userName')
  const savedAvatar = localStorage.getItem('userAvatar')

  if (savedName) {
    userName.value = savedName
  }
  if (savedAvatar) {
    userAvatar.value = savedAvatar
  }
})
</script>

<style scoped>
.mine-view {
  min-height: 100vh;
  background-color: #f5f5f5;
}

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
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  cursor: pointer;
  transition: box-shadow 0.3s ease;
}

.card-common:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.08);
}

.card-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}

/* 个人信息样式 */
.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #f5fafe;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1989fa;
  font-size: 24px;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.user-id {
  font-size: 12px;
  color: #666;
}

.edit-tip {
  font-size: 10px;
  color: #999;
  margin-top: 2px;
}

/* 功能入口样式 */
.function-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.function-item:last-child {
  border-bottom: none;
}

.function-item:hover {
  background-color: #f5fafe;
}

.function-icon {
  margin-right: 12px;
}

.function-title {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.function-arrow {
  font-size: 12px;
  color: #c8c9cc;
}

/* 空数据提示 */
.empty-tip {
  font-size: 14px;
  color: #999;
  text-align: center;
  padding: 20px 0;
}

/* 收藏列表样式 */
.collection-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.collection-item:last-child {
  border-bottom: none;
}

.collection-content {
  flex: 1;
}

.collection-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.collection-label {
  font-size: 12px;
  color: #666;
}

/* 按钮样式 */
.btn-danger {
  background-color: #ff4d4f;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn-danger:hover {
  background-color: #ff3333;
}

.mini-btn {
  padding: 4px 8px;
  font-size: 12px;
}

/* 备注列表样式 */
.remark-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.remark-item:last-child {
  border-bottom: none;
}

.remark-item:hover {
  background-color: #f5fafe;
}

.remark-content {
  flex: 1;
}

.remark-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.remark-desc {
  font-size: 12px;
  color: #666;
}

.remark-arrow {
  font-size: 12px;
  color: #c8c9cc;
}

/* 弹窗样式 */
.dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
  width: 80%;
  max-width: 400px;
}

.dialog-lg {
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.dialog-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
  text-align: center;
}

.full-remark {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  padding: 8px 0;
  margin-bottom: 20px;
}

.dialog-confirm-btn {
  width: 100%;
  padding: 10px 0;
  background-color: #1989fa;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

/* 编辑用户信息弹窗样式 */
.user-edit-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.edit-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

/* 头像上传样式 */
.avatar-upload {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.preview-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #f5fafe;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-uploader {
  display: flex;
  align-items: center;
}

.upload-btn {
  border: none;
  border-radius: 4px;
  padding: 4px 12px;
  font-size: 12px;
  background-color: #1989fa;
  color: #fff;
  cursor: pointer;
}

.upload-tip {
  width: 100%;
  font-size: 10px;
  color: #999;
  margin-top: 8px;
  margin-left: 62px;
}

/* 姓名输入框样式 */
.name-input {
  flex: 1;
  --van-field-label-width: 0;
  --van-field-font-size: 14px;
}
.name-input:deep(.van-field__control) {
  /* 聚焦时的边框样式 */
  &:focus {
    border: 1px solid #1989fa; 
    outline: none; 
    border-radius: 4px; 
    box-shadow: 0 0 0 2px rgba(25, 137, 250, 0.1); 
  }
}

/* 新增：创建议程按钮样式（与首页保持一致） */
.create-agenda-btn {
  background-color: #1989fa;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  transition: background-color 0.3s ease;
}

.create-agenda-btn:hover {
  background-color: #1677ff;
}

/* 新增：创建议程弹窗样式补充 */
.form-item {
  margin-bottom: 16px;
}

.form-label {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
  display: block;
}

.form-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.dialog-btn-group {
  display: flex;
  gap: 10px;
}

.dialog-cancel-btn {
  flex: 1;
  padding: 10px 0;
  background-color: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}
</style>