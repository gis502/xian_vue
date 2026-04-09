<template>

  <!-- 内容 -->
  <el-card class="card" shadow="hover">
    <template #header>
      <div class="card-header">
        <div class="header-left">
          <el-icon class="header-icon"><DataLine /></el-icon>
          <span class="header-title">表数据</span>
        </div>
        <div class="close" @click="emit('closeCard')" title="关闭">
          <el-icon :size="20">
            <Close/>
          </el-icon>
        </div>
      </div>
    </template>
    
    <div class="operation-box">
      <el-button type="danger" icon="Delete" @click="deleteSelectionDatas" class="action-button">
        删除选中
      </el-button>
      <el-button type="primary" icon="Plus" @click="addBtnClick" class="action-button">
        新增数据
      </el-button>
      <el-button type="warning" icon="Edit" @click="updateBtnClick" class="action-button">
        修改选中
      </el-button>
      <el-button type="success" icon="Download" @click="export2Excel" class="action-button">
        导出数据
      </el-button>
    </div>
    
    <el-table 
      ref="multipleTable" 
      :data="tableDatas" 
      border 
      stripe
      style="width: 100%" 
      @row-click="handleRowClick"
      :scrollbar-always-on="true"
      highlight-current-row
      class="beautified-table"
    >
      <el-table-column type="selection" width="55" align="center" fixed />
      <el-table-column 
        v-for="tableLabel in tableLabels" 
        :key="tableLabel.key"
        :prop="tableLabel.key"
        :label="tableLabel.value ? (tableLabel.key + '(' + tableLabel.value + ')') : tableLabel.key"
        align="center"
        min-width="120"
        show-overflow-tooltip
      />
    </el-table>
    
    <template #footer>
      <div class="pagination-wrapper">
        <el-pagination 
          background 
          layout="total, prev, pager, next, jumper" 
          :page-count="totalPage"
          :page-size="props.queryTableFields.pageSize"
          v-model:current-page="pageNum" 
          @update:current-page="getTableData"
          class="custom-pagination"
        />
      </div>
    </template>
  </el-card>

  <!-- 删除提示 -->
  <el-dialog 
    v-model="dialogVisible" 
    title="确认删除" 
    width="600px"
    class="delete-dialog"
    :close-on-click-modal="false"
  >
    <div class="dialog-content">
      <el-alert
        title="警告：此操作不可恢复！"
        type="warning"
        :closable="false"
        show-icon
        class="warning-alert"
      />
      <p class="dialog-text">确定要删除以下 <strong>{{ deleteTableDatas.length }}</strong> 条数据吗？</p>
      <el-table 
        :data="deleteTableDatas" 
        border 
        stripe
        style="width: 100%" 
        max-height="300"
        class="preview-table"
      >
        <el-table-column 
          v-for="tableLabel in tableLabels" 
          :key="tableLabel.key"
          :prop="tableLabel.key"
          :label="tableLabel.value ? (tableLabel.key + '(' + tableLabel.value + ')') : tableLabel.key"
          align="center"
          min-width="100"
          show-overflow-tooltip
        />
      </el-table>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false" icon="Close">取消</el-button>
        <el-button type="danger" @click="confirmDelete" icon="Check">
          确认删除
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 添加弹窗 -->
  <el-dialog 
    v-model="dialogAddVisible" 
    title="添加数据" 
    width="700px"
    class="form-dialog"
    :close-on-click-modal="false"
  >
    <el-form label-position="top" class="custom-form">
      <div v-for="(tableLabel, index) in tableLabels" :key="index">
        <el-form-item 
          v-if="!(primaryKey || []).includes(tableLabel.key)"
          :label="tableLabel.value || tableLabel.key"
          class="form-item"
        >
          <el-input
            v-model="addUpdateForm[tableLabel.key]"
            placeholder="请输入" + (tableLabel.value || tableLabel.key)
            clearable
          />
        </el-form-item>
      </div>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogAddVisible = false" icon="Close">取消</el-button>
        <el-button type="primary" @click="handleAdd" icon="Check">
          确认添加
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 修改弹窗 -->
  <el-dialog 
    v-model="dialogUpdateVisible" 
    title="修改数据" 
    width="700px"
    class="form-dialog"
    :close-on-click-modal="false"
  >
    <el-form label-position="top" class="custom-form">
      <div v-for="(tableLabel, index) in tableLabels" :key="index">
        <el-form-item 
          :label="tableLabel.value || tableLabel.key"
          class="form-item"
        >
          <el-input
            v-model="addUpdateForm[tableLabel.key]"
            :disabled="(primaryKey || []).includes(tableLabel.key)"
            placeholder="请输入" + (tableLabel.value || tableLabel.key)
            clearable
          />
        </el-form-item>
      </div>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogUpdateVisible = false" icon="Close">取消</el-button>
        <el-button type="primary" @click="handleUpdate" icon="Check">
          确认修改
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script setup lang="js" name="ShowDetail">
import {onMounted, ref} from 'vue';
import {addTableData, deleteTableData, queryTableInfo, updateTableData} from '../../api/data_management/DataManagement';
import {ElLoading, ElMessage} from 'element-plus';
import { Close, DataLine, Delete, Plus, Edit, Download, Check } from '@element-plus/icons-vue';
import * as XLSX from 'xlsx';

