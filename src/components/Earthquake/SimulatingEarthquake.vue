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
    <div style="padding: 10px">
      <el-row align="middle" gutter="10">
        <el-col :span="12" style="text-align: right">
          {{ showBaseInfo ? "地震信息" : "致灾因子信息" }}</el-col
        >
        <el-col :span="12">
          <el-button type="info" round @click="showBaseInfo = !showBaseInfo"
            >查看{{ showBaseInfo ? "致灾因子参数" : "基本" }}信息</el-button
          >
        </el-col>
      </el-row>
    </div>
    <div class="panel-content">
      <!-- 模拟信息 -->
      <el-form
        ref="ruleFormRef"
        :rules="rules"
        :model="form"
        label-width="auto"
        v-show="showBaseInfo"
      >
        <el-row gutter="10">
          <el-col :span="24">
            <el-form-item label="地震名称" prop="name">
              <el-input v-model="form.name"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row gutter="10">
          <el-col :span="24">
            <el-form-item label="地震全称" prop="fullName">
              <el-input v-model="form.fullName"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <el-form-item label="震中位置" prop="position">
              <el-input v-model="form.position"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row gutter="10">
          <el-col :span="12">
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
          </el-col>
          <el-col :span="12">
            <el-form-item label="震源深度" prop="depth">
              <el-input v-model="form.depth" type="number">
                <template #append>km</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row gutter="10">
          <el-col :span="12">
            <el-form-item label="纬度" prop="longitude">
              <el-input v-model="form.longitude" type="number" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="经度" prop="latitude">
              <el-input v-model="form.latitude" type="number" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row gutter="10">
          <el-col :span="12">
            <el-form-item label="时间" prop="dateTime">
              <el-date-picker
                v-model="form.dateTime"
                type="datetime"
                placeholder="选择日期时间"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="地震类型" prop="type">
              <el-select v-model="form.type">
                <el-option label="正式" value="Z"></el-option>
                <el-option label="演练" value="Y"></el-option>
                <el-option label="测试" value="T"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="10" justify="center" style="padding-bottom: 10px">
          <hr class="segmentation" />
          <el-link type="primary" @click="setMore">
            点击{{ isShowMore ? "收起" : "查看" }}，更多设置
            <el-icon v-if="!isShowMore"><ArrowDown /></el-icon>
            <el-icon v-else><ArrowUp /></el-icon>
          </el-link>
        </el-row>
        <el-row v-show="isShowMore" :gutter="10">
          <el-col :span="12">
            <el-form-item label="来源">
              <el-input v-model="form.source" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="县编码">
              <el-input v-model="form.countyCode" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-show="isShowMore" :gutter="10">
          <el-col :span="12">
            <el-form-item label="乡镇编码">
              <el-input v-model="form.townshipCode" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="区县">
              <el-input v-model="form.district" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-show="isShowMore" :gutter="10">
          <el-col :span="12">
            <el-form-item label="省份">
              <el-input v-model="form.province" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="城市">
              <el-input v-model="form.city" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="10">
          <el-col :span="12">
            <el-form-item>
              <el-button
                type="success"
                @click="confirmEarthquake(ruleFormRef)"
                style="width: 100%"
                >添加</el-button
              >
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item>
              <el-button
                type="danger"
                @click="emit('cancelEarthquake')"
                style="width: 100%"
                >取消</el-button
              >
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <!-- 致灾因子参数信息 -->
      <el-form :model="form" label-width="auto" v-show="!showBaseInfo">
        <el-form-item
          v-for="(param, index) in hazardsParams"
          :key="index"
          :label="param.attributeName"
        >
          <el-input
            v-model="hazardsForm[param.attributeNameAlias]"
            :placeholder="`请输入${param.attributeName}参数`"
          ></el-input>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup name="SimulatingEarthquake">
import { reactive } from "vue";
import { useSimulationPointStore } from "../../store/earthquake/simulation_points";
import { obtainTheProbabilityOfSimulatedPointRisk } from "../../api/earthquake/hazards";
import layers from "../../cesium/layers";
import basicLayers from "../../cesium/basicLayers";
// (hazardsParams)致灾因子后端数据（此处是模拟）
import { addDisaster, hazardsParams } from "../../api/earthquake/datas";
import { parseTime } from "../../utils/ruoyi";


