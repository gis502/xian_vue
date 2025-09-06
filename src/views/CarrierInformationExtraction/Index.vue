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
                    <div class="chart" ref="peopleChart"></div>
                </el-col>
                <el-col :span="12">
                    <div class="chart" ref="trafficChart"></div>
                </el-col>
            </el-row>
            <el-row class="row">
                <el-col :span="12">
                    <div class="chart" ref="dangerChart"></div>
                </el-col>
                <el-col :span="12">
                    <div class="chart" ref="stationChart"></div>
                </el-col>
            </el-row>
        </div>
    </div>
</template>

<script lang="js" setup name="CarrierInformationExtraction">
import { onMounted, ref, onUnmounted, watch } from "vue";
import { useDisasterData } from "../../api/hooks/useDisasterData";
import { useChart } from "../../api/hooks/useChart";

// 图表引用
const peopleChart = ref();
const trafficChart = ref();
const dangerChart = ref();
const stationChart = ref();

// 灾害名称
const { disasterNames, form } = useDisasterData();

// 图表功能
const {
    drawPopulationChart,
    drawTrafficChart,
    drawDangerChart,
    drawStationChart,
    resizeAllCharts
} = useChart(form);

// 查询
function query() {
    drawPopulationChart(peopleChart.value);
    drawTrafficChart(trafficChart.value);
    drawDangerChart(dangerChart.value);
    drawStationChart(stationChart.value);
}

// 调整图表大小
const handleResize = () => {
    resizeAllCharts();
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

.chart-container {
    width: 100%;
    height: calc(100vh - 100px);
    display: flex;
    flex-direction: column;
}

.chart {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
}
</style>