const emit = defineEmits(['closeCard']);
const props = defineProps(['queryTableFields']);

// 表格对象
const multipleTable = ref();

// 表数据
const tableDatas = ref([]);
const tableLabels = ref([]);

// 页数、总页数
const pageNum = ref(1);
const totalPage = ref(0);

// 主键
const primaryKey = ref([]);

// 字段类型
const fieldTypes = ref({});

// 显示删除提示
const dialogVisible = ref(false);

// 要删除的数据
const deleteTableDatas = ref([]);

// 添加弹窗
const dialogAddVisible = ref(false);

// 修改弹窗
const dialogUpdateVisible = ref(false)

// 添加修改数据表单
const addUpdateForm = ref({});

// 加载完成后执行
onMounted(() => {
  getTableData();
})

// 获取表格数据
function getTableData() {
  // 更改页码
  props.queryTableFields.pageNum = pageNum.value;

  // 获取表格数据
  queryTableInfo(props.queryTableFields).then((res) => {
    res = res.data;
    tableDatas.value = res.tableInfo;
    tableLabels.value = objToArr(res.keyInfo);
    totalPage.value = res.allPage;
    primaryKey.value = res.primaryKey;
    fieldTypes.value = getFieldType(res.keyInfo)

    // 修改添加修改数据表单
    clearFormDatas(addUpdateForm)
  })
}

// 删除选中数据
function deleteSelectionDatas() {
  // 通过表格实例的getSelectionRows()方法获取选中行
  const selectedRows = multipleTable.value.getSelectionRows();
  if (selectedRows.length == 0) {
    ElMessage.error("请至少选择一条数据。");
    return;
  }
  dialogVisible.value = true;
  deleteTableDatas.value = selectedRows;
}

// 确认删除
function confirmDelete() {
  dialogVisible.value = false;

  // 选中的行
  const selectedRows = multipleTable.value.getSelectionRows();

  // 传递的值
  const datas = {
    tableName: props.queryTableFields.tableName
  };

  // 确定要使用的键：有主键则用主键，否则用所有字段
  const keys = primaryKey.value.length > 0
      ? primaryKey.value
      : tableLabels.value.map(label => label.key);

  // 构建条件数组
  const conditions = selectedRows.map(item => {
    const condition = {};
    // 根据确定的键构建条件对象
    keys.forEach(key => {
      condition[key] = item[key];
    });
    return condition;
  });

  datas.conditions = conditions;

  // 调用删除接口
  deleteTableData(datas).then((res) => {
    if (res.code == 200) {
      ElMessage.success("删除成功");
      // 重新查询数据
      getTableData();
    } else {
      ElMessage.error(res.message);
    }
  }).catch((err) => {
    ElMessage.error("删除失败：" + err.message);
  });
}

// 点击新增数据按钮
function addBtnClick() {
  dialogAddVisible.value = true;
  clearFormDatas(addUpdateForm);
}

// 添加数据
function handleAdd() {
  const datas = {
    tableName: props.queryTableFields.tableName,
    datas: [
      addUpdateForm.value
    ],
    fieldTypes: fieldTypes.value
  }
  addTableData(datas).then((res) => {
    console.log(res)
    if (res && res.code == 200) {
      dialogAddVisible.value = false;
      // 清除数据
      clearFormDatas(addUpdateForm);
      ElMessage.success("添加成功。");
      getTableData();
    } else {
      ElMessage.error("添加失败。");
    }
  })
}

