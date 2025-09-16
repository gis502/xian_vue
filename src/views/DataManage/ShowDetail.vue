<template>

    <!-- 内容 -->
    <el-card class="card">
        <template #header>
            <div class="card-header">
                <span>表数据</span>
                <div class="close" @click="emit('closeCard')">
                    <el-icon>
                        <Close />
                    </el-icon>
                </div>
            </div>
        </template>
        <div class="operation-box">
            <el-button type="danger" @click="deleteSelectionDatas">删除选中</el-button>
        </div>
        <el-table ref="multipleTable" :data="tableDatas" border style="width: 100%" @row-click="handleRowClick">
            <el-table-column type="selection" width="55" />
            <el-table-column v-for="tableLabel in tableLabels" :prop="tableLabel.key"
                :label="tableLabel.value ? (tableLabel.key + '(' + tableLabel.value + ')') : tableLabel.key"
                align="center" />
        </el-table>
        <template #footer>
            <el-pagination style="float: right;" background layout="prev, pager, next" :page-count="totalPage"
                v-model:current-page="pageNum" @update:current-page="getTableData" />
        </template>
    </el-card>

    <!-- 删除提示 -->
    <el-dialog v-model="dialogVisible" title="删除数据" width="500">
        <span>确定删除以下数据吗？一旦删除将无法恢复，请谨慎操作！！！</span>
        <el-table :data="deleteTableDatas" border style="width: 100%" @row-click="handleRowClick">
            <el-table-column v-for="tableLabel in tableLabels" :prop="tableLabel.key"
                :label="tableLabel.value ? (tableLabel.key + '(' + tableLabel.value + ')') : tableLabel.key"
                align="center" />
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
</template>
<script setup lang="js" name="ShowDetail">
import { onMounted, ref } from 'vue';
import { deleteTableData, queryTableInfo } from '../../api/data_management/DataManagement';
import { ElMessage } from 'element-plus';

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

// 对象转为数组
function objToArr(obj) {
    // 遍历键值对数组，转换为目标结构
    return Object.entries(obj).map(([key, value]) => {
        return { key: value.key, value: value.value };
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

* ,
::v-deep .el-table__header th{
    font-size: 1.2rem !important;
}
</style>