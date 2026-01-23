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

      <!-- 一键创建会议 按钮 -->
      <div class="btn-group" style="margin: 10px 0; display: flex; gap: 10px;">
        <button class="create-btn main-create-btn" @click="openCreateDialog" style="flex: 1;">
          + 一键创建会议
        </button>
      </div>

      <!-- 我创建的会场列表 -->
      <div class="venue-card card-common" style="margin-top: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 class="card-title">我创建的会场</h3>
          <button class="create-btn" style="background-color: #4cd964; padding: 4px 12px; font-size: 12px;" @click="openOnlyVenueDialog">
            + 创建会场
          </button>
        </div>
        <div class="empty-tip" v-if="venues.length === 0">
          暂无创建的会场，点击「创建会议」开始
        </div>
        <div class="venue-list" v-else>
          <div class="venue-item" v-for="venue in venues" :key="venue.id">
            <div class="venue-content" :style="{ borderLeft: `4px solid ${venue.color}` }">
              <!-- 标题+类型标签 -->
              <div class="venue-title-wrap">
                <div class="venue-title">{{ venue.name }}</div>
                <span class="venue-type-tag" :style="{ backgroundColor: venue.color }">{{ venue.type }}</span>
              </div>
              
              <!-- 会议详情 + 操作按钮 -->
              <div class="venue-detail-row">
                <div class="venue-detail">
                  <div class="venue-label">会议时间：{{ formatAgendaTime(venue.time) }}</div>
                  <div class="venue-label">会议地址：{{ venue.address }}</div>
                  <div class="venue-label">关联议程：{{ getAgendaCountByVenueId(venue.id) }} 个</div>
                </div>
                <!-- 操作按钮 -->
                <div class="venue-actions-left">
                  <button class="btn-edit mini-btn" @click="openEditVenueDialog(venue)">编辑</button>
                  <button class="btn-edit mini-btn" style="background-color: #ff9500;" @click="openOnlyAgendaDialog(venue.id)">创建议程</button>
                  <button class="btn-danger mini-btn" @click="deleteVenue(venue.id)">删除</button>
                </div>
              </div>
              
              <!--点击分享ID自动复制 -->
              <div class="share-id-row">
                <span class="share-id-label">分享ID：</span>
                <span 
                  class="share-id" 
                  @click="copyShareId(venue.shareId)"
                  style="cursor: pointer; user-select: all;"
                >
                  {{ venue.shareId }}
                </span>
              </div>
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

      <!-- 我加入的会场&议程 -->
      <div class="venue-card card-common" style="margin-top: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 class="card-title">加入的会场及议程</h3>
          <button class="create-btn join-btn" @click="openJoinVenueDialog" style="background-color: #4cd964; padding: 4px 12px; font-size: 12px;">
            + 加入会场
          </button>
        </div>
        <div class="empty-tip" v-if="joinedVenueAgendas.length === 0">
          暂无加入的会场，点击[创建会场]输入ID加入
        </div>
        <div class="joined-content" v-else>
          <div v-for="item in joinedVenueAgendas" :key="item.venue.id">
            <div class="venue-item">
              <div class="venue-content" :style="{ borderLeft: `4px solid ${item.venue.color}` }">
                <div class="venue-title-wrap">
                  <div class="venue-title">{{ item.venue.name }}</div>
                  <span class="venue-type-tag" :style="{ backgroundColor: item.venue.color }">{{ item.venue.type }}</span>
                  <span class="creator-tag">创建者：{{ item.venue.creatorName || '未知' }}</span>
                </div>
                <div class="venue-detail">
                  <div class="venue-label">会议时间：{{ formatAgendaTime(item.venue.time) }}</div>
                  <div class="venue-label">会议地址：{{ item.venue.address }}</div>
                  <div class="venue-label">关联议程：{{ item.agendas.length }} 个</div>
                </div>
                <div class="venue-actions-right">
                  <button class="btn-danger mini-btn" @click="quitVenue(item.venue.id)">退出</button>
                </div>
              </div>
            </div>
            <div class="agenda-list" style="margin-left: 12px; margin-top: 8px; border-left: 1px dashed #f0f0f0; padding-left: 12px;">
              <div v-if="item.agendas.length === 0" class="empty-tip" style="padding: 10px 0; margin: 0;">
                该会场暂无关联议程
              </div>
              <div class="agenda-item" v-for="agenda in item.agendas" :key="agenda.id">
                <div class="agenda-content">
                  <div class="agenda-title">{{ agenda.title }}</div>
                  <div class="agenda-label">议程时间：{{ formatAgendaTime(agenda.time) }}</div>
                  <div class="agenda-label" v-if="agenda.flows && agenda.flows.length > 0">
                    流程数量：{{ agenda.flows.length }} 步
                  </div>
                  <div class="agenda-label" v-else>
                    流程数量：0 步（暂无流程）
                  </div>
                </div>
              </div>
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

    <!-- 创建会议弹窗-->
    <div
      class="dialog-mask"
      v-if="createDialogVisible"
      @click="createDialogVisible = false"
    >
      <div class="dialog-content dialog-lg" @click.stop>
        <h3 class="dialog-title">创建新会议</h3>
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
        <div class="create-step" style="margin-top: 20px;">
          <h4 class="step-title">2. 议程及流程信息</h4>
          <div class="form-item">
            <label class="form-label">议程标题：</label>
            <input
              class="form-input"
              v-model="newMeeting.agenda.title"
              placeholder="请输入议程标题（如：项目讨论会议）"
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
          <div class="form-item flow-form-item">
            <label class="form-label">会议流程：</label>
            <div class="flow-add-btn" @click="addNewFlowStep">
              <van-icon name="plus" size="16" color="#1989fa" />
              <span>添加流程步骤</span>
            </div>
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
    </div>

    <!-- 仅创建会场弹窗 -->
    <div
      class="dialog-mask"
      v-if="onlyVenueDialogVisible"
      @click="onlyVenueDialogVisible = false"
    >
      <div class="dialog-content dialog-lg" @click.stop>
        <h3 class="dialog-title">创建新会场</h3>
        <div class="form-item">
          <label class="form-label">会场名称：</label>
          <input
            class="form-input"
            v-model="onlyVenueForm.name"
            placeholder="如：技术主会场、运营分会场"
          />
        </div>
        <div class="form-item">
          <label class="form-label">会场类型：</label>
          <select class="form-input" v-model="onlyVenueForm.type">
            <option value="主会场">主会场</option>
            <option value="分会场">分会场</option>
          </select>
        </div>
        <div class="form-item">
          <label class="form-label">会议时间：</label>
          <input
            class="form-input"
            type="datetime-local"
            v-model="onlyVenueForm.time"
          />
        </div>
        <div class="form-item">
          <label class="form-label">会议地址：</label>
          <input
            class="form-input"
            v-model="onlyVenueForm.address"
            placeholder="如：国际会议中心 一号宴会厅"
          />
        </div>
        <div class="form-item">
          <label class="form-label">主题色：</label>
          <input
            class="form-input color-input"
            type="color"
            v-model="onlyVenueForm.color"
          />
        </div>
        <div class="dialog-btn-group">
          <button
            class="dialog-cancel-btn"
            @click="onlyVenueDialogVisible = false"
          >取消</button>
          <button class="dialog-confirm-btn" @click="handleCreateOnlyVenue">
            确认创建会场
          </button>
        </div>
      </div>
    </div>

    <!-- 仅创建议程弹窗 -->
    <div
      class="dialog-mask"
      v-if="onlyAgendaDialogVisible"
      @click="onlyAgendaDialogVisible = false"
    >
      <div class="dialog-content dialog-lg" @click.stop>
        <h3 class="dialog-title">为会场新增议程</h3>
        <div class="form-item">
          <label class="form-label">所属会场：</label>
          <select class="form-input" v-model="onlyAgendaForm.venueId">
            <option value="">请选择会场</option>
            <option v-for="venue in venues" :key="venue.id" :value="venue.id">
              {{ venue.name }} ({{ venue.type }})
            </option>
          </select>
        </div>
        <div class="form-item">
          <label class="form-label">议程标题：</label>
          <input
            class="form-input"
            v-model="onlyAgendaForm.title"
            placeholder="请输入议程标题（如：项目讨论会）"
          />
        </div>
        <div class="form-item">
          <label class="form-label">议程时间：</label>
          <input
            class="form-input"
            type="datetime-local"
            v-model="onlyAgendaForm.time"
          />
        </div>
        <div class="form-item flow-form-item">
          <label class="form-label">会议流程：</label>
          <div class="flow-add-btn" @click="addNewOnlyAgendaFlowStep">
            <van-icon name="plus" size="16" color="#1989fa" />
            <span>添加流程步骤</span>
          </div>
          <div class="flow-step-list" v-if="onlyAgendaForm.flows.length > 0">
            <div class="flow-step-item" v-for="(step, index) in onlyAgendaForm.flows" :key="index">
              <div class="step-header">
                <span class="step-num">步骤 {{ index + 1 }}</span>
                <button class="step-del-btn" @click="deleteOnlyAgendaFlowStep(index)">
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
            @click="onlyAgendaDialogVisible = false"
          >取消</button>
          <button class="dialog-confirm-btn" @click="handleCreateOnlyAgenda">
            确认创建议程
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
        <div class="form-item flow-form-item">
          <label class="form-label">会议流程：</label>
          <div class="flow-add-btn" @click="addNewEditFlowStep">
            <van-icon name="plus" size="16" color="#1989fa" />
            <span>添加流程步骤</span>
          </div>
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

    <!-- 加入会场弹窗 -->
    <div
      class="dialog-mask"
      v-if="joinVenueDialogVisible"
      @click="joinVenueDialogVisible = false"
    >
      <div class="dialog-content dialog-lg" @click.stop>
        <h3 class="dialog-title">加入会场</h3>
        <div class="form-item">
          <label class="form-label">输入会场分享ID：</label>
          <input
            class="form-input"
            v-model="joinVenueForm.shareId"
            placeholder="请输入6位会场分享ID"
            maxlength="6"
          />
        </div>
        <div class="form-tip">
          分享ID可从会场创建者处获取，仅支持6位字符
        </div>
        <div class="dialog-btn-group">
          <button
            class="dialog-cancel-btn"
            @click="joinVenueDialogVisible = false"
          >取消</button>
          <button class="dialog-confirm-btn" @click="handleJoinVenue">
            确认加入
          </button>
        </div>
      </div>
    </div>

    <!-- 复制成功提示 -->
    <div class="toast-mask" v-if="copyToastVisible">
      <div class="toast-content">
        ✅ 分享ID已复制！
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
const joinedVenues = ref(JSON.parse(localStorage.getItem('joinedVenues')) || [])
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

