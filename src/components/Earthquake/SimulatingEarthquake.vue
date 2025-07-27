<!-- 模拟地震 -->
<template>
  <!-- 收集内容 -->
  <div
    v-show="isShow"
    class="earthquake-info-panel"
    :style="{
      top: position.y + 'px',
      left: position.x + 'px',
    }"
  >
    <div class="panel-title">地震信息</div>
    <div class="panel-content">
      <el-form
        ref="ruleFormRef"
        :rules="rules"
        :model="form"
        label-width="auto"
      >
        <el-form-item label="震级" prop="magnitude">
          <el-input
            v-model="form.magnitude"
            type="number"
            min="0"
            max="10"
            step="0.1"
          >
            <template #append>Ms</template>
          </el-input>
        </el-form-item>
        <el-form-item label="纬度" prop="longitude">
          <el-input v-model="form.longitude" type="number" />
        </el-form-item>
        <el-form-item label="经度" prop="latitude">
          <el-input v-model="form.latitude" type="number" />
        </el-form-item>
        <el-form-item label="时间" prop="dateTime">
          <el-date-picker
            v-model="form.dateTime"
            type="datetime"
            placeholder="选择日期时间"
          />
        </el-form-item>
        <el-form-item>
          <el-row :gutter="10" style="width: 100%">
            <el-col :span="12">
              <el-button
                type="success"
                @click="confirmEarthquake(ruleFormRef)"
                style="width: 100%"
                >确认添加</el-button
              >
            </el-col>
            <el-col :span="12">
              <el-button
                type="danger"
                @click="emit('cancelEarthquake')"
                style="width: 100%"
                >取消</el-button
              >
            </el-col>
          </el-row>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup name="SimulatingEarthquake">
import { onBeforeMount, reactive } from "vue";
import { useSimulationPointStore } from "../../store/earthquake/simulation_points";
import { obtainTheProbabilityOfSimulatedPointRisk } from "../../api/earthquake/hazards";
import layers from "../../cesium/layers";
import { pulseUtils } from "../../cesium/pulse";
import basicLayers from "../../cesium/basicLayers";

// 表单对象
const ruleFormRef = ref();

// 表单元素
let form = reactive({
  magnitude: 6,
  longitude: parseFloat(position.longitude.toFixed(4)),
  latitude: parseFloat(position.latitude.toFixed(4)),
  dateTime: "",
});

// 验证规则
const rules = reactive({
  magnitude: [{ required: true, message: "震级不能为空", trigger: "blur" }],
  longitude: [
    {
      required: true,
      message: "纬度不能为空",
      trigger: "blur",
    },
  ],
  latitude: [
    {
      required: true,
      message: "经度不能为空",
      trigger: "blur",
    },
  ],
  dateTime: [
    {
      type: "date",
      required: true,
      message: "请选择日期事件",
      trigger: "blur",
    },
  ],
});

// 显示弹窗
let isShow = ref(true);

// 获取位置以及表格中要呈现的内容
const { position, dataTypes, chartDatas } = defineProps([
  "position",
  "dataTypes",
  "chartDatas",
]);
const emit = defineEmits([
  "cancelEarthquake",
  "displayTable",
  "hideTable",
  "displayChart",
  "hideChart",
  "startLoading",
  "stopLoading",
]);

onBeforeMount(() => {
  // 隐藏显示
  emit("hideTable");
  emit("hideChart");
});

