<template>

  <!-- 内容 -->
  <el-card class="card">
    <template #header>
      <div class="card-header">
        <span>表数据</span>
        <div class="close" @click="emit('closeCard')">
          <el-icon>
            <Close/>
          </el-icon>
        </div>
      </div>
    </template>
    <div class="operation-box">
      <el-button type="danger" @click="deleteSelectionDatas">删除选中</el-button>
      <el-button type="info" @click="addBtnClick">新增数据</el-button>
      <el-button type="warning" @click="updateBtnClick">修改选中</el-button>
      <el-button type="success" @click="export2Excel">导出数据</el-button>

    </div>
    <el-table ref="multipleTable" :data="tableDatas" border style="width: 100%" @row-click="handleRowClick">
      <el-table-column type="selection" width="55"/>
      <el-table-column v-for="tableLabel in tableLabels" :prop="tableLabel.key"
                       :label="tableLabel.value ? (tableLabel.key + '(' + tableLabel.value + ')') : tableLabel.key"
                       align="center"/>
    </el-table>
    <template #footer>
      <el-pagination style="float: right;" background layout="prev, pager, next" :page-count="totalPage"
                     v-model:current-page="pageNum" @update:current-page="getTableData"/>
    </template>
  </el-card>

  <!-- 删除提示 -->
  <el-dialog v-model="dialogVisible" title="删除数据" width="500">
    <span>确定删除以下数据吗？一旦删除将无法恢复，请谨慎操作！！！</span>
    <el-table :data="deleteTableDatas" border style="width: 100%" @row-click="handleRowClick">
      <el-table-column v-for="tableLabel in tableLabels" :prop="tableLabel.key"
                       :label="tableLabel.value ? (tableLabel.key + '(' + tableLabel.value + ')') : tableLabel.key"
                       align="center"/>
    </el-table>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmDelete">
          确认
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 添加弹窗 -->
  <el-dialog v-model="dialogAddVisible" title="添加数据" width="800">
    <!-- 遍历数据 -->
    <div v-for="(tableLabel, index) in tableLabels" :key="index">
      <div class="input-group">
        <span class="label">{{ tableLabel.value || tableLabel.key }}</span>
        <div class="input-container">
          <el-input
              v-model="addUpdateForm[tableLabel.key]"
              class="responsive-input"
          />
        </div>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogAddVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAdd">
          确认
        </el-button>
      </div>
    </template>
  </el-dialog>

  <!-- 修改弹窗 -->
  <el-dialog v-model="dialogUpdateVisible" title="修改数据" width="800">
    <!-- 遍历数据 -->
    <div v-for="(tableLabel, index) in tableLabels" :key="index">
      <div class="input-group">
        <span class="label">{{ tableLabel.value || tableLabel.key }}</span>
        <div class="input-container">
          <el-input
              v-model="addUpdateForm[tableLabel.key]"
              class="responsive-input"
              :disabled="(primaryKey || []).includes(tableLabel.key)"
          />
        </div>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogUpdateVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpdate">
          确认
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script setup lang="js" name="ShowDetail">
import {onMounted, ref} from 'vue';
import {addTableData, deleteTableData, queryTableInfo, updateTableData} from '../../api/data_management/DataManagement';
import {ElLoading, ElMessage} from 'element-plus';
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
    ]
  }
  addTableData(datas).then((res) => {
    console.log(res)
    if (res && res.code == 200) {
      dialogAddVisible.value = false;
      // 清除数据
      clearFormDatas(addUpdateForm);
      ElMessage.success("添加成功。");
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
    newData: addUpdateForm.value,
    oldData: ids.length == 0 ? selectedRows[0] : {}
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
</script>
<style scoped>
.card {
  width: 100%;
  height: 95vh;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 999;
  overflow-y: auto;
}

.close {
  float: right;
  padding: 3px 0;
  cursor: pointer;
}

.close:hover {
  color: #202020;
}

.operation-box {
  margin-bottom: 10px;
}

*,
::v-deep .el-table__header th {
  font-size: 1.2rem !important;
}

.label {
  font-weight: bold;
  margin-bottom: 5px;
  display: block;
}

.input-container {
  margin-bottom: 10px;
}
</style>