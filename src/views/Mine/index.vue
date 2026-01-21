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
        <div class="function-item" @click="openBannerEditDialog">
          <van-icon name="photo-o" size="20" color="#1989fa" class="function-icon" />
          <span class="function-title">编辑会议图</span>
          <van-icon name="arrow-right" size="16" color="#c8c9cc" class="function-arrow" />
        </div>
        <div class="function-item" @click="goToSetting">
          <van-icon name="setting" size="20" color="#1989fa" class="function-icon" />
          <span class="function-title">系统设置</span>
          <van-icon name="arrow-right" size="16" color="#c8c9cc" class="function-arrow" />
        </div>
      </div>

      <!-- 创建按钮 -->
      <div class="create-actions" style="margin: 10px 0; display: flex; gap: 10px;">
        <button class="create-btn main-create-btn" @click="openCreateDialog" style="flex: 1;">
          + 创建会议流程
        </button>
      </div>

      <!-- 我的会场列表 -->
      <div class="venue-card card-common" style="margin-top: 10px;">
        <h3 class="card-title">我的会场</h3>
        <div class="empty-tip" v-if="venues.length === 0">
          暂无创建的会场，点击「创建会议」开始
        </div>
        <div class="venue-list" v-else>
          <div class="venue-item" v-for="venue in venues" :key="venue.id">
            <div class="venue-content" :style="{ borderLeft: `4px solid ${venue.color}` }">
              <div class="venue-title">{{ venue.name }} 
                <span class="venue-type-tag" :style="{ backgroundColor: venue.color }">{{ venue.type }}</span>
              </div>
              <div class="venue-label">会议时间：{{ formatAgendaTime(venue.time) }}</div>
              <div class="venue-label">会议地址：{{ venue.address }}</div>
              <div class="venue-label">关联议程：{{ getAgendaCountByVenueId(venue.id) }} 个</div>
            </div>
            <div class="venue-actions">
              <button class="btn-edit mini-btn" @click="openEditVenueDialog(venue)">
                编辑
              </button>
              <button class="btn-danger mini-btn" @click="deleteVenue(venue.id)">
                删除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 我的议程列表 -->
      <div class="agenda-card card-common" style="margin-top: 10px;">
        <h3 class="card-title">我的议程</h3>
        <div class="empty-tip" v-if="agendas.length === 0">
          暂无创建的议程，先创建会议再创建议程
        </div>
        <div class="agenda-list" v-else>
          <div class="agenda-item" v-for="agenda in agendas" :key="agenda.id">
            <div class="agenda-content">
              <div class="agenda-title">{{ agenda.title }}</div>
              <div class="agenda-label">所属会场：{{ getVenueNameById(agenda.venueId) }}</div>
              <div class="agenda-label">议程时间：{{ formatAgendaTime(agenda.time) }}</div>
              <div class="agenda-label" v-if="agenda.flows && agenda.flows.length > 0">
                流程数量：{{ agenda.flows.length }} 步
              </div>
              <div class="agenda-label" v-else>
                流程数量：0 步（暂无流程）
              </div>
            </div>
            <div class="agenda-actions">
              <button class="btn-edit mini-btn" @click="openEditFlowDialog(agenda)">
                编辑流程
              </button>
              <button class="btn-danger mini-btn" @click="deleteAgenda(agenda.id)">
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑会场弹窗 -->
    <div
      class="dialog-mask"
      v-if="createVenueDialogVisible"
      @click="createVenueDialogVisible = false"
    >
      <div class="dialog-content dialog-lg" @click.stop>
        <h3 class="dialog-title">{{ isEditVenue ? '编辑会场' : '创建新会场' }}</h3>
        <div class="form-item">
          <label class="form-label">会场名称：</label>
          <input
            class="form-input"
            v-model="newVenue.name"
            placeholder="如：技术主会场、运营分会场"
          />
        </div>
        <div class="form-item">
          <label class="form-label">会场类型：</label>
          <select class="form-input" v-model="newVenue.type">
            <option value="主会场">主会场</option>
            <option value="分会场">分会场</option>
          </select>
        </div>
        <div class="form-item">
          <label class="form-label">会议时间：</label>
          <input
            class="form-input"
            type="datetime-local"
            v-model="newVenue.time"
          />
        </div>
        <div class="form-item">
          <label class="form-label">会议地址：</label>
          <input
            class="form-input"
            v-model="newVenue.address"
            placeholder="如：国际会议中心 一号宴会厅"
          />
        </div>
        <div class="form-item">
          <label class="form-label">主题色：</label>
          <input
            class="form-input color-input"
            type="color"
            v-model="newVenue.color"
          />
        </div>
        <div class="dialog-btn-group">
          <button
            class="dialog-cancel-btn"
            @click="createVenueDialogVisible = false"
          >取消</button>
          <button class="dialog-confirm-btn" @click="isEditVenue ? saveEditVenue() : createVenue()">
            {{ isEditVenue ? '保存修改' : '确认创建' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 会场+流程 -->
    <div
      class="dialog-mask"
      v-if="createDialogVisible"
      @click="createDialogVisible = false"
    >
      <div class="dialog-content dialog-lg" @click.stop>
        <h3 class="dialog-title">创建新会议</h3>
        
        <!-- 创建会场信息 -->
        <div class="create-step">
          <h4 class="step-title">1. 会场基本信息</h4>
          <div class="form-item">
            <label class="form-label">会场名称：</label>
            <input
              class="form-input"
              v-model="newMeeting.venue.name"
              placeholder="如：技术主会场、运营分会场"
            />
          </div>
          <div class="form-item">
            <label class="form-label">会场类型：</label>
            <select class="form-input" v-model="newMeeting.venue.type">
              <option value="主会场">主会场</option>
              <option value="分会场">分会场</option>
            </select>
          </div>
          <div class="form-item">
            <label class="form-label">会议时间：</label>
            <input
              class="form-input"
              type="datetime-local"
              v-model="newMeeting.venue.time"
            />
          </div>
          <div class="form-item">
            <label class="form-label">会议地址：</label>
            <input
              class="form-input"
              v-model="newMeeting.venue.address"
              placeholder="如：国际会议中心 一号宴会厅"
            />
          </div>
          <div class="form-item">
            <label class="form-label">主题色：</label>
            <input
              class="form-input color-input"
              type="color"
              v-model="newMeeting.venue.color"
            />
          </div>
        </div>

        <!-- 创建议程及流程 -->
        <div class="create-step" style="margin-top: 20px;">
          <h4 class="step-title">2. 议程及流程信息</h4>
          <div class="form-item">
            <label class="form-label">议程标题：</label>
            <input
              class="form-input"
              v-model="newMeeting.agenda.title"
              placeholder="请输入议程标题（如：2026年度技术研讨会）"
            />
          </div>
          <div class="form-item">
            <label class="form-label">议程时间：</label>
            <input
              class="form-input"
              type="datetime-local"
              v-model="newMeeting.agenda.time"
            />
          </div>

          <!-- 会议流程编辑区域 -->
          <div class="form-item flow-form-item">
            <label class="form-label">会议流程：</label>
            <div class="flow-add-btn" @click="addNewFlowStep">
              <van-icon name="plus" size="16" color="#1989fa" />
              <span>添加流程步骤</span>
            </div>
            
            <!-- 流程步骤列表 -->
            <div class="flow-step-list" v-if="newMeeting.agenda.flows.length > 0">
              <div class="flow-step-item" v-for="(step, index) in newMeeting.agenda.flows" :key="index">
                <div class="step-header">
                  <span class="step-num">步骤 {{ index + 1 }}</span>
                  <button class="step-del-btn" @click="deleteFlowStep(index)">
                    <van-icon name="cross" size="14" color="#ff4d4f" />
                  </button>
                </div>
                <div class="step-form-content">
                  <div class="step-form-item">
                    <label class="step-form-label">流程标题：</label>
                    <input
                      class="form-input step-input"
                      v-model="step.title"
                      placeholder="请输入流程标题（如：开场致辞）"
                    />
                  </div>
                  <div class="step-form-item">
                    <label class="step-form-label">流程时间：</label>
                    <input
                      class="form-input step-input"
                      type="datetime-local"
                      v-model="step.time"
                    />
                  </div>
                  <div class="step-form-item">
                    <label class="step-form-label">流程描述：</label>
                    <textarea
                      class="form-input step-textarea"
                      v-model="step.desc"
                      placeholder="请输入流程详细描述..."
                      rows="3"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="dialog-btn-group">
          <button
            class="dialog-cancel-btn"
            @click="createDialogVisible = false"
          >取消</button>
          <button class="dialog-confirm-btn" @click="handleCreateMeeting">
            确认创建会议
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑流程弹窗 -->
    <div
      class="dialog-mask"
      v-if="editFlowDialogVisible"
      @click="editFlowDialogVisible = false"
    >
      <div class="dialog-content dialog-lg" @click.stop>
        <h3 class="dialog-title">编辑 {{ currentEditAgenda.title }} 流程</h3>

        <!-- 会议流程编辑区域 -->
        <div class="form-item flow-form-item">
          <label class="form-label">会议流程：</label>
          <div class="flow-add-btn" @click="addNewEditFlowStep">
            <van-icon name="plus" size="16" color="#1989fa" />
            <span>添加流程步骤</span>
          </div>
          
          <!-- 流程步骤列表 -->
          <div class="flow-step-list" v-if="currentEditAgenda.flows.length > 0">
            <div class="flow-step-item" v-for="(step, index) in currentEditAgenda.flows" :key="index">
              <div class="step-header">
                <span class="step-num">步骤 {{ index + 1 }}</span>
                <button class="step-del-btn" @click="deleteEditFlowStep(index)">
                  <van-icon name="cross" size="14" color="#ff4d4f" />
                </button>
              </div>
              <div class="step-form-content">
                <div class="step-form-item">
                  <label class="step-form-label">流程标题：</label>
                  <input
                    class="form-input step-input"
                    v-model="step.title"
                    placeholder="请输入流程标题（如：开场致辞）"
                  />
                </div>
                <div class="step-form-item">
                  <label class="step-form-label">流程时间：</label>
                  <input
                    class="form-input step-input"
                    type="datetime-local"
                    v-model="step.time"
                  />
                </div>
                <div class="step-form-item">
                  <label class="step-form-label">流程描述：</label>
                  <textarea
                    class="form-input step-textarea"
                    v-model="step.desc"
                    placeholder="请输入流程详细描述..."
                    rows="3"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="dialog-btn-group">
          <button
            class="dialog-cancel-btn"
            @click="editFlowDialogVisible = false"
          >取消</button>
          <button class="dialog-confirm-btn" @click="handleSaveEditFlow">
            保存流程
          </button>
        </div>
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

        <!-- 用户名修改 -->
        <div class="edit-item">
          <label class="edit-label">用户名：</label>
          <van-field
            v-model="tempUserName"
            placeholder="输入你的用户名"
            required
            class="name-input"
          />
        </div>
      </div>
    </van-dialog>

    <!-- 编辑会议宣传图弹窗 -->
    <div
      class="dialog-mask"
      v-if="bannerEditDialogVisible"
      @click="bannerEditDialogVisible = false"
    >
      <div class="dialog-content dialog-lg" @click.stop>
        <h3 class="dialog-title">编辑会议宣传图</h3>
        <div class="banner-preview">
          <img 
            :src="tempBannerUrl || bannerImageUrl || defaultBannerUrl" 
            alt="宣传图预览" 
            class="preview-img"
          />
        </div>
        <div class="form-item">
          <label class="form-label">上传本地图片：</label>
          <input
            type="file"
            accept="image/*"
            @change="handleBannerUpload"
            class="file-input"
          />
        </div>
        <div class="form-item">
          <label class="form-label">或输入图片URL：</label>
          <input
            class="form-input"
            v-model="bannerUrlInput"
            placeholder="https://example.com/banner.jpg"
          />
        </div>
        <div class="dialog-btn-group">
          <button
            class="dialog-cancel-btn"
            @click="bannerEditDialogVisible = false"
          >取消</button>
          <button class="dialog-confirm-btn" @click="saveBannerImage">
            保存图片
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAgendaStore } from '../../stores/agendaStore'

const router = useRouter()
const userName = ref('会议参与者')
const userAvatar = ref('')

const agendaStore = useAgendaStore()

// 宣传图相关
const bannerImageUrl = ref(localStorage.getItem('meetingBannerUrl') || '')
const defaultBannerUrl = ref('https://pic1.zhimg.com/v2-ea1f5938445a9fb94d869d76c1d2c2a4_1440w.jpg')
const bannerEditDialogVisible = ref(false)
const tempBannerUrl = ref('')
const bannerUrlInput = ref('')

// 头像上传相关
const userEditDialogVisible = ref(false)
const tempUserName = ref('')
const tempAvatar = ref('')
const uploaderFiles = ref([])

// 会场相关数据
const venues = ref(JSON.parse(localStorage.getItem('customVenues')) || [])
const createVenueDialogVisible = ref(false)
const isEditVenue = ref(false)
const newVenue = reactive({
  id: '',
  name: '',
  type: '主会场',
  time: '',
  address: '',
  color: '#1989fa'
})

// 合并后的会议数据（会场+议程）
const createDialogVisible = ref(false)
const newMeeting = reactive({
  venue: {
    id: '',
    name: '',
    type: '主会场',
    time: '',
    address: '',
    color: '#1989fa'
  },
  agenda: {
    title: "",
    time: "",
    flows: []
  }
})

// 议程相关
const agendas = computed(() => agendaStore.agendaList)

// 编辑流程弹窗相关
const editFlowDialogVisible = ref(false)
const currentEditAgenda = reactive({
  id: '',
  title: '',
  flows: []
})

// 生成唯一ID
const generateUniqueId = () => {
  const timestamp = new Date().getTime().toString(36)
  const randomNum = Math.random().toString(36).substring(2, 8)
  return `${timestamp}-${randomNum}`
}

// 格式化当前时间
const formatCurrentDateTime = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hour}:${minute}`
}

// 格式化时间显示
const formatAgendaTime = (datetimeStr) => {
  if (!datetimeStr) return '未设置'
  const formatStr = datetimeStr.includes('T') ? datetimeStr.replace('T', ' ') : datetimeStr
  const date = new Date(formatStr)
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 保存非议程数据
const saveToLocalStorage = () => {
  localStorage.setItem('customVenues', JSON.stringify(venues.value))
  localStorage.setItem('meetingBannerUrl', bannerImageUrl.value)
  localStorage.setItem('userName', userName.value)
  localStorage.setItem('userAvatar', userAvatar.value)
}

//宣传图编辑
const openBannerEditDialog = () => {
  tempBannerUrl.value = bannerImageUrl.value
  bannerUrlInput.value = bannerImageUrl.value
  bannerEditDialogVisible.value = true
}

const handleBannerUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return
  
  // 校验文件类型
  if (!file.type.startsWith('image/')) {
    alert('请上传图片格式的文件（JPG/PNG）')
    return
  }
  
  // 校验文件大小（2MB限制）
  if (file.size > 2 * 1024 * 1024) {
    alert('图片大小不能超过2MB')
    return
  }
  
  // 转为base64存储
  const reader = new FileReader()
  reader.onload = (event) => {
    tempBannerUrl.value = event.target.result
  }
  reader.readAsDataURL(file)
}

const saveBannerImage = () => {
  // 优先使用上传的图片，其次使用URL
  if (tempBannerUrl.value) {
    bannerImageUrl.value = tempBannerUrl.value
  } else if (bannerUrlInput.value) {
    // 简单URL校验
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w.-]*)*\/?$/
    if (!urlPattern.test(bannerUrlInput.value)) {
      alert('请输入有效的图片URL')
      return
    }
    bannerImageUrl.value = bannerUrlInput.value
  } else {
    // 清空使用默认图
    bannerImageUrl.value = ''
  }
  
  saveToLocalStorage()
  bannerEditDialogVisible.value = false
  alert('宣传图保存成功')
}

// 个人信息
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

const openUserEditDialog = () => {
  tempUserName.value = userName.value
  tempAvatar.value = '' 
  uploaderFiles.value = [] 
  userEditDialogVisible.value = true
}

const saveUserInfo = () => {
  if (!tempUserName.value.trim()) {
    alert('姓名不能为空，请输入！')
    return
  }

  userName.value = tempUserName.value.trim()
  if (tempAvatar.value) {
    userAvatar.value = tempAvatar.value
  }

  saveToLocalStorage()
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

//  会场操作方法（保留原有编辑/删除功能）
const openEditVenueDialog = (venue) => {
  newVenue.id = venue.id
  newVenue.name = venue.name
  newVenue.type = venue.type
  newVenue.time = venue.time.includes(' ') ? venue.time.replace(' ', 'T') : venue.time
  newVenue.address = venue.address
  newVenue.color = venue.color
  isEditVenue.value = true
  createVenueDialogVisible.value = true
}

const createVenue = () => {
  if (!newVenue.name || !newVenue.time || !newVenue.address) {
    alert('请填写必填字段')
    return
  }
  venues.value.push({ ...newVenue })
  saveToLocalStorage()
  createVenueDialogVisible.value = false
  alert('会场创建成功')
}

const saveEditVenue = () => {
  if (!newVenue.name || !newVenue.time || !newVenue.address) {
    alert('请填写必填字段')
    return
  }
  const index = venues.value.findIndex(v => v.id === newVenue.id)
  if (index > -1) {
    venues.value[index] = { ...newVenue }
    saveToLocalStorage()
    createVenueDialogVisible.value = false
    alert('会场修改成功')
  }
}

const deleteVenue = (venueId) => {
  if (!confirm('确定删除该会场？关联的所有议程也会被删除')) return
  // 删除会场
  venues.value = venues.value.filter(v => v.id !== venueId)
  // 删除关联议程
  agendaStore.agendaList = agendaStore.agendaList.filter(a => a.venueId !== venueId)
  localStorage.setItem('agendaList', JSON.stringify(agendaStore.agendaList))
  saveToLocalStorage()
  alert('会场及关联议程已删除')
}

// 会场ID获取会场名称
const getVenueNameById = (venueId) => {
  const venue = venues.value.find(v => v.id === venueId)
  return venue ? venue.name : '未知会场'
}

// 会场ID获取关联议程数量
const getAgendaCountByVenueId = (venueId) => {
  return agendaStore.agendaList.filter(a => a.venueId === venueId).length
}

// 打开合并后的创建弹窗
const openCreateDialog = () => {
  // 重置表单数据
  newMeeting.venue.id = generateUniqueId()
  newMeeting.venue.name = ''
  newMeeting.venue.type = '主会场'
  newMeeting.venue.time = formatCurrentDateTime()
  newMeeting.venue.address = ''
  newMeeting.venue.color = '#1989fa'
  
  newMeeting.agenda.title = ""
  newMeeting.agenda.time = formatCurrentDateTime()
  newMeeting.agenda.flows = []
  
  createDialogVisible.value = true
}

// 添加流程步骤
const addNewFlowStep = () => {
  const newFlowStep = {
    title: "",
    time: formatCurrentDateTime(),
    desc: ""
  }
  newMeeting.agenda.flows.push(newFlowStep)
}

//  删除流程步骤
const deleteFlowStep = (index) => {
  if (confirm('确定要删除该流程步骤吗？删除后不可恢复')) {
    newMeeting.agenda.flows.splice(index, 1)
  }
}

// 保存创建的会议（先创建会场，再创建议程）
const handleCreateMeeting = () => {
  // 校验会场信息
  if (!newMeeting.venue.name || !newMeeting.venue.time || !newMeeting.venue.address) {
    return alert("请填写完整的会场信息")
  }
  
  // 校验议程信息
  if (!newMeeting.agenda.title.trim()) {
    return alert("请输入议程标题")
  }

  // 1. 创建会场
  venues.value.push({ ...newMeeting.venue })
  saveToLocalStorage()

  // 2. 格式化流程时间
  const formattedFlows = newMeeting.agenda.flows.map(step => ({
    ...step,
    time: step.time ? step.time.replace('T', ' ') : ''
  }))

  // 3. 创建议程（关联刚创建的会场）
  agendaStore.addNewAgenda({
    id: generateUniqueId(),
    title: newMeeting.agenda.title.trim(),
    time: newMeeting.agenda.time,
    venueId: newMeeting.venue.id,
    flows: formattedFlows
  })

  // 重置表单并关闭弹窗
  createDialogVisible.value = false
  alert("会议（会场+议程）创建成功")
}

// 删除议程
const deleteAgenda = (agendaId) => {
  if (!confirm('确定删除该议程？关联的所有流程步骤也会被删除')) return
  agendaStore.agendaList = agendaStore.agendaList.filter(a => a.id === agendaId)
  localStorage.setItem('agendaList', JSON.stringify(agendaStore.agendaList))
  alert('议程已删除')
}

// 编辑流程方法
const openEditFlowDialog = (agenda) => {
  currentEditAgenda.id = agenda.id
  currentEditAgenda.title = agenda.title
  // 深拷贝流程数据并格式化时间
  currentEditAgenda.flows = JSON.parse(JSON.stringify(agenda.flows || []))
  currentEditAgenda.flows.forEach(step => {
    if (step.time && step.time.includes(' ')) {
      step.time = step.time.replace(' ', 'T')
    }
  })
  editFlowDialogVisible.value = true
}

const addNewEditFlowStep = () => {
  const newFlowStep = {
    title: "",
    time: formatCurrentDateTime(),
    desc: ""
  }
  currentEditAgenda.flows.push(newFlowStep)
}

const deleteEditFlowStep = (index) => {
  if (confirm('确定要删除该流程步骤吗？删除后不可恢复')) {
    currentEditAgenda.flows.splice(index, 1)
  }
}

// 保存编辑后的流程
const handleSaveEditFlow = () => {
  if (!currentEditAgenda.id) {
    alert('议程ID异常，无法保存流程')
    return
  }

  // 格式化流程时间
  const formattedFlows = currentEditAgenda.flows.map(step => ({
    ...step,
    time: step.time ? step.time.replace('T', ' ') : ''
  }))

  // 找到对应的议程，触发响应式更新
  const agenda = agendaStore.agendaList.find(a => a.id === currentEditAgenda.id)
  if (agenda) {
    // 清空原数组后push新数据（确保Pinia响应式）
    agenda.flows.splice(0, agenda.flows.length)
    agenda.flows.push(...formattedFlows)
    // 同步到本地存储
    localStorage.setItem('agendaList', JSON.stringify(agendaStore.agendaList))
  }
  
  editFlowDialogVisible.value = false
  alert('议程流程保存成功')
}

// 初始化数据
onMounted(() => {
  const savedName = localStorage.getItem('userName')
  const savedAvatar = localStorage.getItem('userAvatar')
  const savedBanner = localStorage.getItem('meetingBannerUrl')

  if (savedName) userName.value = savedName
  if (savedAvatar) userAvatar.value = savedAvatar
  if (savedBanner) bannerImageUrl.value = savedBanner

  // 加载议程数据
  agendaStore.loadAgendaFromLocalStorage()

  // 监听会场/宣传图变化，保存到本地
  watch([venues, bannerImageUrl], () => {
    saveToLocalStorage()
  }, { deep: true })
  
  // 监听议程变化
  watch(() => agendaStore.agendaList, () => {
    localStorage.setItem('agendaList', JSON.stringify(agendaStore.agendaList))
  }, { deep: true })
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

/* 创建操作区样式 */
.create-actions {
  width: 100%;
}

.create-btn {
  background-color: #1989fa;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background-color 0.3s ease;
}

.main-create-btn {
  background-color: #1989fa;
}

.create-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 会场列表样式 */
.venue-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.venue-item:last-child {
  border-bottom: none;
}

.venue-content {
  flex: 1;
  padding-left: 8px;
}

.venue-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
  font-weight: 500;
}

.venue-type-tag {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  color: #fff;
  margin-left: 8px;
}

.venue-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

/* 议程列表样式 */
.agenda-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.agenda-item:last-child {
  border-bottom: none;
}

.agenda-content {
  flex: 1;
}

.agenda-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
  font-weight: 500;
}

.agenda-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

/* 操作按钮样式 */
.venue-actions, .agenda-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

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

.btn-edit {
  background-color: #1989fa;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn-edit:hover {
  background-color: #1677ff;
}

.mini-btn {
  padding: 4px 8px;
  font-size: 12px;
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

/* 步骤标题样式 */
.step-title {
  font-size: 14px;
  font-weight: bold;
  color: #1989fa;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.dialog-confirm-btn {
  width: 50%;
  padding: 10px 0;
  background-color: #1989fa;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

/* 表单样式 */
.form-item {
  margin-bottom: 16px;
}

.form-label {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
  display: block;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.color-input {
  height: 40px;
  padding: 2px;
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

/* 流程样式 */
.flow-form-item {
  margin-bottom: 20px;
}

.flow-add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background-color: #f5fafe;
  border: 1px dashed #1989fa;
  border-radius: 4px;
  color: #1989fa;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 12px;
}

.flow-add-btn:hover {
  background-color: #e6f7ff;
}

.flow-step-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.flow-step-item {
  padding: 12px;
  background-color: #fafafa;
  border-radius: 6px;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.step-num {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.step-del-btn {
  background-color: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.step-del-btn:hover {
  background-color: #fff0f0;
}

.step-form-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.step-form-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.step-form-label {
  font-size: 12px;
  color: #666;
}

.step-input {
  font-size: 13px;
  padding: 6px 8px;
}

.step-textarea {
  font-size: 13px;
  padding: 6px 8px;
  resize: none;
  line-height: 1.5;
}

/* 编辑用户信息弹窗 */
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

/* 头像上传 */
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
  &:focus {
    border: 1px solid #1989fa; 
    outline: none; 
    border-radius: 4px; 
    box-shadow: 0 0 0 2px rgba(25, 137, 250, 0.1); 
  }
}

/* 宣传图编辑 */
.banner-preview {
  margin-bottom: 16px;
  text-align: center;
}

.preview-img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 4px;
  border: 1px solid #eee;
}

.file-input {
  width: 100%;
  padding: 8px;
  font-size: 14px;
}
</style>