<template>
    <div class="main">
        <el-form :model="form" class="form-container">
            <el-row>
                <!-- 灾害名称 -->
                <el-col :span="4" class="disasters">
                    <el-form-item>
                        <el-select v-model="form.disasterId">
                            <el-option v-for="disasterNamesItem in disasterNames" :key="disasterNamesItem.disasterId"
                                :value="disasterNamesItem.disasterId" :label="disasterNamesItem.name" />
                        </el-select>
                    </el-form-item>
                </el-col>

                <el-col :span="2">
                    <el-button type="primary" @click="query">查询</el-button>
                </el-col>
            </el-row>
        </el-form>
        <div class="chart-container">
            <el-row class="row">
                <el-col :span="12" class="table-column">
                    <div class="header">人口受影响情况</div>
                    <el-table 
                        class="table" 
                        :data="peopleTableData" 
                        style="width: 98%"
                        :max-height="tableHeight"
                        header-row-class-name="fixed-header"
                    >
                        <el-table-column align="center" type="index" label="序号" width="80" />
                        <el-table-column align="center" prop="hidePoint" label="隐患点名称"/>
                        <el-table-column align="center" prop="number" label="受影响人口数量"/>
                    </el-table>
                </el-col>
                <el-col :span="12" class="table-column">
                    <div class="header">交通受影响情况</div>
                    <el-table 
                        class="table" 
                        :data="trafficTableData" 
                        style="width: 98%"
                        :max-height="tableHeight"
                        header-row-class-name="fixed-header"
                    >
                        <el-table-column align="center" type="index" label="序号" width="80" />
                        <el-table-column align="center" prop="name" label="道路名称"/>
                    </el-table>
                </el-col>
            </el-row>
            <el-row class="row">
                <el-col :span="12" class="table-column">
                    <div class="header">危险源受影响情况</div>
                    <el-table 
                        class="table" 
                        :data="dangerTableData" 
                        style="width: 98%"
                        :max-height="tableHeight"
                        header-row-class-name="fixed-header"
                    >
                        <el-table-column align="center" type="index" label="序号" width="80" />
                        <el-table-column align="center" prop="position" label="危险源地址" />
                    </el-table>
                </el-col>
                <el-col :span="12" class="table-column">
                    <div class="header">地铁站受影响情况</div>
                    <el-table 
                        class="table" 
                        :data="stationTableData" 
                        style="width: 98%"
                        :max-height="tableHeight"
                        header-row-class-name="fixed-header"
                    >
                        <el-table-column align="center" type="index" label="序号" width="80" />
                        <el-table-column align="center" prop="name" label="名称"/>
                    </el-table>
                </el-col>
            </el-row>
        </div>
    </div>
</template>

<script lang="js" setup name="CarrierInformationExtraction">
import { onMounted, ref, onUnmounted, watch, nextTick } from "vue";
import { useDisasterData } from "../../api/hooks/useDisasterData";
import CarrierInformation from "../../api/multi_hazard_disaster_chain_risk_model/carrier_information/CarrierInformation";

// 表格数据
const peopleTableData = ref([]);
const trafficTableData = ref([]);
const dangerTableData = ref([]);
const stationTableData = ref([]);

// 灾害名称
const { disasterNames, form } = useDisasterData();

// 表格高度
const tableHeight = ref(0);

// 清除表格数据
const clearTableData = () => {
    peopleTableData.value = [];
    trafficTableData.value = [];
    dangerTableData.value = [];
    stationTableData.value = [];
};

// 查询
function query() {
    // 清除现有数据
    clearTableData();
    
    // 获取对应数据
    CarrierInformation.queryTableInfo(form.value).then((res) => {
        for(let i = 0; i < res.length; i++) {
            let item = res[i];
            item = JSON.parse(item);
            
            // 人口
            if(item.peopleDatas) {
                peopleTableData.value.push(...removeDuplicates(item.peopleDatas));
            }

            // 交通
            if(item.trafficDatas) {
                trafficTableData.value.push(...removeDuplicates(item.trafficDatas));
            }

            // 危险源
            if(item.dangerDatas) {
                dangerTableData.value.push(...removeDuplicates(item.dangerDatas));
            }

            // 地铁站
            if(item.stationDatas) {
                stationTableData.value.push(...removeDuplicates(item.stationDatas));
            }
        }
        
        // 最后对每个表格数据再进行一次整体去重
        peopleTableData.value = removeDuplicates(peopleTableData.value);
        trafficTableData.value = removeDuplicates(trafficTableData.value);
        dangerTableData.value = removeDuplicates(dangerTableData.value);
        stationTableData.value = removeDuplicates(stationTableData.value);
    });
}