// 合并后的会议数据
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

// 创建会场相关
const onlyVenueDialogVisible = ref(false)
const onlyVenueForm = reactive({
  id: '',
  name: '',
  type: '主会场',
  time: '',
  address: '',
  color: '#1989fa'
})

// 创建议程相关
const onlyAgendaDialogVisible = ref(false)
const onlyAgendaForm = reactive({
  venueId: '',
  title: "",
  time: "",
  flows: []
})

// 议程相关
const agendas = computed(() => agendaStore.agendaList)

// 合并加入的会场与议程
const joinedVenueAgendas = computed(() => {
  return joinedVenues.value.map(venue => {
    const venueAgendas = agendaStore.agendaList.filter(agenda => agenda.venueId === venue.id)
    return {
      venue: venue,
      agendas: venueAgendas
    }
  })
})

// 编辑流程弹窗相关
const editFlowDialogVisible = ref(false)
const currentEditAgenda = reactive({
  id: '',
  title: '',
  flows: []
})

// 加入会场相关
const joinVenueDialogVisible = ref(false)
const joinVenueForm = reactive({
  shareId: ''
})
const copyToastVisible = ref(false)

// 生成唯一ID
const generateUniqueId = () => {
  const timestamp = new Date().getTime().toString(36)
  const randomNum = Math.random().toString(36).substring(2, 8)
  return `${timestamp}-${randomNum}`
}

