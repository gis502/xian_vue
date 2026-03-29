# 灾害文件管理模块 API 文档

## 基础信息

- **模块名称**: 灾害文件管理
- **基础路径**: `/disaster/file`
- **数据格式**: JSON
- **字符编码**: UTF-8
- **认证方式**: Bearer Token

---

## 接口列表

### 1. 获取灾害列表

#### 接口说明
获取所有暴雨、地震灾害的基本信息列表

#### 请求信息
- **接口地址**: `/disaster/file/disasterList`
- **请求方式**: `GET`
- **是否需要登录**: 是
- **权限标识**: `disaster:file:list`

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| disasterType | String | 否 | 灾害类型筛选<br>- 空或不传：查询全部<br>- rain：只查询暴雨<br>- earthquake：只查询地震 | rain |

#### 请求示例
```http
GET /disaster/file/disasterList HTTP/1.1
Host: your-domain.com
Authorization: Bearer {token}
```

或带参数：
```http
GET /disaster/file/disasterList?disasterType=rain HTTP/1.1
Host: your-domain.com
Authorization: Bearer {token}
```

#### 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| code | Number | 状态码（200 表示成功） |
| msg | String | 响应消息 |
| data | Array | 灾害列表数据 |
| data[].disasterId | String | 灾害 ID（暴雨为 rain_id，地震为 disaster_id） |
| data[].disasterName | String | 灾害名称 |
| data[].disasterType | String | 灾害类型（rain/earthquake） |
| data[].occurrenceTime | DateTime | 发生时间 |
| data[].position | String | 位置信息 |
| data[].extraInfo | String | 附加信息（暴雨为降雨量，地震为震级） |

#### 响应示例
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": [
    {
      "disasterId": "RAIN20240101001",
      "disasterName": "2024 年 1 月 1 日暴雨过程",
      "disasterType": "rain",
      "occurrenceTime": "2024-01-01 10:00:00",
      "position": "某市某区",
      "extraInfo": "100mm"
    },
    {
      "disasterId": "123",
      "disasterName": "某地地震",
      "disasterType": "earthquake",
      "occurrenceTime": "2024-01-02 14:30:00",
      "position": "某县某镇",
      "extraInfo": "5.0 级"
    }
  ]
}
```

#### 前端调用示例
```javascript
// api/disaster/file.js
import request from '@/utils/request'

export function getDisasterList(disasterType) {
  return request({
    url: '/disaster/file/disasterList',
    method: 'get',
    params: { disasterType }
  })
}

// 使用示例
getDisasterList().then(response => {
  const disasters = response.data;
  console.log('灾害列表:', disasters);
});

// 只获取暴雨
getDisasterList('rain').then(response => {
  const rainDisasters = response.data;
  console.log('暴雨列表:', rainDisasters);
});
```

---

### 2. 获取灾害文件列表

#### 接口说明
根据灾害 ID 和类型获取该灾害的所有文件（报告、图片等）

#### 请求信息
- **接口地址**: `/disaster/file/fileList`
- **请求方式**: `GET`
- **是否需要登录**: 是
- **权限标识**: `disaster:file:list`

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| disasterId | String | 是 | 灾害 ID（从灾害列表接口获取） | RAIN20240101001 |
| disasterType | String | 是 | 灾害类型<br>- rain：暴雨<br>- earthquake：地震 | rain |

#### 请求示例
```http
GET /disaster/file/fileList?disasterId=RAIN20240101001&disasterType=rain HTTP/1.1
Host: your-domain.com
Authorization: Bearer {token}
```

#### 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| code | Number | 状态码 |
| msg | String | 响应消息 |
| data | Array | 文件列表数据 |
| data[].id | String | 文件 ID |
| data[].disasterId | String | 灾害 ID |
| data[].disasterType | String | 灾害类型 |
| data[].queueId | String | 评估批次编码 |
| data[].code | String | 产品编码 |
| data[].fileType | String | 文件类型（专题图/报告等） |
| data[].fileName | String | 文件名称 |
| data[].fileExtension | String | 文件扩展名（.png/.pdf 等） |
| data[].fileSize | Number | 文件大小（字节） |
| data[].sourceFile | String | 文件路径（相对路径） |
| data[].localSourceFile | String | 本地文件路径（绝对路径） |
| data[].remark | String | 备注说明 |
| data[].size | String | 专题图尺寸（A3/A4 等） |
| data[].type | Number | 产出类型（1:专题图，2:报告） |
| data[].createTime | DateTime | 创建时间 |
| data[].updateTime | DateTime | 更新时间 |
| data[].isDeleted | Number | 是否删除（0:未删除，1:已删除） |

#### 响应示例
```json
{
  "code": 200,
  "msg": "操作成功",
  "data": [
    {
      "id": "1",
      "disasterId": "RAIN20240101001",
      "disasterType": "rain",
      "queueId": "QUEUE001",
      "code": "PRODUCT001",
      "fileType": "专题图",
      "fileName": "累计降雨量分布图",
      "fileExtension": ".png",
      "fileSize": 1024000,
      "sourceFile": "/files/rain/2024/cumulative_rainfall.png",
      "localSourceFile": "D:/data/files/rain/2024/cumulative_rainfall.png",
      "remark": "累计降雨量专题图",
      "size": "A3",
      "type": 1,
      "createTime": "2024-01-01 12:00:00",
      "updateTime": "2024-01-01 12:00:00",
      "isDeleted": 0
    },
    {
      "id": "2",
      "disasterId": "RAIN20240101001",
      "disasterType": "rain",
      "queueId": "QUEUE001",
      "code": "REPORT001",
      "fileType": "报告",
      "fileName": "暴雨评估报告",
      "fileExtension": ".pdf",
      "fileSize": 2048000,
      "sourceFile": "/files/rain/2024/report.pdf",
      "localSourceFile": "D:/data/files/rain/2024/report.pdf",
      "remark": "暴雨灾害评估报告",
      "size": "A4",
      "type": 2,
      "createTime": "2024-01-01 13:00:00",
      "updateTime": "2024-01-01 13:00:00",
      "isDeleted": 0
    }
  ]
}
```

#### 前端调用示例
```javascript
// api/disaster/file.js
export function getFileList(disasterId, disasterType) {
  return request({
    url: '/disaster/file/fileList',
    method: 'get',
    params: {
      disasterId,
      disasterType
    }
  })
}