// 常量
const { province, city } = {
  province: "陕西省",
  city: "西安市",
};

// 显示基本信息
let showBaseInfo = ref(true);

// 表单对象
const ruleFormRef = ref();



// 表单元素
let form = reactive({
  name: "",
  fullName: "",
  position: `${province}${city}${position.name ? position.name : ""}`,
  magnitude: 6,
  depth: 0,
  longitude: parseFloat(position.longitude.toFixed(4)),
  latitude: parseFloat(position.latitude.toFixed(4)),
  dateTime: "",
  type: "",

  // 下面数据非必须数据
  source: "",
  countyCode: "",
  townshipCode: "",
  district: position.name,
  province: province,
  city: city,
});

// 致灾因子参数
let hazardsForm = reactive({
  elevation: 0,
  slope: 0,
  rockType: 0,
  breakDistance: 0,
  landUseType: 0,
  waterDistance: 0,
  rainfall: 0,
  vegetationCoverage: 0,
  slopeCurvature: 0,
  soilSandDegree: 0,
  slopeType: 0,
});

// 验证规则
const rules = reactive({
  name: [
    {
      required: true,
      message: "地震名称不能为空",
      trigger: "blur",
    },
  ],
  fullName: [
    {
      required: true,
      message: "地震全称不能为空",
      trigger: "blur",
    },
  ],
  position: [
    {
      required: true,
      message: "震中位置不能为空",
      trigger: "blur",
    },
  ],
  magnitude: [
    {
      required: true,
      message: "震级不能为空",
      trigger: "blur",
    },
  ],
  longitude: [
    {
      required: true,
      message: "震级不能为空",
      trigger: "blur",
    },
  ],
  depth: [
    {
      required: true,
      message: "震源深度不能为空",
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
  type: [
    {
      required: true,
      message: "地震类型不能为空",
      trigger: "blur",
    },
  ],
});

// 显示弹窗
let isShow = ref(true);

// 是否显示设置更多
let isShowMore = ref(false);

// 获取位置以及表格中要呈现的内容
const { position, dataTypes, chartDatas } = defineProps([
  "position",
  "dataTypes",
  "chartDatas",
]);

// 接收传递的方法
const emit = defineEmits([
  "cancelEarthquake",
  "displayTable",
  "hideTable",
  "displayChart",
  "hideChart",
  "startLoading",
  "stopLoading",
]);

// 添加模拟
function confirmEarthquake(formEl) {
  if (!formEl) return;
  // 验证
  formEl.validate(async (valid, fields) => {
    if (valid) {
      // 隐藏显示
      emit("hideTable");
      emit("hideChart");

      // 显示加载
      emit("startLoading");

      // 添加记录到灾害列表中
      form.dateTime = parseTime(form.dateTime); // 修改日期格式
      // addDisaster(form);

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
      // console.log("--------------------------------------------------------------")
      layers.DrawEllipse(position.longitude, position.latitude, form.magnitude);

      // 处理各个模拟点
      let inEllipsePoints = layers.getAllHiddeninEllipse(position.longitude, position.latitude, form.magnitude);
      console.log("inEllipsePoints",inEllipsePoints);
      // 获取各个点的风险概率
      const [points, probabilityPoints] =
        await obtainTheProbabilityOfSimulatedPointRisk(inEllipsePoints);
      console.log(points, probabilityPoints,"points, probabilityPoints")
      layers.flashHiddenDisasterPoints(inEllipsePoints)
      // console.log(898989898989,inEllipsePoints)
      // 处理表格和chart数据
      addDatasToTableAndChart(inEllipsePoints);

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
  // console.log("+++++++++++++++++++++++++++")
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

// 设置更多信息
function setMore() {
  isShowMore.value = !isShowMore.value;
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
  width: 500px;
  max-height: 400px;
  overflow-y: auto;
}
.panel-title {
  text-align: center;
  padding-bottom: 10px;
}

::v-deep .el-form-item__label {
  color: #fff;
}

.segmentation {
  border: 0;
  border-bottom: 1px solid gray;
  width: 100%;
}
</style>