// 生成6位分享ID
const generateShareId = () => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let shareId = ''
  for (let i = 0; i < 6; i++) {
    shareId += chars[Math.floor(Math.random() * chars.length)]
  }
  return shareId
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
  localStorage.setItem('joinedVenues', JSON.stringify(joinedVenues.value))
  localStorage.setItem('meetingBannerUrl', bannerImageUrl.value)
  localStorage.setItem('userName', userName.value)
  localStorage.setItem('userAvatar', userAvatar.value)
}

// 宣传图编辑
const openBannerEditDialog = () => {
  tempBannerUrl.value = bannerImageUrl.value
  bannerUrlInput.value = bannerImageUrl.value
  bannerEditDialogVisible.value = true
}

const handleBannerUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    alert('请上传图片格式的文件（JPG/PNG）')
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    alert('图片大小不能超过2MB')
    return
  }
  const reader = new FileReader()
  reader.onload = (event) => {
    tempBannerUrl.value = event.target.result
  }
  reader.readAsDataURL(file)
}

const saveBannerImage = () => {
  if (tempBannerUrl.value) {
    bannerImageUrl.value = tempBannerUrl.value
  } else if (bannerUrlInput.value) {
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w.-]*)*\/?$/
    if (!urlPattern.test(bannerUrlInput.value)) {
      alert('请输入有效的图片URL')
      return
    }
    bannerImageUrl.value = bannerUrlInput.value
  } else {
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
  router.push({ path: '/collection' })
}
const goToRemark = () => {
  router.push({ path: '/remark' })
}
const goToSetting = () => {
  router.push({ path: '/setting' })
}