// 使用示例
getFileList('RAIN20240101001', 'rain').then(response => {
  const files = response.data;
  files.forEach(file => {
    if (file.type === 1) {
      // 专题图处理
      console.log('专题图:', file.fileName);
    } else if (file.type === 2) {
      // 报告处理
      console.log('报告:', file.fileName);
    }
  });
});
```

---

### 3. 删除灾害文件

#### 接口说明
删除整场灾害的所有文件记录（逻辑删除，不会物理删除文件）

#### 请求信息
- **接口地址**: `/disaster/file/{disasterId}/{disasterType}`
- **请求方式**: `DELETE`
- **是否需要登录**: 是
- **权限标识**: `disaster:file:remove`

#### 请求参数

| 参数名 | 类型 | 必填 | 说明 | 示例值 |
|--------|------|------|------|--------|
| disasterId | String | 是 | 灾害 ID（路径参数） | RAIN20240101001 |
| disasterType | String | 是 | 灾害类型（路径参数）<br>- rain：暴雨<br>- earthquake：地震 | rain |

#### 请求示例
```http
DELETE /disaster/file/RAIN20240101001/rain HTTP/1.1
Host: your-domain.com
Authorization: Bearer {token}
```

#### 响应参数

| 参数名 | 类型 | 说明 |
|--------|------|------|
| code | Number | 状态码 |
| msg | String | 响应消息 |
| data | Object | 返回数据（通常为空） |

#### 响应示例
```json
{
  "code": 200,
  "msg": "删除成功"
}
```

#### 前端调用示例
```javascript
// api/disaster/file.js
export function deleteDisasterFiles(disasterId, disasterType) {
  return request({
    url: `/disaster/file/${disasterId}/${disasterType}`,
    method: 'delete'
  })
}

// 使用示例
import { Modal, Message } from 'ant-design-vue';

function handleDelete(row) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除灾害 "${row.disasterName}" 的所有文件吗？此操作不可恢复！`,
    okText: '确认',
    cancelText: '取消',
    onOk: () => {
      return deleteDisasterFiles(row.disasterId, row.disasterType)
        .then(response => {
          Message.success('删除成功');
          // 刷新列表
          loadDisasterList();
        })
        .catch(error => {
          Message.error('删除失败');
        });
    }
  });
}
```

---

## 枚举类型说明

### DisasterType（灾害类型枚举）
```javascript
const DisasterType = {
  RAIN: 'rain',           // 暴雨
  EARTHQUAKE: 'earthquake' // 地震
};
```

### OutputType（文件类型枚举 - type 字段）
```javascript
const OutputType = {
  MAP: 1,    // 专题图
  REPORT: 2  // 报告
};
```

---

## 完整的前端 API 封装示例

```javascript
// api/disaster/file.js
import request from '@/utils/request'

// 灾害类型枚举
export const DisasterType = {
  RAIN: 'rain',
  EARTHQUAKE: 'earthquake'
}

// 文件类型枚举
export const OutputType = {
  MAP: 1,
  REPORT: 2
}

/**
 * 获取灾害列表
 * @param {string} disasterType - 灾害类型（可选）
 */
export function getDisasterList(disasterType) {
  return request({
    url: '/disaster/file/disasterList',
    method: 'get',
    params: { disasterType }
  })
}

/**
 * 获取灾害文件列表
 * @param {string} disasterId - 灾害 ID
 * @param {string} disasterType - 灾害类型
 */
export function getFileList(disasterId, disasterType) {
  return request({
    url: '/disaster/file/fileList',
    method: 'get',
    params: { disasterId, disasterType }
  })
}

/**
 * 删除灾害文件
 * @param {string} disasterId - 灾害 ID
 * @param {string} disasterType - 灾害类型
 */
export function deleteDisasterFiles(disasterId, disasterType) {
  return request({
    url: `/disaster/file/${disasterId}/${disasterType}`,
    method: 'delete'
  })
}
```

