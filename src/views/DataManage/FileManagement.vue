<template>
  <div class="file-management-container">
    <!-- 顶部搜索栏 -->
    <el-card class="search-card" shadow="hover">
      <el-form :model="queryParams" :inline="true" label-width="80px">
        <el-form-item label="灾害类型">
          <el-select
            v-model="queryParams.disasterType"
            placeholder="请选择灾害类型"
            clearable
            style="width: 200px"
          >
            <el-option label="暴雨" value="rain" />
<!--            <el-option label="地震" value="earthquake" />-->
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 灾害列表 -->
    <el-card class="table-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="header-title">灾害列表</span>
          <el-tag v-if="currentDisaster" type="success" effect="dark">
            当前查看：{{ currentDisaster.disasterName }}
          </el-tag>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="disasterList"
        style="width: 100%"
        :row-style="{ cursor: 'pointer' }"
        @row-click="handleRowClick"
        highlight-current-row
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="disasterId" label="灾害 ID" min-width="180" show-overflow-tooltip />
        <el-table-column prop="disasterName" label="灾害名称" min-width="250" show-overflow-tooltip />
        <el-table-column prop="disasterType" label="灾害类型" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.disasterType === 'rain' ? 'success' : 'warning'" effect="dark">
              {{ scope.row.disasterType === 'rain' ? '暴雨' : '地震' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="occurrenceTime" label="发生时间" width="170" align="center" />
        <el-table-column prop="position" label="位置" min-width="200" show-overflow-tooltip />
        <el-table-column prop="extraInfo" label="附加信息" width="120" align="center">
          <template #default="scope">
            <el-tag size="small" :type="scope.row.disasterType === 'rain' ? 'blue' : 'danger'">
              {{ scope.row.disasterType === 'rain' ? `降雨量：${scope.row.extraInfo}` : `震级：${scope.row.extraInfo}` }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right" align="center">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              icon="View"
              @click.stop="handleViewFiles(scope.row)"
            >
              查看文件
            </el-button>
            <el-button
              type="danger"
              size="small"
              icon="Delete"
              @click.stop="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <pagination
        v-show="total > 0"
        :total="total"
        v-model:page="queryParams.pageNum"
        v-model:limit="queryParams.pageSize"
        @pagination="handleQuery"
      />
    </el-card>

    <!-- 文件列表对话框 -->
    <el-dialog
      v-model="fileDialogVisible"
      title="灾害文件详情"
      width="1200px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <template #header>
        <div class="dialog-header">
          <span class="dialog-title">{{ currentDisaster?.disasterName }} - 文件列表</span>

        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="图片文件" name="image">
          <div v-if="imageFiles.length === 0" class="empty-data">
            <el-empty description="暂无图片文件" />
          </div>
          <div v-else class="image-grid">
            <el-card
              v-for="(file, index) in imageFiles"
              :key="index"
              class="image-card"
              shadow="hover"
            >
              <div class="image-wrapper">
                <el-image
                  :src="getImageUrl(file)"
                  :preview-src-list="[getPreviewUrl(file)]"
                  fit="cover"
                  class="preview-image"
                  :preview-teleported="true"
                >
                  <template #error>
                    <div class="image-error">
                      <el-icon><Picture /></el-icon>
                      <span>加载失败</span>
                    </div>
                  </template>
                </el-image>
              </div>
              <div class="image-info">
                <div class="file-name" :title="file.fileName">{{ file.fileName }}</div>
                <div class="file-meta">
                  <el-tag size="small" type="info">{{ file.fileExtension }}</el-tag>
                  <span class="file-size">{{ formatFileSize(file.fileSize) }}</span>
                </div>
                <div class="file-actions">
                  <el-button
                    type="primary"
                    size="small"
                    icon="Download"
                    @click="handleDownloadSingle(file)"
                  >
                    下载
                  </el-button>
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <el-tab-pane label="文档文件" name="document">
          <el-table :data="documentFiles" style="width: 100%">
            <el-table-column prop="fileName" label="文件名" min-width="250" show-overflow-tooltip />
            <el-table-column prop="fileType" label="文件类型" width="100" align="center">
              <template #default="scope">
                <el-tag size="small" :type="scope.row.type === 1 ? 'primary' : 'success'">
                  {{ scope.row.type === 1 ? '专题图' : '报告' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="fileExtension" label="格式" width="80" align="center" />
            <el-table-column prop="fileSize" label="大小" width="100" align="center">
              <template #default="scope">
                {{ formatFileSize(scope.row.fileSize) }}
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="170" align="center" />
            <el-table-column label="操作" width="120" align="center" fixed="right">
              <template #default="scope">
                <el-button
                  type="primary"
                  size="small"
                  icon="Download"
                  @click="handleDownloadSingle(scope.row)"
                >
                  下载
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<script setup name="FileManagement">
import { ref, reactive, computed, onMounted, toRefs } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, View, Download, Delete, Picture } from '@element-plus/icons-vue';
import Pagination from '@/components/Pagination';
import {
  getDisasterList,
  getFileList,
  deleteDisasterFiles
} from '@/api/data_management/FileManagement';

// 响应式数据
const disasterList = ref([]);
const fileList = ref([]);
const loading = ref(false);
const fileDialogVisible = ref(false);
const currentDisaster = ref(null);
const activeTab = ref('image');
const total = ref(0);

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 20,
    disasterType: 'rain'
  }
});

const { queryParams, form } = toRefs(data);

// 计算属性：按类型分类的文件
const imageFiles = computed(() => {
  if (!fileList.value || fileList.value.length === 0) return [];
  return fileList.value.filter(file => {
    const ext = file.fileExtension?.toLowerCase();
    return ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'].includes(ext);
  });
});

const documentFiles = computed(() => {
  if (!fileList.value || fileList.value.length === 0) return [];
  return fileList.value.filter(file => {
    const ext = file.fileExtension?.toLowerCase();
    return !['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'].includes(ext);
  });
});

// 获取图片 URL（根据环境动态选择）
function getImageUrl(file) {
  if (!file || !file.localSourceFile) return '';
  let imageServer = import.meta.env.VITE_APP_IMAGE_SERVER;
  if(file.type == 2) {
    imageServer = import.meta.env.VITE_APP_WORD_SERVER;
  }
  return imageServer + file.localSourceFile;
}

// 获取预览图片 URL（使用 sourceFile）
function getPreviewUrl(file) {
  return getImageUrl( file);
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

// 查询灾害列表
function handleQuery() {
  loading.value = true;
  getDisasterList(queryParams.value)
    .then(response => {
      disasterList.value = response.rows || [];
      total.value = response.total || 0;
    })
    .catch(error => {
      ElMessage.error('获取灾害列表失败');
    })
    .finally(() => {
      loading.value = false;
    });
}

// 重置查询
function resetQuery() {
  queryParams.value.disasterType = '';
  queryParams.value.pageNum = 1;
  handleQuery();
}

// 点击行查看文件
function handleRowClick(row) {
  handleViewFiles(row);
}

// 查看文件
function handleViewFiles(row) {
  currentDisaster.value = row;
  fileDialogVisible.value = true;
  activeTab.value = 'image';
  loading.value = true;

  getFileList(row.disasterId, row.disasterType, row.occurrenceTime)
    .then(response => {
      fileList.value = response.data || [];
    })
    .catch(error => {
      ElMessage.error('获取文件列表失败');
      fileList.value = [];
    })
    .finally(() => {
      loading.value = false;
    });
}

// Tab 切换
function handleTabChange(tabName) {
  // 可以在这里做一些清理工作
}

// 单个文件下载
function handleDownloadSingle(file) {
  try {
    const url = getImageUrl(file);
    // 创建临时链接并触发下载
    const link = document.createElement('a');
    link.href = url;
    link.download = file.fileName;
    link.target = '_blank';
    // 对于跨域资源，使用新窗口打开
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, '_blank');
      ElMessage.success('已在新窗口打开文件：' + file.fileName);
    } else {
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      ElMessage.success('开始下载：' + file.fileName);
    }
  } catch (error) {
    ElMessage.error('下载失败：' + error.message);
  }
}