// 会场操作方法
const openEditVenueDialog = (venue) => {
  newVenue.id = venue.id
  newVenue.name = venue.name
  newVenue.type = venue.type
  newVenue.time = venue.time.includes(' ') ? venue.time.replace(' ', 'T') : venue.time
  newVenue.address = venue.address
  newVenue.color = venue.color
  newVenue.shareId = venue.shareId
  isEditVenue.value = true
  createVenueDialogVisible.value = true
}

const createVenue = () => {
  if (!newVenue.name || !newVenue.time || !newVenue.address) {
    alert('请填写必填字段')
    return
  }
  newVenue.id = generateUniqueId()
  newVenue.shareId = generateShareId()
  newVenue.creatorName = userName.value
  venues.value.push({ ...newVenue })
  saveToLocalStorage()
  createVenueDialogVisible.value = false
  alert('会场创建成功，分享ID：' + newVenue.shareId)
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
  venues.value = venues.value.filter(v => v.id !== venueId)
  agendaStore.agendaList = agendaStore.agendaList.filter(a => a.venueId !== venueId)
  joinedVenues.value = joinedVenues.value.filter(v => v.id !== venueId)
  localStorage.setItem('agendaList', JSON.stringify(agendaStore.agendaList))
  saveToLocalStorage()
  alert('会场及关联议程已删除')
}

// 仅创建会场弹窗
const openOnlyVenueDialog = () => {
  onlyVenueForm.id = generateUniqueId()
  onlyVenueForm.name = ''
  onlyVenueForm.type = '主会场'
  onlyVenueForm.time = formatCurrentDateTime()
  onlyVenueForm.address = ''
  onlyVenueForm.color = '#1989fa'
  onlyVenueForm.creatorName = userName.value
  onlyVenueForm.shareId = generateShareId()
  onlyVenueDialogVisible.value = true
}

const handleCreateOnlyVenue = () => {
  if (!onlyVenueForm.name || !onlyVenueForm.time || !onlyVenueForm.address) {
    return alert("请填写完整的会场信息")
  }
  venues.value.push({ ...onlyVenueForm })
  saveToLocalStorage()
  onlyVenueDialogVisible.value = false
  alert("会场创建成功，分享ID：" + onlyVenueForm.shareId)
}

// 仅创建议程弹窗
const openOnlyAgendaDialog = (preSelectedVenueId = '') => {
  onlyAgendaForm.venueId = preSelectedVenueId || ''
  onlyAgendaForm.title = ""
  onlyAgendaForm.time = formatCurrentDateTime()
  onlyAgendaForm.flows = []
  onlyAgendaDialogVisible.value = true
}

const addNewOnlyAgendaFlowStep = () => {
  const newFlowStep = { title: "", time: formatCurrentDateTime(), desc: "" }
  onlyAgendaForm.flows.push(newFlowStep)
}

const deleteOnlyAgendaFlowStep = (index) => {
  if (confirm('确定要删除该流程步骤吗？删除后不可恢复')) {
    onlyAgendaForm.flows.splice(index, 1)
  }
}

