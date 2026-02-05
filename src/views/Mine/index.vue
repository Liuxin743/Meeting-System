<template>
  <div class="mine-view">
    <div class="page-content">
      <!-- 个人信息卡片 -->
      <div class="user-card card-common" style="margin-bottom: 10px;" @click="goToProfile">
        <div class="user-info">
          <div class="user-avatar">
            <van-icon v-if="!avatarUrl" name="user" size="30" color="#1989fa" />
            <img v-else class="avatar-img" :src="avatarUrl" alt="用户头像" />
          </div>
          <div class="user-detail">
            <div class="user-name">{{ userStore.userInfo.username || '默认用户' }}</div>
            <div class="user-id">ID：{{ userStore.userInfo.id || '10001' }}</div>
            <div class="edit-tip">点击可编辑头像和名称</div>
          </div>
        </div>
      </div>

      <!-- 功能分组 -->
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
        <div class="function-item" @click="handleLogout" style="color: #ff4d4f;">
          <van-icon name="delete" size="20" color="#ff4d4f" class="function-icon" />
          <span class="function-title">退出登录</span>
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
        <div class="empty-tip" v-if="venues.length === 0 && !loading">
          暂无创建的会场，点击「创建会议」开始
        </div>
        <!-- 加载中提示 -->
        <div class="empty-tip" v-if="loading">
          正在加载会场数据...
        </div>
        <div class="venue-list" v-else>
          <div class="venue-item" v-for="venue in venues" :key="venue.id">
            <div class="venue-content" :style="{ borderLeft: `4px solid ${venue.color}` }">
              <div class="venue-title-wrap">
                <div class="venue-title">{{ venue.name }}</div>
                <span class="venue-type-tag" :style="{ backgroundColor: venue.color }">{{ venue.type }}</span>
              </div>
              <div class="venue-detail-row">
                <div class="venue-detail">
                  <div class="venue-label">会议时间：{{ formatAgendaTime(venue.time) }}</div>
                  <div class="venue-label">会议地址：{{ venue.address }}</div>
                  <div class="venue-label">关联议程：{{ getAgendaCountByVenueId(venue.id) }} 个</div>
                </div>
                <div class="venue-actions-left">
                  <button class="btn-edit mini-btn" @click="openEditVenueDialog(venue)">编辑</button>
                  <button class="btn-edit mini-btn" style="background-color: #ff9500;" @click="openOnlyAgendaDialog(venue.id)">创建议程</button>
                  <button class="btn-danger mini-btn" @click="deleteVenue(venue.id)">删除</button>
                </div>
              </div>
              <div class="share-id-row">
                <span class="share-id-label">分享ID：</span>
                <span 
                  class="share-id" 
                  @click="copyShareId(venue.shareId || venue.meeting_code)"
                  style="cursor: pointer; user-select: all;"
                >
                  {{ venue.shareId || venue.meeting_code }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 我的议程列表 -->
      <div class="agenda-card card-common" style="margin-top: 10px;">
        <h3 class="card-title">我的议程</h3>
        <div class="empty-tip" v-if="agendas.length === 0 && !loading">
          暂无创建的议程，先创建会议再创建议程
        </div>
        <!-- 加载中提示 -->
        <div class="empty-tip" v-if="loading">
          正在加载议程数据...
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
        <div class="empty-tip" v-if="joinedVenueAgendas.length === 0 && !loading">
          暂无加入的会场，点击[创建会场]输入ID加入
        </div>
        <!-- 加载中提示 -->
        <div class="empty-tip" v-if="loading">
          正在加载已加入会场数据...
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

    <!-- 所有弹窗 -->
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
          <button class="dialog-confirm-btn" @click="isEditVenue ? saveEditVenue() : createVenue()" :disabled="apiLoading">
            {{ apiLoading ? '处理中...' : (isEditVenue ? '保存修改' : '确认创建') }}
          </button>
        </div>
      </div>
    </div>

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
            <button class="dialog-confirm-btn" @click="handleCreateMeeting" :disabled="apiLoading">
              {{ apiLoading ? '处理中...' : '确认创建会议' }}
            </button>
          </div>
        </div>
      </div>
    </div>

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
          <button class="dialog-confirm-btn" @click="handleCreateOnlyVenue" :disabled="apiLoading">
            {{ apiLoading ? '处理中...' : '确认创建会场' }}
          </button>
        </div>
      </div>
    </div>

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
          <button class="dialog-confirm-btn" @click="handleCreateOnlyAgenda" :disabled="apiLoading">
            {{ apiLoading ? '处理中...' : '确认创建议程' }}
          </button>
        </div>
      </div>
    </div>

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
          <button class="dialog-confirm-btn" @click="handleSaveEditFlow" :disabled="apiLoading">
            {{ apiLoading ? '处理中...' : '保存流程' }}
          </button>
        </div>
      </div>
    </div>

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
          <button class="dialog-confirm-btn" @click="saveBannerImage" :disabled="apiLoading">
            {{ apiLoading ? '处理中...' : '保存图片' }}
          </button>
        </div>
      </div>
    </div>

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
          <button class="dialog-confirm-btn" @click="handleJoinVenue" :disabled="apiLoading">
            {{ apiLoading ? '处理中...' : '确认加入' }}
          </button>
        </div>
      </div>
    </div>

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
import { useUserStore } from '../../stores/userStore'
import { ElMessage, ElMessageBox } from 'element-plus'
// 1. 导入你提供的后端 API 封装（核心修改）
import { agendaApi, meetingApi, venueApi } from '../../api/index' // 替换为你的 api 实际路径

// 初始化路由和仓库
const router = useRouter()
const agendaStore = useAgendaStore()
const userStore = useUserStore()

// 新增：API 请求加载状态（防止重复提交，优化用户体验）
const loading = ref(false) // 页面初始化加载状态
const apiLoading = ref(false) // 操作类 API 加载状态

// 核心修复：头像地址计算属性（正确读取 Pinia 嵌套数据，放宽校验）
const avatarUrl = computed(() => {
  const userAvatar = userStore.userInfo?.avatar || ''
  if (typeof userAvatar === 'string' && userAvatar.trim().length > 0) {
    return userAvatar
  }
  return ''
})

// 宣传图相关数据（暂时保留本地存储，如需对接后端可新增 bannerApi）
const bannerImageUrl = ref(localStorage.getItem('meetingBannerUrl') || '')
const defaultBannerUrl = ref('https://pic1.zhimg.com/v2-ea1f5938445a9fb94d869d76c1d2c2a4_1440w.jpg')
const bannerEditDialogVisible = ref(false)
const tempBannerUrl = ref('')
const bannerUrlInput = ref('')

// 会场相关数据（从后端拉取，不再从 localStorage 读取）
const venues = ref([]) // 我创建的会场
const joinedVenues = ref([]) // 我加入的会场
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

// 合并会议数据
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

// 仅创建会场表单
const onlyVenueDialogVisible = ref(false)
const onlyVenueForm = reactive({
  id: '',
  name: '',
  type: '主会场',
  time: '',
  address: '',
  color: '#1989fa'
})

// 仅创建议程表单
const onlyAgendaDialogVisible = ref(false)
const onlyAgendaForm = reactive({
  venueId: '',
  title: "",
  time: "",
  flows: []
})

// 议程列表（从后端拉取，同步到 Pinia）
const agendas = computed(() => agendaStore.agendaList || [])

// 加入的会场与议程合并
const joinedVenueAgendas = computed(() => {
  return joinedVenues.value.map(venue => {
    const venueAgendas = agendaStore.agendaList.filter(agenda => agenda.venueId === venue.id)
    return {
      venue: venue,
      agendas: venueAgendas
    }
  })
})

// 编辑流程相关
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

// 工具函数：生成唯一ID（前端临时使用，最终以后端返回ID为准）
const generateUniqueId = () => {
  const timestamp = new Date().getTime().toString(36)
  const randomNum = Math.random().toString(36).substring(2, 8)
  return `${timestamp}-${randomNum}`
}

// 工具函数：格式化当前时间
const formatCurrentDateTime = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hour}:${minute}`
}

// 工具函数：格式化时间显示
const formatAgendaTime = (datetimeStr) => {
  if (!datetimeStr) return '未设置'
  const formatStr = datetimeStr.includes('T') ? datetimeStr.replace('T', ' ') : datetimeStr
  const date = new Date(formatStr)
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 页面跳转函数
const goToCollection = () => router.push({ path: '/collection' })
const goToRemark = () => router.push({ path: '/remark' })
const goToSetting = () => router.push({ path: '/setting' })
const goToProfile = () => router.push({ path: '/profile' })

// 退出登录函数
const handleLogout = () => {
  ElMessageBox.confirm(
    '确定要退出登录吗？',
    '退出提示',
    {
      type: 'warning',
      confirmButtonText: '确认退出',
      cancelButtonText: '取消'
    }
  ).then(() => {
    userStore.logout()
    ElMessage.success('已成功退出登录')
    router.push({ path: '/login', replace: true })
    if (agendaStore.resetStore) agendaStore.resetStore()
  }).catch(() => {
    ElMessage.info('已取消退出')
  })
}

// 宣传图编辑相关函数（暂时保留本地，如需后端对接可扩展）
const openBannerEditDialog = () => {
  tempBannerUrl.value = bannerImageUrl.value
  bannerUrlInput.value = bannerImageUrl.value
  bannerEditDialogVisible.value = true
}

const handleBannerUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    return ElMessage.error('请上传图片格式的文件（JPG/PNG）')
  }
  if (file.size > 2 * 1024 * 1024) {
    return ElMessage.error('图片大小不能超过2MB')
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
      return ElMessage.error('请输入有效的图片URL')
    }
    bannerImageUrl.value = bannerUrlInput.value
  } else {
    bannerImageUrl.value = ''
  }
  localStorage.setItem('meetingBannerUrl', bannerImageUrl.value)
  bannerEditDialogVisible.value = false
  ElMessage.success('宣传图保存成功')
}

// 2. 会场操作相关函数（替换为后端 API 调用，核心修改）
const openEditVenueDialog = (venue) => {
  newVenue.id = venue.id
  newVenue.name = venue.name
  newVenue.type = venue.type
  newVenue.time = venue.time.includes(' ') ? venue.time.replace(' ', 'T') : venue.time
  newVenue.address = venue.address
  newVenue.color = venue.color
  newVenue.shareId = venue.shareId || venue.meeting_code
  isEditVenue.value = true
  createVenueDialogVisible.value = true
}

const createVenue = async () => {
  if (!newVenue.name || !newVenue.time || !newVenue.address) {
    return ElMessage.warning('请填写必填字段')
  }

  // 格式化数据，适配后端接口
  const venueData = {
    name: newVenue.name,
    type: newVenue.type,
    time: newVenue.time,
    address: newVenue.address,
    color: newVenue.color
  }

  try {
    apiLoading.value = true
    // 调用后端创建会场 API
    const res = await venueApi.createVenue(venueData)
    // 刷新会场列表
    await loadMyVenues()
    createVenueDialogVisible.value = false
    ElMessage.success(`会场创建成功，分享ID：${res.data.shareId || res.data.meeting_code}`)
  } catch (error) {
    ElMessage.error('会场创建失败：' + (error.response?.data?.msg || '网络异常'))
    console.error('创建会场失败：', error)
  } finally {
    apiLoading.value = false
  }
}

const saveEditVenue = async () => {
  if (!newVenue.name || !newVenue.time || !newVenue.address) {
    return ElMessage.warning('请填写必填字段')
  }

  // 格式化数据，适配后端接口
  const venueData = {
    name: newVenue.name,
    type: newVenue.type,
    time: newVenue.time,
    address: newVenue.address,
    color: newVenue.color
  }

  try {
    apiLoading.value = true
    // 调用后端编辑会场 API
    await venueApi.updateVenue(newVenue.id, venueData)
    // 刷新会场列表
    await loadMyVenues()
    createVenueDialogVisible.value = false
    ElMessage.success('会场修改成功')
  } catch (error) {
    ElMessage.error('会场修改失败：' + (error.response?.data?.msg || '网络异常'))
    console.error('修改会场失败：', error)
  } finally {
    apiLoading.value = false
  }
}

const deleteVenue = async (venueId) => {
  ElMessageBox.confirm(
    '确定删除该会场？关联的所有议程也会被删除',
    '删除提示',
    { type: 'warning' }
  ).then(async () => {
    try {
      apiLoading.value = true
      // 调用后端删除会场 API
      await venueApi.deleteVenue(venueId)
      // 同时删除关联议程（后端若已级联删除，可省略）
      await agendaStore.agendaList.filter(a => a.venueId !== venueId)
      // 刷新会场和议程列表
      await loadMyVenues()
      await loadMyAgendas()
      ElMessage.success('会场及关联议程已删除')
    } catch (error) {
      ElMessage.error('会场删除失败：' + (error.response?.data?.msg || '网络异常'))
      console.error('删除会场失败：', error)
    } finally {
      apiLoading.value = false
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 3. 仅创建会场相关函数（替换为后端 API 调用）
const openOnlyVenueDialog = () => {
  onlyVenueForm.id = generateUniqueId()
  onlyVenueForm.name = ''
  onlyVenueForm.type = '主会场'
  onlyVenueForm.time = formatCurrentDateTime()
  onlyVenueForm.address = ''
  onlyVenueForm.color = '#1989fa'
  onlyVenueDialogVisible.value = true
}

const handleCreateOnlyVenue = async () => {
  if (!onlyVenueForm.name || !onlyVenueForm.time || !onlyVenueForm.address) {
    return ElMessage.warning("请填写完整的会场信息")
  }

  const venueData = {
    name: onlyVenueForm.name,
    type: onlyVenueForm.type,
    time: onlyVenueForm.time,
    address: onlyVenueForm.address,
    color: onlyVenueForm.color
  }

  try {
    apiLoading.value = true
    await venueApi.createVenue(venueData)
    await loadMyVenues()
    onlyVenueDialogVisible.value = false
    ElMessage.success("会场创建成功")
  } catch (error) {
    ElMessage.error('会场创建失败：' + (error.response?.data?.msg || '网络异常'))
    console.error('创建会场失败：', error)
  } finally {
    apiLoading.value = false
  }
}

// 4. 仅创建议程相关函数（替换为后端 API 调用）
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
  ElMessageBox.confirm(
    '确定要删除该流程步骤吗？删除后不可恢复',
    '删除提示',
    { type: 'warning' }
  ).then(() => {
    onlyAgendaForm.flows.splice(index, 1)
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const handleCreateOnlyAgenda = async () => {
  if (!onlyAgendaForm.venueId) return ElMessage.warning("请选择所属会场")
  if (!onlyAgendaForm.title.trim()) return ElMessage.warning("请输入议程标题")

  // 格式化数据，适配后端接口
  const agendaData = {
    title: onlyAgendaForm.title.trim(),
    time: onlyAgendaForm.time,
    venueId: onlyAgendaForm.venueId,
    flows: onlyAgendaForm.flows.map(step => ({
      ...step,
      time: step.time ? step.time.replace('T', ' ') : ''
    }))
  }

  try {
    apiLoading.value = true
    // 调用后端创建议程 API
    await agendaApi.createAgenda(agendaData)
    // 刷新议程列表
    await loadMyAgendas()
    onlyAgendaDialogVisible.value = false
    ElMessage.success("议程创建成功")
  } catch (error) {
    ElMessage.error('议程创建失败：' + (error.response?.data?.msg || '网络异常'))
    console.error('创建议程失败：', error)
  } finally {
    apiLoading.value = false
  }
}

// 议程相关辅助函数
const getVenueNameById = (venueId) => {
  const venue = venues.value.find(v => v.id === venueId)
  if (venue) return venue.name
  const joinedVenue = joinedVenues.value.find(v => v.id === venueId)
  return joinedVenue ? joinedVenue.name : '未知会场'
}

const getAgendaCountByVenueId = (venueId) => {
  return agendaStore.agendaList.filter(a => a.venueId === venueId).length
}

// 5. 合并创建会议相关函数（替换为后端 API 调用）
const openCreateDialog = () => {
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

const addNewFlowStep = () => {
  const newFlowStep = { title: "", time: formatCurrentDateTime(), desc: "" }
  newMeeting.agenda.flows.push(newFlowStep)
}

const deleteFlowStep = (index) => {
  ElMessageBox.confirm(
    '确定要删除该流程步骤吗？删除后不可恢复',
    '删除提示',
    { type: 'warning' }
  ).then(() => {
    newMeeting.agenda.flows.splice(index, 1)
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const handleCreateMeeting = async () => {
  if (!newMeeting.venue.name || !newMeeting.venue.time || !newMeeting.venue.address) {
    return ElMessage.warning("请填写完整的会场信息")
  }
  if (!newMeeting.agenda.title.trim()) return ElMessage.warning("请输入议程标题")

  // 格式化会议数据，适配后端接口
  const meetingData = {
    venue: {
      name: newMeeting.venue.name,
      type: newMeeting.venue.type,
      time: newMeeting.venue.time,
      address: newMeeting.venue.address,
      color: newMeeting.venue.color
    },
    agenda: {
      title: newMeeting.agenda.title.trim(),
      time: newMeeting.agenda.time,
      flows: newMeeting.agenda.flows.map(step => ({
        ...step,
        time: step.time ? step.time.replace('T', ' ') : ''
      }))
    }
  }

  try {
    apiLoading.value = true
    // 调用后端创建会议 API
    const res = await meetingApi.createMeeting(meetingData)
    // 刷新会场和议程列表
    await loadMyVenues()
    await loadMyAgendas()
    createDialogVisible.value = false
    ElMessage.success(`会议创建成功，分享ID：${res.data.meeting_code}`)
  } catch (error) {
    ElMessage.error('会议创建失败：' + (error.response?.data?.msg || '网络异常'))
    console.error('创建会议失败：', error)
  } finally {
    apiLoading.value = false
  }
}

// 6. 议程编辑与删除相关函数（替换为后端 API 调用）
const deleteAgenda = async (agendaId) => {
  ElMessageBox.confirm(
    '确定删除该议程？关联的所有流程步骤也会被删除',
    '删除提示',
    { type: 'warning' }
  ).then(async () => {
    try {
      apiLoading.value = true
      // 调用后端删除议程 API
      await agendaApi.deleteAgenda(agendaId)
      // 刷新议程列表
      await loadMyAgendas()
      ElMessage.success('议程已删除')
    } catch (error) {
      ElMessage.error('议程删除失败：' + (error.response?.data?.msg || '网络异常'))
      console.error('删除议程失败：', error)
    } finally {
      apiLoading.value = false
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

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
  ElMessageBox.confirm(
    '确定要删除该流程步骤吗？删除后不可恢复',
    '删除提示',
    { type: 'warning' }
  ).then(() => {
    currentEditAgenda.flows.splice(index, 1)
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const handleSaveEditFlow = async () => {
  if (!currentEditAgenda.id) return ElMessage.error('议程ID异常，无法保存流程')

  // 格式化流程数据，适配后端接口
  const flows = currentEditAgenda.flows.map(step => ({
    ...step,
    time: step.time ? step.time.replace('T', ' ') : ''
  }))

  try {
    apiLoading.value = true
    // 调用后端更新议程流程 API
    await agendaApi.updateAgenda(currentEditAgenda.id, { flows })
    // 刷新议程列表
    await loadMyAgendas()
    editFlowDialogVisible.value = false
    ElMessage.success('议程流程保存成功')
  } catch (error) {
    ElMessage.error('议程流程保存失败：' + (error.response?.data?.msg || '网络异常'))
    console.error('保存议程流程失败：', error)
  } finally {
    apiLoading.value = false
  }
}

// 7. 加入/退出会场相关函数（替换为后端 API 调用）
const openJoinVenueDialog = () => {
  joinVenueForm.shareId = ''
  joinVenueDialogVisible.value = true
}

const handleJoinVenue = async () => {
  const shareId = joinVenueForm.shareId.trim()
  if (!shareId || shareId.length !== 6) return ElMessage.warning('请输入有效的6位分享ID')

  try {
    apiLoading.value = true
    // 调用后端加入会场 API
    await meetingApi.joinMeeting(shareId)
    // 刷新已加入会场列表
    await loadJoinedVenues()
    joinVenueDialogVisible.value = false
    ElMessage.success('成功加入会场')
  } catch (error) {
    ElMessage.error('加入会场失败：' + (error.response?.data?.msg || '未找到该会场'))
    console.error('加入会场失败：', error)
  } finally {
    apiLoading.value = false
  }
}

const quitVenue = async (venueId) => {
  ElMessageBox.confirm(
    '确定退出该会场？退出后将无法查看其关联议程',
    '退出提示',
    { type: 'warning' }
  ).then(async () => {
    try {
      apiLoading.value = true
      // 调用后端退出会场 API（如需扩展，可在 meetingApi 中新增 quitMeeting 接口）
      // await meetingApi.quitMeeting(venueId)
      joinedVenues.value = joinedVenues.value.filter(v => v.id !== venueId)
      ElMessage.success('已成功退出该会场')
    } catch (error) {
      ElMessage.error('退出会场失败：' + (error.response?.data?.msg || '网络异常'))
      console.error('退出会场失败：', error)
    } finally {
      apiLoading.value = false
    }
  }).catch(() => {
    ElMessage.info('已取消退出')
  })
}

// 复制分享ID函数
const copyShareId = (shareId) => {
  navigator.clipboard.writeText(shareId).then(() => {
    copyToastVisible.value = true
    setTimeout(() => copyToastVisible.value = false, 1500)
  }).catch(() => {
    ElMessage.error('复制失败，请手动复制')
  })
}

// 8. 新增：加载后端数据的核心函数（页面初始化及数据刷新）
/**
 * 加载我创建的会场列表
 */
const loadMyVenues = async () => {
  try {
    loading.value = true
    // 调用后端获取「我的会议」（包含会场）API
    const res = await meetingApi.getMyMeetings()
    venues.value = res.data || []
  } catch (error) {
    ElMessage.error('加载会场数据失败：' + (error.response?.data?.msg || '网络异常'))
    console.error('加载会场失败：', error)
  } finally {
    loading.value = false
  }
}

/**
 * 加载我加入的会场列表
 */
const loadJoinedVenues = async () => {
  try {
    loading.value = true
    // 如需对接后端，可在 meetingApi 中新增 getJoinedMeetings 接口
    joinedVenues.value = [] // 暂时占位，后续替换为真实接口返回数据
  } catch (error) {
    ElMessage.error('加载已加入会场数据失败：' + (error.response?.data?.msg || '网络异常'))
    console.error('加载已加入会场失败：', error)
  } finally {
    loading.value = false
  }
}

/**
 * 加载我的议程列表
 */
const loadMyAgendas = async () => {
  try {
    loading.value = true
    // 调用后端获取「我的议程」API
    const res = await agendaApi.getMyAgendas()
    agendaStore.agendaList = res.data || []
  } catch (error) {
    ElMessage.error('加载议程数据失败：' + (error.response?.data?.msg || '网络异常'))
    console.error('加载议程失败：', error)
  } finally {
    loading.value = false
  }
}

// 页面初始化（替换本地存储加载，改为后端数据加载）
onMounted(async () => {
  // 初始化用户信息
  userStore.initUserInfo()

  // 加载后端核心数据
  await Promise.all([
    loadMyVenues(),
    loadMyAgendas(),
    loadJoinedVenues()
  ])

  // 监听议程列表变化，同步到本地存储（可选，用于前端缓存）
  watch(() => agendaStore.agendaList, () => {
    localStorage.setItem('agendaList', JSON.stringify(agendaStore.agendaList))
  }, { deep: true })
})
</script>

<style scoped>
/* 样式部分保持不变，无需修改 */
.mine-view {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.page-content {
  padding: 10px;
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
}

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
  overflow: hidden;
  cursor: pointer;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
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

.function-item[style*="color: #ff4d4f;"]:hover {
  background-color: #fff2f2;
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

.empty-tip {
  font-size: 14px;
  color: #999;
  text-align: center;
  padding: 20px 0;
  background-color: #fafafa;
  border-radius: 6px;
  margin: 10px 0;
}

.btn-group {
  display: flex;
  gap: 10px;
  width: 100%;
  margin: 12px 0;
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

.venue-actions-left {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}

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
  transition: opacity 0.2s ease;
}

.dialog-cancel-btn:hover {
  opacity: 0.9;
}

.form-item {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  color: #333;
  margin-bottom: 6px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 13px;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #1989fa;
}

.color-input {
  height: 40px;
  padding: 0;
}

.flow-form-item {
  margin-bottom: 16px;
}

.flow-add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #1989fa;
  font-size: 13px;
  cursor: pointer;
  padding: 8px 0;
}

.flow-step-list {
  margin-top: 12px;
}

.flow-step-item {
  background-color: #fafafa;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.step-num {
  font-size: 12px;
  color: #1989fa;
  font-weight: 500;
}

.step-del-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px;
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
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.step-input {
  font-size: 12px;
  padding: 6px 8px;
}

.step-textarea {
  font-size: 12px;
  padding: 6px 8px;
  resize: vertical;
  min-height: 60px;
}

.banner-preview {
  margin-bottom: 16px;
  text-align: center;
}

.banner-preview .preview-img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}

.file-input {
  width: 100%;
  padding: 8px;
  font-size: 12px;
  color: #666;
}

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
  background-color: rgba(0, 0, 0, 0.7);
  color: #ffffff;
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 14px;
  animation: fadeInOut 1.5s ease;
}

@keyframes fadeInOut {
  0% { opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; }
}

.joined-content {
  margin-top: 10px;
}
</style>