// 删除灾害文件
function handleDelete(row) {
  ElMessageBox.confirm(
    `确定要删除灾害 "${row.disasterName}" 的所有文件吗？此操作不可恢复！`,
    '警告',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    return deleteDisasterFiles(row.disasterId, row.disasterType);
  }).then(() => {
    ElMessage.success('删除成功');
    handleQuery();
  }).catch((action) => {
    if (action === 'close') {
      ElMessage.info('已取消删除');
    }
  });
}

// 分页变化处理（由 Pagination 组件自动触发）
// 不需要额外处理，@pagination 已经绑定到 handleQuery

// 初始化加载
onMounted(() => {
  handleQuery();
});
</script>

<style lang="scss" scoped>
.file-management-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 50px);
}

.search-card {
  margin-bottom: 20px;

  ::v-deep .el-card__body {
    padding: 18px;
  }
}

.table-card {
  ::v-deep .el-card__body {
    padding: 20px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .header-title {
    font-size: 16px;
    font-weight: bold;
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .dialog-title {
    font-size: 18px;
    font-weight: bold;
  }
}

.empty-data {
  padding: 40px 0;
}

// 图片网格布局
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding: 10px;
}

.image-card {
  transition: all 0.3s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }

  .image-wrapper {
    height: 200px;
    overflow: hidden;
    border-radius: 4px 4px 0 0;
    background-color: #f5f5f5;

    .preview-image {
      width: 100%;
      height: 100%;
      cursor: pointer;

      ::v-deep .el-image__inner {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .image-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: #909399;

      .el-icon {
        font-size: 40px;
        margin-bottom: 10px;
      }
    }
  }

  .image-info {
    padding: 12px;

    .file-name {
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 8px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .file-size {
        font-size: 12px;
        color: #909399;
      }
    }

    .file-actions {
      text-align: center;
    }
  }
}

// 响应式调整
@media (max-width: 768px) {
  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 15px;
  }
}
</style>