const handleCreateOnlyAgenda = () => {
  if (!onlyAgendaForm.venueId) {
    return alert("请选择所属会场")
  }
  if (!onlyAgendaForm.title.trim()) {
    return alert("请输入议程标题")
  }
  const formattedFlows = onlyAgendaForm.flows.map(step => ({
    ...step,
    time: step.time ? step.time.replace('T', ' ') : ''
  }))
  agendaStore.addNewAgenda({
    id: generateUniqueId(),
    title: onlyAgendaForm.title.trim(),
    time: onlyAgendaForm.time,
    venueId: onlyAgendaForm.venueId,
    flows: formattedFlows
  })
  onlyAgendaDialogVisible.value = false
  alert("议程创建成功")
}

// 会场ID获取会场名称
const getVenueNameById = (venueId) => {
  const venue = venues.value.find(v => v.id === venueId)
  if (venue) return venue.name
  const joinedVenue = joinedVenues.value.find(v => v.id === venueId)
  return joinedVenue ? joinedVenue.name : '未知会场'
}

// 会场ID获取关联议程数量
const getAgendaCountByVenueId = (venueId) => {
  return agendaStore.agendaList.filter(a => a.venueId === venueId).length
}

// 打开合并后的创建弹窗
const openCreateDialog = () => {
  newMeeting.venue.id = generateUniqueId()
  newMeeting.venue.name = ''
  newMeeting.venue.type = '主会场'
  newMeeting.venue.time = formatCurrentDateTime()
  newMeeting.venue.address = ''
  newMeeting.venue.color = '#1989fa'
  newMeeting.venue.creatorName = userName.value
  newMeeting.venue.shareId = generateShareId()
  newMeeting.agenda.title = ""
  newMeeting.agenda.time = formatCurrentDateTime()
  newMeeting.agenda.flows = []
  createDialogVisible.value = true
}

const addNewFlowStep = () => {
  const newFlowStep = { title: "", time: formatCurrentDateTime(), desc: "" }
  newMeeting.agenda.flows.push(newFlowStep)
}

const deleteFlowStep = (index) => {
  if (confirm('确定要删除该流程步骤吗？删除后不可恢复')) {
    newMeeting.agenda.flows.splice(index, 1)
  }
}

const handleCreateMeeting = () => {
  if (!newMeeting.venue.name || !newMeeting.venue.time || !newMeeting.venue.address) {
    return alert("请填写完整的会场信息")
  }
  if (!newMeeting.agenda.title.trim()) {
    return alert("请输入议程标题")
  }
  venues.value.push({ ...newMeeting.venue })
  saveToLocalStorage()
  const formattedFlows = newMeeting.agenda.flows.map(step => ({
    ...step,
    time: step.time ? step.time.replace('T', ' ') : ''
  }))
  agendaStore.addNewAgenda({
    id: generateUniqueId(),
    title: newMeeting.agenda.title.trim(),
    time: newMeeting.agenda.time,
    venueId: newMeeting.venue.id,
    flows: formattedFlows
  })
  createDialogVisible.value = false
  alert("会议流程创建成功，分享ID：" + newMeeting.venue.shareId)
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
  currentEditAgenda.flows = JSON.parse(JSON.stringify(agenda.flows || []))
  currentEditAgenda.flows.forEach(step => {
    if (step.time && step.time.includes(' ')) {
      step.time = step.time.replace(' ', 'T')
    }
  })
  editFlowDialogVisible.value = true
}

const addNewEditFlowStep = () => {
  const newFlowStep = { title: "", time: formatCurrentDateTime(), desc: "" }
  currentEditAgenda.flows.push(newFlowStep)
}

const deleteEditFlowStep = (index) => {
  if (confirm('确定要删除该流程步骤吗？删除后不可恢复')) {
    currentEditAgenda.flows.splice(index, 1)
  }
}

const handleSaveEditFlow = () => {
  if (!currentEditAgenda.id) {
    alert('议程ID异常，无法保存流程')
    return
  }
  const formattedFlows = currentEditAgenda.flows.map(step => ({
    ...step,
    time: step.time ? step.time.replace('T', ' ') : ''
  }))
  const agenda = agendaStore.agendaList.find(a => a.id === currentEditAgenda.id)
  if (agenda) {
    agenda.flows.splice(0, agenda.flows.length)
    agenda.flows.push(...formattedFlows)
    localStorage.setItem('agendaList', JSON.stringify(agendaStore.agendaList))
  }
  editFlowDialogVisible.value = false
  alert('议程流程保存成功')
}