// 点击修改
function updateBtnClick() {
  // 通过表格实例的getSelectionRows()方法获取选中行
  const selectedRows = multipleTable.value.getSelectionRows();
  if (selectedRows.length == 0 || selectedRows.length > 1) {
    ElMessage.error("请选择一条数据。");
    return;
  } else {
    const source = selectedRows[0];
    // 遍历源对象的所有键
    Object.keys(source).forEach(key => {
      addUpdateForm.value[key] = source[key];
    });
    dialogUpdateVisible.value = true;
  }
}

// 修改数据
function handleUpdate() {
  const selectedRows = multipleTable.value.getSelectionRows();

  // 主键对应的值
  const ids = [];
  Object.keys(addUpdateForm.value).forEach(key => {
    if (primaryKey.value.includes(key)) {
      ids.push(addUpdateForm.value[key]);
    }
  });

  // 传递给后端的数据
  const datas = {
    tableName: props.queryTableFields.tableName,
    idName: primaryKey.value,
    id: ids,
    newData: [addUpdateForm.value],
    oldData: ids.length == 0 ? [selectedRows[0]] : [],
    fieldTypes: fieldTypes.value
  }

  updateTableData(datas).then((res) => {
    if (res && res.code == 200) {
      dialogUpdateVisible.value = false;

      ElMessage.success("修改成功。");

      // 修改表格数据
      Object.keys(addUpdateForm.value).forEach(key => {
        selectedRows[0][key] = addUpdateForm.value[key];
      });

      // 清除数据
      clearFormDatas(addUpdateForm);
    } else {
      ElMessage.error("修改失败。");
    }
  })
}

// 导出为excel
async function export2Excel() {
  // 加载中
  const loadingInstance = ElLoading.service({
    lock: true, // 锁定屏幕滚动
    text: '导出中，请稍候...',
    background: 'rgba(200, 200, 200, 0.7)', // 半透明灰色背景
  });

  // 总数量
  let totalNum = totalPage.value * props.queryTableFields.pageSize;

  if (totalNum > 10000) {
    ElMessage.error("当前表总数据超过10000条，仅导出前10000条数据。");
    totalNum = 10000;
  }

  // 表格数组（第一行为标题）
  const tableData = [[]];
  // 字段与索引的映射（用于匹配标题列）
  const fields = {};

  // 处理标题行
  tableLabels.value.forEach((item, index) => {
    tableData[0].push(item.value || item.key);
    fields[item.key] = index; // 记录每个字段对应的列索引
  });

  // 计算总页数（每页1000条）
  const totalPages = Math.ceil(totalNum / 1000);
  // 收集所有分页请求的Promise
  const requestPromises = [];

  // 生成所有分页请求
  for (let i = 0; i < totalPages; i++) {
    const promise = queryTableInfo({
      pageNum: i + 1, // 页码从1开始
      pageSize: 1000,
      tableName: props.queryTableFields.tableName
    }).then(res => res.data);
    requestPromises.push(promise);
  }

  try {
    // 等待所有分页数据加载完成
    const allPagesData = await Promise.all(requestPromises);

    // 处理所有分页数据，添加到表格数组
    allPagesData.forEach(pageData => {
      pageData.tableInfo.forEach(item => {
        // 为每行创建新数组（长度与标题行一致，避免引用污染）
        const row = new Array(tableLabels.value.length).fill('');
        // 填充当前行数据（按标题列索引匹配）
        Object.keys(item).forEach(key => {
          const columnIndex = fields[key];
          // 只填充存在于标题中的字段
          if (columnIndex !== undefined) {
            row[columnIndex] = item[key] ?? ''; // 处理null/undefined，避免导出空单元格异常
          }
        });
        tableData.push(row);
      });
    });

    // 所有数据处理完成后，导出Excel
    const worksheet = XLSX.utils.aoa_to_sheet(tableData);

    // 配置列宽（自适应标题长度，最小12px，最大30px）
    worksheet['!cols'] = tableLabels.value.map(item => {
      const titleLength = (item.value || item.key).length;
      const width = Math.min(Math.max(titleLength * 1.2, 12), 30);
      return { wpx: width * 8 }; // 转换为px（1个字符≈8px）
    });

    // 导出Excel
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, '数据导出.xlsx');

  } catch (error) {
    // 捕获请求失败的错误
    ElMessage.error(`导出失败：${error.message || '网络请求异常'}`);
  } finally {
    // 无论成功/失败，都关闭加载状态
    loadingInstance.close();
  }
}

// 清除表单数据
function clearFormDatas(form) {
  tableLabels.value.forEach(item => {
    form.value[item.key] = null;
  })
}

