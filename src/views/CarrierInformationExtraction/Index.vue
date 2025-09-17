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
                <el-col :span="12">
                    <div class="header">人口受影响情况</div>
                    <el-table class="table" :data="peopleTableData" style="width: 98%">
                        <el-table-column align="center" prop="hidePoint" label="隐患点名称"/>
                        <el-table-column align="center" prop="number" label="数量"/>
                    </el-table>
                </el-col>
                <el-col :span="12">
                    <div class="header">交通受影响情况</div>
                    <el-table class="table" :data="trafficTableData" style="width: 98%">
                        <el-table-column align="center" prop="name" label="道路名称"/>
                    </el-table>
                </el-col>
            </el-row>
            <el-row class="row">
                <el-col :span="12">
                    <div class="header">危险源受影响情况</div>
                    <el-table class="table" :data="dangerTableData" style="width: 98%">
                        <el-table-column align="center" prop="position" label="危险源地址" />
                    </el-table>
                </el-col>
                <el-col :span="12">
                    <div class="header">地铁站受影响情况</div>
                    <el-table class="table" :data="stationTableData" style="width: 98%">
                        <el-table-column align="center" prop="name" label="名称"/>
                        <el-table-column align="center" prop="position" label="地址" />
                    </el-table>
                </el-col>
            </el-row>
        </div>
    </div>
</template>

<script lang="js" setup name="CarrierInformationExtraction">
import { onMounted, ref, onUnmounted, watch } from "vue";
import { useDisasterData } from "../../api/hooks/useDisasterData";
import CarrierInformation from "../../api/multi_hazard_disaster_chain_risk_model/carrier_information/CarrierInformation";

// 图表引用
const peopleTableData = ref([
    {
        hidePoint: '隐患点9',
        number: 10
    }
]);
const trafficTableData = ref([
    {
        name: 'xx大道'
    }
]);
const dangerTableData = ref([
    {
        position: '长安区'
    }
]);
const stationTableData = ref([
    {
        name: '地铁站',
        position: '长安区'
    }
]);

// 灾害名称
const { disasterNames, form } = useDisasterData();

// 查询
function query() {
    // // 获取人口数据
    // CarrierInformation.getAffectedPeople(form).then((res) => {
    //     peopleTableData.value = res.data;
    // });

    // // 获取交通数据
    // CarrierInformation.getAffectedTraffic(form).then((res) => {
    //     trafficTableData.value = res.data;
    // });

    // // 获取危险源数据
    // CarrierInformation.getAffectedDanger(form).then((res) => {
    //     dangerTableData.value = res.data;
    // });
    // // 地铁站受影响数量
    // CarrierInformation.getAffectedStation(form).then((res) => {
    //     stationTableData.value = res.data;
    // });
}

// 调整图表大小
const handleResize = () => {
    
};

onMounted(() => {
    window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
});

watch(form, (newValue, oldValue) => {
    query();
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
}
.table {
    margin: 0 1%;
}
.header {
    padding: 10px 0;
    font-weight: bold;
    color: #fff;
    text-align: center;
}
*,
::v-deep .el-table .el-table__header-wrapper th{
    font-size: 1.2rem;
}
</style>