// 加入会场
const openJoinVenueDialog = () => {
  joinVenueForm.shareId = ''
  joinVenueDialogVisible.value = true
}

const handleJoinVenue = () => {
  const shareId = joinVenueForm.shareId.trim()
  if (!shareId || shareId.length !== 6) {
    alert('请输入有效的6位分享ID')
    return
  }
  const targetVenue = venues.value.find(v => v.shareId === shareId)
  if (!targetVenue) {
    alert('未找到该会场，请检查分享ID是否正确')
    return
  }
  const isAlreadyJoined = joinedVenues.value.some(v => v.id === targetVenue.id)
  if (isAlreadyJoined) {
    alert('你已加入该会场，无需重复加入')
    joinVenueDialogVisible.value = false
    return
  }
  joinedVenues.value.push(JSON.parse(JSON.stringify(targetVenue)))
  saveToLocalStorage()
  joinVenueDialogVisible.value = false
  alert(`成功加入会场：${targetVenue.name}（已自动同步该会场的议程）`)
}

// 退出会场
const quitVenue = (venueId) => {
  if (!confirm('确定退出该会场？退出后将无法查看其关联议程')) return
  joinedVenues.value = joinedVenues.value.filter(v => v.id !== venueId)
  saveToLocalStorage()
  alert('已成功退出该会场')
}

// 点击分享ID自动复制
const copyShareId = (shareId) => {
  navigator.clipboard.writeText(shareId).then(() => {
    copyToastVisible.value = true
    setTimeout(() => {
      copyToastVisible.value = false
    }, 1500)
  }).catch(() => {
    alert('复制失败，请手动复制')
  })
}

// 初始化数据
onMounted(() => {
  const savedName = localStorage.getItem('userName')
  const savedAvatar = localStorage.getItem('userAvatar')
  const savedBanner = localStorage.getItem('meetingBannerUrl')
  const savedJoinedVenues = localStorage.getItem('joinedVenues')
  if (savedName) userName.value = savedName
  if (savedAvatar) userAvatar.value = savedAvatar
  if (savedBanner) bannerImageUrl.value = savedBanner
  if (savedJoinedVenues) joinedVenues.value = JSON.parse(savedJoinedVenues)
  agendaStore.loadAgendaFromLocalStorage()
  watch([venues, joinedVenues, bannerImageUrl], () => {
    saveToLocalStorage()
  }, { deep: true })
  watch(() => agendaStore.agendaList, () => {
    localStorage.setItem('agendaList', JSON.stringify(agendaStore.agendaList))
  }, { deep: true })
})
</script>

<style scoped>
/* 页面基础 */
.mine-view {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.page-content {
  padding: 10px;
  width: 100%;
  box-sizing: border-box;
  max-width: 750px;
  margin: 0 auto;
}

/* 通用卡片 */
.card-common {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  transition: box-shadow 0.3s ease;
  cursor: default;
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

/* 个人信息卡片 */
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
  cursor: pointer;
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

/* 功能入口 */
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
  background-color: #fafafa;
  border-radius: 6px;
  margin: 10px 0;
}

/* 按钮组样式 */
.btn-group {
  display: flex;
  gap: 10px;
  width: 100%;
  margin: 12px 0;
}

/* 创建按钮通用样式 */
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

.join-btn {
  background-color: #4cd964 !important;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.create-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.create-btn:hover {
  opacity: 0.9;
}

/* 会场列表样式 */
.venue-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.venue-item:last-child {
  border-bottom: none;
}

.venue-content {
  padding-left: 8px;
}

.venue-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.venue-title {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.venue-type-tag {
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  color: #fff;
  font-weight: 500;
  opacity: 0.9;
}

.creator-tag {
  font-size: 11px;
  color: #999;
  margin-left: 8px;
  background-color: #f5f5f5;
  padding: 1px 4px;
  border-radius: 2px;
  vertical-align: middle;
}

/* 会议详情 + 操作按钮 */
.venue-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 10px;
  margin-bottom: 8px;
}

.venue-detail {
  flex: 1;
}

.venue-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 3px;
}