// 添加模拟
async function confirmEarthquake(formEl) {
  if (!formEl) return;
  // 验证
  await formEl.validate(async (valid, fields) => {
    if (valid) {
      // 显示加载
      emit("startLoading");

      // 隐藏弹窗
      isShow.value = false;

      // 删除原本地震中心
      basicLayers.removeCenterPoint("earthquakeCenter");

      // 修改位置经纬度
      position.longitude = parseFloat(form.longitude);
      position.latitude = parseFloat(form.latitude);

      // 添加地震中心位置
      basicLayers.addCenterPoint({
        id: "earthquakeCenter",
        disasterName: "",
        trigger: "",
        longitude: position.longitude,
        latitude: position.latitude,
      });

      layers.DrawEllipse(position.longitude, position.latitude, form.magnitude);

      // 处理各个模拟点
      let inEllipsePoints = [];
      // 椭圆信息
      const semiMinor = layers.calculateEllipseParams(form.magnitude).at(-1);
      // 偏转角度
      const rotation = layers.calculateRotation(
        position.longitude,
        position.latitude
      );
      useSimulationPointStore().simulationPoints.forEach((item) => {
        // 将模拟点的预测值全部清空，重新获取
        item.predict = null;

        // 判断在不在震圈内
        if (
          layers.isPointInEllipse(
            item.geologicalDisasterHideDTO.lon,
            item.geologicalDisasterHideDTO.lat,
            position.longitude,
            position.latitude,
            semiMinor.semiMajorAxis,
            semiMinor.semiMinorAxis,
            rotation,
          )
        ) {
          inEllipsePoints.push(item);
        }
      });

      // 获取各个点的风险概率
      const [points, probabilityPoints] =
        await obtainTheProbabilityOfSimulatedPointRisk(inEllipsePoints);

      // 清除全部脉冲实体
      pulseUtils.removePulseEntity(useSimulationPointStore(), window.viewer);

      // 添加脉冲实体
      pulseUtils.createPause(points, useSimulationPointStore(), window.viewer);

      // 处理表格和chart数据
      addDatasToTableAndChart(probabilityPoints);

      // 显示表格和chart
      emit("displayTable");
      emit("displayChart");

      // 注销模拟
      emit("cancelEarthquake");

      // 停止加载
      emit("stopLoading");
    } else {
      console.log("error submit!", fields);
    }
  });
}

// 处理表格和chart数据
function addDatasToTableAndChart(probabilityPoints) {
  // 清空表格数据
  dataTypes.type1.data = [];
  dataTypes.type2.data = [];
  dataTypes.type3.data = [];

  // 设置chart数据初始为0
  chartDatas.seriesDatas = [0, 0, 0];

  // 风险区数据，滑坡数据，泥石流数据
  probabilityPoints.forEach((item) => {
    switch (item.geologicalDisasterHideDTO.disasterType) {
      case "滑坡":
        dataTypes.type1.data.push({
          field1: item.geologicalDisasterHideDTO.disasterName,
          field2: item.geologicalDisasterHideDTO.position,
          field3: item.geologicalDisasterHideDTO.scaleGrade,
          field4: item.geologicalDisasterHideDTO.riskGrade,
          field5: item.geologicalDisasterHideDTO.lon,
          field6: item.geologicalDisasterHideDTO.lat,
        });
        chartDatas.seriesDatas[0]++;
        break;
      case "泥石流":
        dataTypes.type2.data.push({
          field1: item.geologicalDisasterHideDTO.disasterName,
          field2: item.geologicalDisasterHideDTO.position,
          field3: item.geologicalDisasterHideDTO.scaleGrade,
          field4: item.geologicalDisasterHideDTO.riskGrade,
          field5: item.geologicalDisasterHideDTO.lon,
          field6: item.geologicalDisasterHideDTO.lat,
        });
        chartDatas.seriesDatas[1]++;
        break;
      default:
        dataTypes.type3.data.push({
          field1: item.geologicalDisasterHideDTO.disasterName,
          field2: item.geologicalDisasterHideDTO.position,
          field3: item.geologicalDisasterHideDTO.inspectorName,
          field4: item.geologicalDisasterHideDTO.inspectorTele,
          field5: item.geologicalDisasterHideDTO.lon,
          field6: item.geologicalDisasterHideDTO.lat,
        });
        chartDatas.seriesDatas[2]++;
    }
  });
}
</script>

<style scoped>
.earthquake-info-panel {
  position: absolute;
  background-color: rgba(40, 40, 40, 0.9);
  color: white;
  padding: 15px;
  border-radius: 4px;
  z-index: 1000;
  width: 250px;
}
.panel-title {
  text-align: center;
  padding-bottom: 10px;
}
</style>