// 对象转为数组
function objToArr(obj) {
  // 遍历键值对数组，转换为目标结构
  return Object.entries(obj).map(([key, value]) => {
    return {key: value.key, value: value.value};
  });
}

/**
 * 获取字段类型
 * @param keyInfo
 * @return {{}}
 */
function getFieldType(keyInfo) {
  const result = {};
  keyInfo.forEach((item) => {
    result[item.key] = item.type;
  })

  return result;
}

// 行点击事件（用于取消选中）
function handleRowClick(row, column, event) {
  // 如果点击的是复选框列，不处理
  if (column.type === 'selection') {
    return;
  }
}
</script>
<style scoped lang="scss">
.card {
  width: 100%;
  height: 95vh;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 999;
  overflow-y: auto;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

// 卡片头部样式
::v-deep .el-card__header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 18px 24px;
  border-bottom: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;

    .header-icon {
      font-size: 24px;
      color: #fff;
    }

    .header-title {
      font-size: 18px;
      font-weight: 600;
      color: #fff;
      letter-spacing: 1px;
    }
  }

  .close {
    cursor: pointer;
    color: rgba(255, 255, 255, 0.8);
    transition: all 0.3s ease;
    padding: 8px;
    border-radius: 50%;

    &:hover {
      color: #fff;
      background-color: rgba(255, 255, 255, 0.2);
      transform: rotate(90deg);
    }
  }
}

// 操作按钮区域
.operation-box {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;

  .action-button {
    transition: all 0.3s ease;
    font-weight: 500;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }
}

// 表格美化
.beautified-table {
  border-radius: 8px;
  overflow: hidden;

  ::v-deep .el-table__header {
    th {
      background: linear-gradient(to bottom, #f5f7fa 0%, #e8eaed 100%) !important;
      color: #303133;
      font-weight: 600;
      font-size: 14px;
      padding: 14px 0;
      border-bottom: 2px solid #dcdfe6;
    }
  }

  ::v-deep .el-table__body {
    tr {
      transition: all 0.3s ease;

      &:hover {
        background-color: #ecf5ff !important;
        transform: scale(1.005);
      }

      &.current-row > td {
        background-color: #e6f2ff !important;
      }
    }

    td {
      padding: 12px 0;
      font-size: 13px;
      color: #606266;
    }
  }
}

// 分页包装器
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px 0;
  background-color: #fafafa;
  border-top: 1px solid #ebeef5;
  margin-top: 16px;
}

.custom-pagination {
  ::v-deep .btn-prev,
  ::v-deep .btn-next,
  ::v-deep .el-pager li {
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.1);
    }
  }
}

// 对话框通用样式
::v-deep .el-dialog__header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  margin: 0;

  .el-dialog__title {
    color: #fff;
    font-size: 18px;
    font-weight: 600;
  }

  .el-dialog__headerbtn .el-dialog__close {
    color: #fff;
    font-size: 20px;

    &:hover {
      color: #f0f0f0;
    }
  }
}

::v-deep .el-dialog__body {
  padding: 24px;
}

// 删除对话框
.delete-dialog {
  .dialog-content {
    .warning-alert {
      margin-bottom: 16px;
    }

    .dialog-text {
      font-size: 14px;
      color: #606266;
      margin-bottom: 16px;

      strong {
        color: #f56c6c;
        font-size: 16px;
      }
    }

    .preview-table {
      border-radius: 8px;
      overflow: hidden;

      ::v-deep .el-table__header th {
        background-color: #fef0f0;
        color: #f56c6c;
        font-weight: 600;
      }
    }
  }
}

// 表单对话框
.form-dialog {
  .custom-form {
    max-height: 500px;
    overflow-y: auto;
    padding-right: 8px;

    // 滚动条样式
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: #dcdfe6;
      border-radius: 3px;

      &:hover {
        background-color: #c0c4cc;
      }
    }

    .form-item {
      margin-bottom: 18px;

      ::v-deep .el-form-item__label {
        font-weight: 500;
        color: #303133;
        font-size: 14px;
        padding-bottom: 6px;
      }

      ::v-deep .el-input {
        .el-input__wrapper {
          transition: all 0.3s ease;

          &:hover {
            box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
          }

          &.is-focus {
            box-shadow: 0 2px 12px rgba(64, 158, 255, 0.3);
          }
        }
      }
    }
  }
}

// 对话框底部按钮
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 12px;

  .el-button {
    min-width: 88px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }
}

// 响应式调整
@media (max-width: 768px) {
  .operation-box {
    .action-button {
      width: 100%;
    }
  }
}
</style>