// 去重函数 - 基于对象的所有值进行去重
function removeDuplicates(dataArray) {
    if (!dataArray || !Array.isArray(dataArray)) return [];
    
    const seen = new Set();
    return dataArray.filter(item => {
        // 将对象的所有值排序后拼接成字符串作为唯一标识
        const values = Object.values(item).sort().join('|');
        if (seen.has(values)) {
            return false;
        }
        seen.add(values);
        return true;
    });
}

// 计算表格高度
const calculateTableHeight = () => {
    nextTick(() => {
        const rowElements = document.querySelectorAll('.row');
        if (rowElements.length > 0) {
            const rowHeight = rowElements[0].offsetHeight;
            const headerElements = document.querySelectorAll('.header');
            if (headerElements.length > 0) {
                const headerHeight = headerElements[0].offsetHeight;
                // 计算表格高度（减去标题高度和边距）
                tableHeight.value = rowHeight - headerHeight - 20;
            }
        }
    });
};

// 调整表格大小
const handleResize = () => {
    calculateTableHeight();
};

function existData(data) {
    console.log(data)
}

onMounted(() => {
    window.addEventListener('resize', handleResize);
    calculateTableHeight();

    let timer = setInterval(() => {
        if(form.value.disasterId) {
            query();
            clearInterval(timer);
        }
    }, 100)
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
});

watch(form, (newValue, oldValue) => {
    // 避免初始加载时触发
    if (oldValue && JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
        query();
    }
}, { deep: true })
</script>

<style scoped>
.main {
    width: 100%;
    height: 100vh;
    background: url("/images/background_image.png") center center no-repeat;
    padding: 10px 0;
}

.form-container {
    width: 100%;
    height: 50px;
}

.disasters {
    margin-right: 10px;
}

.row {
    height: calc((100vh - 100px) / 2);
    overflow: hidden;
}

.table-column {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.table {
    margin: 0 1%;
    flex: 1;
    /* 表格主体背景色：灰色半透明 */
    background-color: rgba(100, 100, 100, 0.6);
}

.header {
    padding: 10px 0;
    font-weight: bold;
    color: #fff;
    text-align: center;
}

/* 表头文字样式：保持白色，与表格主体文字一致 */
*,
::v-deep .el-table .el-table__header-wrapper th{
    font-size: 1.2rem;
    color: #fff;
}

/* 表格滚动相关样式 */
::v-deep .el-table__body-wrapper {
    overflow-y: auto;
}

/* 确保表头固定（不影响样式，仅保留固定功能） */
::v-deep .fixed-header {
    position: sticky;
    top: 0;
    z-index: 10;
}

/* 表头核心样式调整：背景色改为与表格主体一致的灰色半透明 */
::v-deep .el-table__header-wrapper {
    overflow: visible !important;
}
::v-deep .el-table__header th {
    /* 表头背景色 = 表格主体背景色 */
    background-color: rgba(100, 100, 100, 0.6) !important;
    /* 清除表头默认边框重叠问题 */
    border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;
}

/* 表格行样式：透明背景，避免覆盖表格主体背景 */
::v-deep .el-table tr {
    color: #fff;
    background-color: transparent;
}

/* 表格单元格样式：白色文字，透明背景 */
::v-deep .el-table__cell {
    color: #fff;
    background-color: transparent;
}

/* 表格边框样式：统一浅白色边框，增强层次感 */
::v-deep .el-table th,
::v-deep .el-table td {
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

/* 表格hover效果：加深灰色，保持交互反馈 */
::v-deep .el-table__row:hover > td {
    background-color: rgba(130, 130, 130, 0.7) !important;
}

/* 隐藏滚动条（可选，保持界面简洁） */
::v-deep .el-table__body-wrapper::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}
::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
}
</style>