.venue-label:last-child {
  margin-bottom: 0;
}

/* 操作按钮 */
.venue-actions-left {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}

/* 分享ID样式（点击复制） */
.share-id-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-top: 8px;
}

.share-id-label {
  font-size: 10px;
  color: #666;
}

.share-id {
  display: inline-block;
  background-color: #f0f8ff;
  color: #1989fa;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.share-id:hover {
  background-color: #e6f7ff;
  text-decoration: underline;
}

.venue-actions-right {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-end;
  margin-top: 4px;
}

/* 议程列表样式 */
.agenda-list {
  margin-top: 10px;
}

.agenda-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  gap: 10px;
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
  white-space: normal;
  word-wrap: break-word;
  line-height: 1.5;
}

.agenda-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.agenda-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}

/* 操作按钮通用样式 */
.btn-danger {
  background-color: #ff4d4f;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  padding: 4px 8px;
}

.btn-danger:hover {
  background-color: #ff3333;
}

.btn-danger.mini-btn {
  background-color: #ff6b6b;
}

.btn-danger.mini-btn:hover {
  background-color: #ff5252;
}

.btn-edit {
  background-color: #1989fa;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  padding: 4px 8px;
}

.btn-edit:hover {
  background-color: #1677ff;
}

.mini-btn {
  font-size: 12px;
  flex-shrink: 0;
}

/* 弹窗基础样式 */
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

.form-tip {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
  margin-bottom: 16px;
  padding-left: 2px;
}

.step-title {
  font-size: 14px;
  font-weight: bold;
  color: #1989fa;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.dialog-btn-group {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.dialog-confirm-btn {
  flex: 1;
  padding: 10px 0;
  background-color: #1989fa;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.dialog-confirm-btn:hover {
  opacity: 0.9;
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
  transition: background-color 0.2s ease;
}

.dialog-cancel-btn:hover {
  background-color: #e8e8e8;
}

/* 表单通用样式 */
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
  transition: border-color 0.2s ease;
}

.form-input:focus {
  border-color: #1989fa;
  outline: none;
}

.color-input {
  height: 40px;
  padding: 2px;
  cursor: pointer;
}

.file-input {
  width: 100%;
  padding: 8px;
  font-size: 13px;
  color: #666;
}

/* 流程编辑区域样式 */
.flow-form-item {
  margin-bottom: 20px;
  margin-top: 15px;
}

.flow-add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background-color: #f5f5fafe;
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
  font-weight: bold;
  color: #1989fa;
}

.step-del-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px;
  border-radius: 2px;
  transition: background-color 0.2s ease;
}

.step-del-btn:hover {
  background-color: #ffebeb;
}

.step-form-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.step-form-item {
  margin-bottom: 0;
}

.step-form-label {
  font-size: 13px;
  color: #333;
  margin-bottom: 3px;
}

.step-input {
  font-size: 13px;
  padding: 6px 8px;
}

.step-textarea {
  font-size: 13px;
  padding: 6px 8px;
  resize: vertical;
  min-height: 60px;
}

/* 头像编辑样式 */
.user-edit-content {
  padding: 10px 0;
}

.edit-item {
  margin-bottom: 16px;
}

.edit-label {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  display: block;
}

.avatar-upload {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #f5fafe;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 8px;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-uploader {
  display: inline-block;
}

.upload-btn {
  font-size: 12px;
  padding: 4px 12px;
}

.upload-tip {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

.name-input {
  margin-top: 4px;
}

/* 宣传图预览样式 */
.banner-preview {
  width: 100%;
  margin-bottom: 16px;
  border-radius: 6px;
  overflow: hidden;
  background-color: #f5f5f5;
}

.banner-preview .preview-img {
  width: 100%;
  height: auto;
  max-height: 200px;
  object-fit: cover;
}

/* 加入的会场及议程容器 */
.joined-content {
  margin-top: 10px;
}

/* 复制成功提示 */
.toast-mask {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-content {
  background-color: rgba(0, 0, 0, 0.8);
  color: #ffffff;
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 14px;
  animation: fadeInOut 1.5s ease;
}

@keyframes fadeInOut {
  0% { opacity: 0; transform: translateY(-20px); }
  20% { opacity: 1; transform: translateY(0); }
  80% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-20px); }
}
</style>