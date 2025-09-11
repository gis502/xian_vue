<template>
    <div class="header">
        <el-form :model="form">
            <el-row>
                <el-col :span="8">
                    <el-form-item label="表名">
                        <el-autocomplete v-model="form.remark" :fetch-suggestions="callbackTableName" clearable />
                    </el-form-item>
                </el-col>
                <el-col :span="4" class="m-1">
                </el-col>
            </el-row>
        </el-form>
    </div>
    <div class="table-box">
        <el-table class="custom-table" :data="tableDatas" border style="width: 100%" @row-click="handleRowClick">
            <el-table-column type="index" label="序号" width="100" align="center" />
            <el-table-column prop="tableName" label="表名" width="500" align="center" />
            <el-table-column prop="remark" label="说明" align="center" />
        </el-table>
    </div>

    <!-- 显示详情组件 -->
    <ShowDetail v-if="showDetail" @closeCard="closeCard" :queryTableFields="queryTableFields"></ShowDetail>
</template>
<script setup lang="js" name="DataManage">
import { onMounted, ref } from 'vue';
import { queryTableNames } from '../../api/data_management/DataManagement';
import ShowDetail from './ShowDetail.vue';

// 显示详情
let showDetail = ref(false);

// 查询表数据
let queryTableFields = ref({
    tableName: '',
    pageSize: 100,
    pageNum: 1
})

// 表单数据
let form = ref({
    remark: '',
});

// 表格数据
let tableDatas = ref([]);

// 获取表名的定时器
let tableNameTimeout = null;
const callbackTableName = (queryString, cb) => {
    clearTimeout(tableNameTimeout)
    tableNameTimeout = setTimeout(() => {
        // 从后台获取数据
        queryTableNames(form.value.remark).then((res) => {
          tableDatas.value = res.data;
            const result = []
            res.data.forEach((item) => {
                result.push({
                    value: item.remark
                })
            });
            cb(result);
        })
    }, 1500);
};

// 页面加载时获取表格数据
onMounted(() => {
    // 获取表格数据
    queryTableNames('').then((res) => {
        tableDatas.value = res.data;
    })
})

// 点击行事件
function handleRowClick(row) {
    showDetail.value = true;
}

// 关闭详情组件
function closeCard() {
    showDetail.value = false;
}
</script>

<style scoped>
.header {
    padding: 20px;
}

.m-1 {
    margin-left: 10px;
}

.table-box {
    padding: 10px;
}

::v-deep .custom-table .el-table__row:hover>td {
    background-color: #2f2f2f !important;
    color: #FFF !important;
    cursor: pointer;
}
</style>