---

## Vue 组件完整示例

```vue
<template>
  <div class="disaster-file-container">
    <!-- 搜索栏 -->
    <el-form :model="queryParams" :inline="true">
      <el-form-item label="灾害类型">
        <el-select v-model="queryParams.disasterType" placeholder="请选择" clearable>
          <el-option label="暴雨" value="rain" />
          <el-option label="地震" value="earthquake" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery">查询</el-button>
      </el-form-item>
    </el-form>

    <!-- 灾害列表 -->
    <el-table v-loading="loading" :data="disasterList">
      <el-table-column label="灾害 ID" prop="disasterId" />
      <el-table-column label="灾害名称" prop="disasterName" />
      <el-table-column label="灾害类型">
        <template #default="scope">
          <el-tag :type="scope.row.disasterType === 'rain' ? 'success' : 'warning'">
            {{ scope.row.disasterType === 'rain' ? '暴雨' : '地震' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发生时间" prop="occurrenceTime" width="180" />
      <el-table-column label="位置" prop="position" />
      <el-table-column label="附加信息" prop="extraInfo" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button 
            type="primary" 
            size="small"
            @click="handleViewFiles(scope.row)"
          >
            查看文件
          </el-button>
          <el-button 
            type="danger" 
            size="small"
            @click="handleDelete(scope.row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 文件列表对话框 -->
    <el-dialog 
      v-model="fileDialogVisible" 
      title="文件列表" 
      width="1000px"
    >
      <el-table :data="fileList">
        <el-table-column label="文件类型" prop="fileType" width="100" />
        <el-table-column label="文件名" prop="fileName" />
        <el-table-column label="扩展名" prop="fileExtension" width="80" />
        <el-table-column label="大小" width="100">
          <template #default="scope">
            {{ formatFileSize(scope.row.fileSize) }}
          </template>
        </el-table-column>
        <el-table-column label="类型">
          <template #default="scope">
            <el-tag :type="scope.row.type === 1 ? 'primary' : 'success'">
              {{ scope.row.type === 1 ? '专题图' : '报告' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" prop="createTime" width="180" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small"
              @click="handleDownload(scope.row)"
            >
              下载
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup name="DisasterFile">
import { 
  getDisasterList, 
  getFileList, 
  deleteDisasterFiles,
  DisasterType,
  OutputType
} from '@/api/disaster/file';
import { ref, reactive, getCurrentInstance } from 'vue';

const { proxy } = getCurrentInstance();

const disasterList = ref([]);
const fileList = ref([]);
const loading = ref(true);
const fileDialogVisible = ref(false);
const currentDisaster = ref(null);

const queryParams = reactive({
  disasterType: ''
});

// 查询灾害列表
function handleQuery() {
  loading.value = true;
  getDisasterList(queryParams.disasterType)
    .then(response => {
      disasterList.value = response.data;
    })
    .finally(() => {
      loading.value = false;
    });
}

// 查看文件
function handleViewFiles(row) {
  currentDisaster.value = row;
  fileDialogVisible.value = true;
  getFileList(row.disasterId, row.disasterType)
    .then(response => {
      fileList.value = response.data;
    });
}

// 删除灾害文件
function handleDelete(row) {
  proxy.$Modal.confirm({
    title: '确认删除',
    content: `确定要删除灾害 "${row.disasterName}" 的所有文件吗？`,
    onOk: () => {
      return deleteDisasterFiles(row.disasterId, row.disasterType);
    }
  })
  .then(() => {
    proxy.$Modal.msgSuccess('删除成功');
    handleQuery();
  })
  .catch(() => {});
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// 下载文件
function handleDownload(file) {
  window.open(file.sourceFile, '_blank');
}

// 初始化加载
handleQuery();
</script>

<style scoped>
.disaster-file-container {
  padding: 20px;
}
</style>
```

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 401 | 未授权，请重新登录 |
| 403 | 无权限访问 |
| 500 | 服务器内部错误 |

---

## 注意事项

1. **所有接口都需要登录认证**，请在请求头中携带有效的 Token
2. **删除操作是逻辑删除**，不会真正从数据库物理删除数据
3. **删除操作是批量删除**，会删除整场灾害的所有文件记录
4. **文件路径说明**：
   - `sourceFile`: 相对路径，可用于 Web 访问
   - `localSourceFile`: 本地绝对路径，用于服务器文件系统访问
5. **type 字段**：1 表示专题图，2 表示报告，前端可根据此字段做不同的展示
6. **数据来源**：
   - 灾害基本信息来自 `rain_list` 和 `xian_earthquake_list` 表
   - 灾害文件（报告、图片）来自 `rain_assessment_output` 和 `assessment_output` 表

---

## 技术支持

如有问题，请联系开发团队或查阅项目文档。
