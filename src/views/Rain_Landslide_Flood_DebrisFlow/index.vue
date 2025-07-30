<template>
  <div class="cesium-container" ref="cesiumContainer"
       v-loading="loadingModel"
       :element-loading-spinner="svg"
       element-loading-svg-view-box="-10, -10, 50, 50"
       element-loading-background="rgba(122, 122, 122, 0.8)">
    <!-- 功能按钮 -->
    <div class="controls">
      <div class="btn-group">
        <div class="rain-btn" @click="toggleRainMode">
          {{ rainMode ? '取消暴雨标记' : '标记暴雨点' }}
        </div>
        <div class="weather-btn" @click="toggleWeatherEffect" :class="{ 'disabled': rainMode }">
          {{ weatherActive ? '停止降雨' : '模拟降雨' }}
        </div>
        <div class="admin-btn" @click="toggleAdminLayer">
          {{ showAdminLayer ? '隐藏行政区划' : '显示行政区划' }}
        </div>
        <div class="table-btn" @click="toggleTablePanel">
          {{ showRiskTable ? '信息隐藏' : '信息展示' }}
        </div>
      </div>
    </div>
    <!-- 加载状态提示 -->
    <div v-if="isLoading" class="loading-indicator">
      {{ loadingText }}
    </div>
    <!-- 风险区表格 - 固定在左下角 -->
    <div v-if="showRiskTable" class="risk-table-container">
      <div class="table-header">
        <span class="title-text">{{ currentTableConfig.title }}</span>
        <el-select
            class="title-text"
            v-model="selectedTableType"
            placeholder="请选择筛选条件"
            style="width: 200px;"
            @change="handleTableTypeChange">
          <el-option
              v-for="item in tableTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
          ></el-option>
        </el-select>
      </div>
      <div class="rf_table">
        <el-table
            :data="displayData"
            border
            style="width: 100%; transition: width 0.3s ease;"
            height="320"
            highlight-current-row
            @row-click="handleRowClick">
          <el-table-column
              v-for="column in currentTableConfig.columns"
              :key="column.prop"
              :prop="column.prop"
              :label="column.label"
              :width="column.width"
              :align="column.align || 'center'"
              :show-overflow-tooltip="column.showOverflowTooltip || false"
          ></el-table-column>
        </el-table>
        <div class="table-pagination">
          <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[ 10, 20, 50]"
              layout="total, sizes, prev, pager, next"
              :total="total"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>
    <!--表格-->
    <Chart v-if="showChart" :chartDatas="chartDatas"></Chart>
    <!-- 暴雨信息面板 -->
    <div v-if="showInfoPanel" class="rain-info-panel">
      <div class="panel-title">暴雨信息</div>
      <div class="panel-content">
        <div class="form-item">
          <label class="jiangyuliang">降雨量:</label>
          <input v-model.number="rainfall" type="number" min="0" max="500" step="1"/>
          <span>毫米</span>
        </div>
        <div class="form-item">
          <label>持续时间:</label>
          <input v-model.number="duration" type="number" min="0" max="72" step="1"/>
          <span>小时</span>
        </div>
        <div class="button-group">
          <button @click="confirmRainPoint" :disabled="!rainfall || !duration" style="width: 80px">确认添加</button>
          <button @click="cancelRainPoint" style="width: 80px">取消</button>
        </div>
      </div>
    </div>
    <!-- 自定义弹出面板 -->
    <div class="disaster-popup" v-if="selectedEntityData"
         :style="{
    left: `${calculatePopupLeft()}px`,
    top: `${calculatePopupTop()}px`,
    display: popupVisible ? 'block' : 'none',
    opacity: popupVisible ? '1' : '0',
    transform: popupVisible ? 'scale(1)' : 'scale(0.5)'}" @click.stop="stopPropagation">
      <div class="popup-header">
        <h3 v-if="selectedEntityData.geologicalDisasterHideDTO.disasterName">
          {{
            selectedEntityData.geologicalDisasterHideDTO.disasterName || '地质灾害风险区'
          }}
        </h3>
        <button @click="toggleHazardFactorView" class="view-btn">
          {{ isHazardFactorView ? '返回基本信息' : '查看致灾因子' }}
        </button>
        <button @click="closePopup"> 关闭</button>
      </div>
      <div class="popup-content">
        <!--隐患点基本信息-->
        <el-form label-width="100px" :model="selectedEntityData.geologicalDisasterHideDTO">
          <template v-if="!isHazardFactorView">
            <el-form-item label="灾害类型" v-if="selectedEntityData.geologicalDisasterHideDTO.disasterType">
              <el-input v-model="selectedEntityData.geologicalDisasterHideDTO.disasterType"></el-input>
            </el-form-item>

            <el-form-item label="统一编号" v-if="selectedEntityData.geologicalDisasterHideDTO.unitCode">
              <el-input v-model="selectedEntityData.geologicalDisasterHideDTO.unitCode"></el-input>
            </el-form-item>

            <el-form-item label="野外编号" v-if="selectedEntityData.geologicalDisasterHideDTO.fieldCode">
              <el-input v-model="selectedEntityData.geologicalDisasterHideDTO.fieldCode"></el-input>
            </el-form-item>

            <el-form-item label="风险区名称" v-if="selectedEntityData.geologicalDisasterHideDTO.disasterName">
              <el-input v-model="selectedEntityData.geologicalDisasterHideDTO.disasterName"></el-input>
            </el-form-item>

            <el-form-item label="野外编号" v-if="selectedEntityData.geologicalDisasterHideDTO.fieldCode">
              <el-input v-model="selectedEntityData.geologicalDisasterHideDTO.fieldCode"></el-input>
            </el-form-item>

            <el-form-item label="地理位置" v-if="selectedEntityData.geologicalDisasterHideDTO.position">
              <el-input v-model="selectedEntityData.geologicalDisasterHideDTO.position"></el-input>
            </el-form-item>

            <el-form-item label="东经" v-if="selectedEntityData.geologicalDisasterHideDTO.lon">
              <el-input v-model="selectedEntityData.geologicalDisasterHideDTO.lon"></el-input>
            </el-form-item>

            <el-form-item label="北纬" v-if="selectedEntityData.geologicalDisasterHideDTO.lat">
              <el-input v-model="selectedEntityData.geologicalDisasterHideDTO.lat"></el-input>
            </el-form-item>

            <el-form-item label="居民户数" v-if="selectedEntityData.geologicalDisasterHideDTO.residentCounts">
              <el-input v-model="selectedEntityData.geologicalDisasterHideDTO.residentCounts"></el-input>
            </el-form-item>

            <el-form-item label="户籍人口" v-if="selectedEntityData.geologicalDisasterHideDTO.addressPopulation">
              <el-input v-model="selectedEntityData.geologicalDisasterHideDTO.addressPopulation"></el-input>
            </el-form-item>

            <el-form-item label="威胁财产" v-if="selectedEntityData.geologicalDisasterHideDTO.riskProperty">
              <el-input v-model="selectedEntityData.geologicalDisasterHideDTO.riskProperty"></el-input>
            </el-form-item>

            <el-form-item label="常住人口" v-if="selectedEntityData.geologicalDisasterHideDTO.permanentPopulation">
              <el-input v-model="selectedEntityData.geologicalDisasterHideDTO.permanentPopulation"></el-input>
            </el-form-item>

            <el-form-item label="住房" v-if="selectedEntityData.geologicalDisasterHideDTO.housing">
              <el-input v-model="selectedEntityData.geologicalDisasterHideDTO.housing"></el-input>
            </el-form-item>

            <el-form-item label="规模等级" v-if="selectedEntityData.geologicalDisasterHideDTO.scaleGrade">
              <el-input v-model="selectedEntityData.geologicalDisasterHideDTO.scaleGrade"></el-input>
            </el-form-item>

            <el-form-item label="风险等级" v-if="selectedEntityData.geologicalDisasterHideDTO.riskGrade">
              <el-input v-model="selectedEntityData.geologicalDisasterHideDTO.riskGrade"></el-input>
            </el-form-item>

            <el-form-item label="巡查员" v-if="selectedEntityData.geologicalDisasterHideDTO.inspectorName">
              <el-input v-model="selectedEntityData.geologicalDisasterHideDTO.inspectorName"></el-input>
            </el-form-item>

            <el-form-item label="手机号" v-if="selectedEntityData.geologicalDisasterHideDTO.inspectorTele">
              <el-input v-model="selectedEntityData.geologicalDisasterHideDTO.inspectorTele"></el-input>
            </el-form-item>
          </template>
        </el-form>
        <!--致灾因子-->
        <el-form label-width="100px" :model="selectedEntityData.factorVoList">
          <template v-if="isHazardFactorView">
            <div class="probability-level">
              <div v-if="selectedEntityData.predict.level"> 危险程度：{{ selectedEntityData.predict.level }}</div>
              <div v-if="selectedEntityData.predict.probability"> 发生概率：
                {{ (selectedEntityData.predict.probability * 100).toFixed(2) }}%
              </div>
            </div>
            <!--坡型-->
            <el-form-item :label="selectedEntityData.factorVoList.slopeType?.attributeName"
                          v-if="selectedEntityData.factorVoList.slopeType?.attributeName">
              <div class="input-with-unit">
                <el-select v-model="selectedEntityData.factorVoList.slopeType.factorValue" placeholder="请选择">
                  <el-option
                      v-for="item in factorOptions.slope"
                      :key="item"
                      :value="item">
                  </el-option>
                </el-select>
                <span class="unit">{{ selectedEntityData.factorVoList.slopeType.unit }}</span>
              </div>
            </el-form-item>
            <!--坡度-->
            <el-form-item :label="selectedEntityData.factorVoList.slope?.attributeName"
                          v-if="selectedEntityData.factorVoList.slope?.attributeName">
              <div class="input-with-unit">
                <el-input v-model="selectedEntityData.factorVoList.slope.factorValue"/>
                <span class="unit">{{ selectedEntityData.factorVoList.slope.unit }}</span>
              </div>
            </el-form-item>
            <!--高程-->
            <el-form-item :label="selectedEntityData.factorVoList.elevation?.attributeName"
                          v-if="selectedEntityData.factorVoList.elevation?.attributeName">
              <div class="input-with-unit">
                <el-input v-model="selectedEntityData.factorVoList.elevation.factorValue"/>
                <span class="unit">{{ selectedEntityData.factorVoList.elevation.unit }}</span>
              </div>
            </el-form-item>
            <!--降雨量-->
            <el-form-item :label="selectedEntityData.factorVoList.rainfall?.attributeName"
                          v-if="selectedEntityData.factorVoList.rainfall?.attributeName">
              <div class="input-with-unit">
                <el-input v-model="selectedEntityData.factorVoList.rainfall.factorValue"/>
                <span class="unit">{{ selectedEntityData.factorVoList.rainfall.unit }}</span>
              </div>
            </el-form-item>
            <!--坡面曲率-->
            <el-form-item :label="selectedEntityData.factorVoList.slopeCurvature?.attributeName"
                          v-if="selectedEntityData.factorVoList.slopeCurvature?.attributeName">
              <div class="input-with-unit">
                <el-input v-model="selectedEntityData.factorVoList.slopeCurvature.factorValue"/>
                <span class="unit">{{ selectedEntityData.factorVoList.slopeCurvature.unit }}</span>
              </div>
            </el-form-item>
            <!--水系距离-->
            <el-form-item :label="selectedEntityData.factorVoList.waterDistance?.attributeName"
                          v-if="selectedEntityData.factorVoList.waterDistance?.attributeName">
              <div class="input-with-unit">
                <el-input v-model="selectedEntityData.factorVoList.waterDistance.factorValue"/>
                <span class="unit">{{ selectedEntityData.factorVoList.waterDistance.unit }}</span>
              </div>
            </el-form-item>
            <!--断层距离-->
            <el-form-item v-show="false" :label="selectedEntityData.factorVoList.breakDistance?.attributeName"
                          v-if="selectedEntityData.factorVoList.breakDistance?.attributeName">
              <div class="input-with-unit">
                <el-input v-model="selectedEntityData.factorVoList.breakDistance.factorValue"/>
                <span class="unit">{{ selectedEntityData.factorVoList.breakDistance.unit }}</span>
              </div>
            </el-form-item>
            <!--岩土类型-->
            <el-form-item :label="selectedEntityData.factorVoList.rockType?.attributeName"
                          v-if="selectedEntityData.factorVoList.rockType?.attributeName">
              <div class="input-with-unit">
                <el-select v-model="selectedEntityData.factorVoList.rockType.factorValue" placeholder="请选择"
                           style="width: 100%;">
                  <el-option
                      v-for="item in factorOptions.rock"
                      :key="item"
                      :value="item">
                  </el-option>
                </el-select>
                <span class="unit">{{ selectedEntityData.factorVoList.rockType.unit }}</span>
              </div>
            </el-form-item>
            <!--土壤沙利度-->
            <el-form-item :label="selectedEntityData.factorVoList.soilSandDegree?.attributeName"
                          v-if="selectedEntityData.factorVoList.soilSandDegree?.attributeName">
              <div class="input-with-unit">
                <el-input v-model="selectedEntityData.factorVoList.soilSandDegree.factorValue"/>
                <span class="unit">{{ selectedEntityData.factorVoList.soilSandDegree.unit }}</span>
              </div>
            </el-form-item>
            <!--植被覆盖率-->
            <el-form-item :label="selectedEntityData.factorVoList.vegetationCoverage?.attributeName"
                          v-if="selectedEntityData.factorVoList.vegetationCoverage?.attributeName">
              <div class="input-with-unit">
                <el-input v-model="selectedEntityData.factorVoList.vegetationCoverage.factorValue"/>
                <span class="unit">{{ selectedEntityData.factorVoList.vegetationCoverage.unit }}</span>
              </div>
            </el-form-item>
            <!--土地利用类型-->
            <el-form-item :label="selectedEntityData.factorVoList.landUseType?.attributeName"
                          v-if="selectedEntityData.factorVoList.landUseType?.attributeName">
              <div class="input-with-unit">
                <el-select v-model="selectedEntityData.factorVoList.landUseType.factorValue" placeholder="请选择">
                  <el-option
                      v-for="item in factorOptions.landUse"
                      :key="item"
                      :value="item">
                  </el-option>
                </el-select>
                <span class="unit">{{ selectedEntityData.factorVoList.landUseType.unit }}</span>
              </div>
            </el-form-item>
          </template>
          <!-- 修改按钮 -->
          <el-form-item>
            <el-button type="primary" @click="submitFactorChanges">修改</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
    <!-- 图例面板 -->
    <div class="legend-panel">
      <div class="legend-title">图例</div>
      <div class="legend-content" ref="legendContent">
        <!-- 区县图例将通过JS动态生成 -->
        <div class="legend-item">
          <div class="legend-color" style="background-color: rgba(255,0,0,0.5); border: 1px solid #f00;"></div>
          <div class="legend-text">降雨区域</div>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import * as Cesium from 'cesium';
// 引入西安行政区划数据
import BaQiaoArea from '@/assets/static/area/BaQiao.json';
import BeiLin from '@/assets/static/area/BeiLin.json';
import ChangAn from '@/assets/static/area/ChangAn.json';
import GaoLing from '@/assets/static/area/GaoLing.json';
import HuYi from '@/assets/static/area/HuYi.json';
import LanTIan from '@/assets/static/area/LanTIan.json';
import LianHu from '@/assets/static/area/LianHu.json';
import LinTong from '@/assets/static/area/LinTong.json';
import WeiYang from '@/assets/static/area/WeiYang.json';
import XinCheng from '@/assets/static/area/XinCheng.json';
import YanLiang from '@/assets/static/area/YanLiang.json';
import YanTa from '@/assets/static/area/YanTa.json';
import ZhouZhi from '@/assets/static/area/ZhouZhi.json';
// 河流、湖面数据
import riverData from '@/assets/static/json/river.json';
import lakeData from '@/assets/static/json/lake.json';
// 引入滑坡，泥石流灾害点数据
import landslide_surface01 from '@/assets/images/landslide_surface01.jpg'
import landslide from '@/assets/landslide/landslide.json'
import {initCesium} from '@/cesium/initLayer.js'
// 图例
import riskArea from '@/assets/images/riskArea.png'
import debrisFlowIcon from '@/assets/images/DebrisFlow.png'
import landslideIcon from '@/assets/images/landslide.png'
// api
import {
  getGeologicalDisasterHideByLandSlideList,
  getGeologicalDisasterHideByFlowList
} from '@/api/system/disasterHide.js'
import {
  getGeologicalDisasterRiskList
} from '@/api/system/disasterRisk.js'
import {
  getFactorValueList
} from '@/api/system/factorValues.js'
import {
  rainSlideTrigger,
  rainSlideFactorUpdata
} from '@/api/system/rainModel.js'
import Chart from "../../components/Earthquake/Chart.vue";
import {reactive} from "vue";

export default {
  name: 'CesiumFlowMap',
  components: {Chart},
  data() {
    return {
      viewer: null,
      tdtToken: "7f013d0186775b063d6a046977bbefc6",
      currentMapType: 0,
      rainMode: false,
      showInfoPanel: false,
      selectedPosition: null,
      rainfall: 150,
      duration: 2,
      rainPoints: [],
      weatherActive: false,
      showAdminLayer: true,
      rainEffect: null,
      adminDataSource: null,
      riverDataSource: null,
      lakeDataSource: null, // 湖面数据数据源
      dataSource: null,
      disasterDataSource: null, // 灾害点数据源
      administrationData: [BaQiaoArea, BeiLin, ChangAn, GaoLing, HuYi, LanTIan, LianHu, LinTong, WeiYang, XinCheng, YanLiang, YanTa, ZhouZhi],      // 行政区划数据
      adminDataSources: [],
      faultZoneList: [],
      // 河流数据
      riverData: riverData,
      lakeData: lakeData,
      // 灾害点数据
      HuapoData: [],
      NishiliuData: [],
      // faultZone: faultZone,
      DangerAreaData: [],
      isLoading: false,
      loadingText: '加载数据中...',
      // 暴雨影响区域椭圆相关配置
      rainEllipseScale: 100, // 降雨量到椭圆半径的缩放系数
      rainEllipseRotation: 70, // 椭圆默认旋转角度
      districtColors: {}, // 存储各区县的颜色(图例)
      showDisasterLayer: true, // 控制灾害点显示/隐藏
      disasterStyleConfig: {
        '滑坡': {
          color: Cesium.Color.RED,
          pixelSize: 10,
          label: {
            text: '滑坡滑坡滑坡',
            font: '16px monospace',
            fillColor: Cesium.Color.RED,
            backgroundColor: Cesium.Color.WHITE.withAlpha(0.7),
            backgroundPadding: new Cesium.Cartesian2(5, 5),
            scale: 1.2
          }
        },
        '泥石流': {
          color: Cesium.Color.ORANGE,
          pixelSize: 10,
          label: {
            text: '泥石流泥石流',
            font: '16px monospace',
            fillColor: Cesium.Color.YELLOW,
            backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
            backgroundPadding: new Cesium.Cartesian2(5, 5),
            scale: 1.2
          }
        }
      },
      clickHandler: null,
      landslidePoints: [],     // 滑坡点
      debrisFlowPoints: [],    // 泥石流点
      secondaryRiskPoints: [], // 次生灾害风险点
      selectedEntityData: null,
      popupPosition: {x: 0, y: 0},
      popupVisible: false,
      lastPickedEntity: null,
      showRiskTable: false,
      currentPage: 1,
      pageSize: 10,
      total: 0,
      loading: false,
      tableData: [],
      isExpanded: false, // 表格扩展状态，true为扩展，false为收缩
      isHazardFactorView: false,
      geologicalDisasterHideDTO: {
        disasterType: null,
        unitCode: null,
        fieldCode: null,
        disasterName: null,
        position: null,
        lon: null,
        lat: null,
        residentCounts: null,
        addressPopulation: null,
        riskProperty: '',
        permanentPopulation: null,
        housing: null,
        scaleGrade: null,
        riskGrade: null,
        inspectorName: null,
        inspectorTele: null,
      },
      factorVoList: {
        attributeId: [],
        valueIds: [],
        breakDistance: {
          attributeName: null,
          factorValue: null,
          unit: null,
        },
        elevation: {
          attributeName: null,
          factorValue: null,
          unit: null,
        },
        hideId: null,
        landUseType: {
          attributeName: null,
          factorValue: null,
          unit: null,
        },
        rainfall: {
          attributeName: null,
          factorValue: null,
          unit: null,
        },
        rockType: {
          attributeName: null,
          factorValue: null,
          unit: null,
        },
        slope: {
          attributeName: null,
          factorValue: null,
          unit: null,
        },
        slopeCurvature: {
          attributeName: null,
          factorValue: null,
          unit: null,
        },
        slopeType: {
          attributeName: null,
          factorValue: null,
          unit: null,
        },
        soilSandDegree: {
          attributeName: null,
          factorValue: null,
          unit: null,
        },
        vegetationCoverage: {
          attributeName: null,
          factorValue: null,
          unit: null,
        },
        waterDistance: {
          attributeName: null,
          factorValue: null,
          unit: null,
        },
      },
      factorOptions: { // 致灾因子可选下拉框
        rock: null,
        slope: null,
        landUse: null,
      },
      predict: {
        level: null,
        probability: null
      },
      formatAnalyzedData: null,
      formatUpdateAnalyzedData: null,
      formatUpdateAnalyzedDataList: null,
      attributeMap: [
        {
          hideId: 60,
          attributeId: 1,
          valueId: 122,
          attributeName: "高程",
          factorValue: "1022",
        },
        {
          hideId: 60,
          attributeId: 2,
          valueId: 123,
          attributeName: "坡度",
          factorValue: "21",
          unit: "度",
          attributeNameAlias: "slope"
        },
        {
          hideId: 60,
          attributeId: 3,
          valueId: 124,
          attributeName: "岩土类型",
          factorValue: "碎石土",
          unit: "",
          attributeNameAlias: "rockType"
        },
        {
          hideId: 60,
          attributeId: 4,
          valueId: 125,
          attributeName: "断层距离",
          factorValue: "800",
          unit: "米",
          attributeNameAlias: "breakDistance"
        },
        {
          hideId: 60,
          attributeId: 5,
          valueId: 126,
          attributeName: "土地利用类型",
          factorValue: "林地",
          unit: "",
          attributeNameAlias: "landUseType"
        },
        {
          hideId: 60,
          attributeId: 6,
          valueId: 127,
          attributeName: "水系距离",
          factorValue: "120",
          unit: "米",
          attributeNameAlias: "waterDistance"
        },
        {
          hideId: 60,
          attributeId: 7,
          valueId: 128,
          attributeName: "降雨量",
          factorValue: "820",
          unit: "mm",
          attributeNameAlias: "rainfall"
        },
        {
          hideId: 60,
          attributeId: 8,
          valueId: 129,
          attributeName: "植被覆盖率",
          factorValue: "60",
          unit: "%",
          attributeNameAlias: "vegetationCoverage"
        },
        {
          hideId: 60,
          attributeId: 9,
          valueId: 130,
          attributeName: "坡面曲率",
          factorValue: "3",
          unit: "%",
          attributeNameAlias: "slopeCurvature"
        },
        {
          hideId: 60,
          attributeId: 10,
          valueId: 131,
          attributeName: "坡型",
          factorValue: "阶梯",
          unit: "",
          attributeNameAlias: "slopeType"
        },
        {
          hideId: 60,
          attributeId: 11,
          valueId: 132,
          attributeName: "土壤沙砾度",
          factorValue: "30",
          unit: "%",
          attributeNameAlias: "soilSandDegree"
        }
        // 后期新增类型时，直接在这里添加映射关系即可
      ],
      flashEntities: [],
      // 新增：标记界面是否已关闭
      isClosed: false,
      // 新增：存储所有定时器ID
      timers: [],
      loadingModel: false,
      tableTypeOptions: [
        {label: '灾害风险区域', value: 'risk'},
        {label: '滑坡隐患点', value: 'slide'},
        {label: '泥石流隐患点', value: 'flow'}
      ],
      selectedTableType: 'risk',
      // 表格配置
      tableConfigs: {
        risk: {
          title: '地质灾害风险区列表',
          columns: [
            {prop: 'disasterName', label: '风险区名称', showOverflowTooltip: true},
            {prop: 'position', label: '地理位置', width: 150, showOverflowTooltip: true},
            {prop: 'inspectorName', label: '巡查员', width: 70},
            {prop: 'inspectorTele', label: '巡查人手机号', width: 115}
          ]
        },
        slide: {
          title: '滑坡隐患点列表',
          columns: [
            {prop: 'disasterName', label: '滑坡名称', showOverflowTooltip: true},
            {prop: 'position', label: '地理位置', width: 150, showOverflowTooltip: true},
            {prop: 'scaleGrade', label: '规模等级', width: 100},
            {prop: 'riskGrade', label: '险情等级', width: 100},
          ]
        },
        flow: {
          title: '泥石流隐患点列表',
          columns: [
            {prop: 'disasterName', label: '泥石流名称', showOverflowTooltip: true},
            {prop: 'position', label: '地理位置', width: 150, showOverflowTooltip: true},
            {prop: 'scaleGrade', label: '规模等级', width: 100},
            {prop: 'riskGrade', label: '险情等级', width: 100},
          ]
        }
      },
      // 当前表格配置
      currentTableConfig: {},
      allData: {
        risk: [],    // 风险区数据
        slide: [],  // 滑坡隐患点数据
        flow: [] // 泥石流隐患点数据
      },
      showChart: false,
      chartDatas: {
        title: "暴雨灾害链",
        xAxis: {
          data: ["滑坡影响", "泥石流影响", "风险区影响"],
        },
        seriesDatas: [0, 0, 0],
      }
    }
  },
  computed: {
    displayData() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.tableData.slice(start, end);
    }
  },
  mounted() {
    this.load();
    this.loadAdminData(); // 加载行政区划数据
    this.loadRiverData(); // 加载河流数据
    this.loadLakeData(); // 加载湖面数据
    this.loadDisasterData(); // 加载灾害点数据
    // this.loadLandSlide(landslide); // 加载滑坡点区域
    this.createLegend(); // 创建图例
    this.total = this.tableData.length;
    this.loadData();
  },
  beforeDestroy() {
    if (!this.isClosed) {
      this.releaseAllResources();
    }
    if (this.viewer) {
      this.viewer.destroy();
      this.viewer = null;
    }
    if (this.adminDataSource) {
      this.viewer.dataSources.remove(this.adminDataSource);
      this.adminDataSource = null;
    }
    if (this.riverDataSource) {
      this.viewer.dataSources.remove(this.riverDataSource);
      this.riverDataSource = null;
    }
    if (this.lakeDataSource) this.viewer.dataSources.remove(this.lakeDataSource);

    // 移除所有行政区划数据源
    if (this.adminDataSources && this.adminDataSources.length > 0) {
      this.adminDataSources.forEach(dataSource => {
        this.viewer.dataSources.remove(dataSource);
      });
      this.adminDataSources = [];
    }
    document.removeEventListener('keydown', this.onKeyDown);
  },
  methods: {

    load() {
      const container = this.$refs.cesiumContainer;

      this.viewer = initCesium(container)
      this.viewer._cesiumWidget._creditContainer.style.display = "none";

      this.viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(108.93, 34.27, 300000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-90),
          roll: 0.0
        }
      });

      // 初始化下雨效果
      this.initRainEffect();
      document.addEventListener('keydown', this.onKeyDown);

    },
    // 加载天地图
    loadTDT(type) {
      this.viewer.imageryLayers.removeAll();

      const option = {
        tileMatrixSetID: "w",
        format: "tiles",
        style: "default",
        minimumLevel: 0,
        maximumLevel: 18,
        credit: "Tianditu",
        subdomains: ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"]
      };

      if (type === 0) {
        const imageryProvider = new Cesium.WebMapTileServiceImageryProvider({
          url: `https://{s}.tianditu.gov.cn/img_w/wmts?tk=${this.tdtToken}`,
          layer: "img",
          ...option
        });

        const annotationProvider = new Cesium.WebMapTileServiceImageryProvider({
          url: `https://{s}.tianditu.gov.cn/cia_w/wmts?tk=${this.tdtToken}`,
          layer: "cia",
          ...option
        });

        this.viewer.imageryLayers.addImageryProvider(imageryProvider);
        this.viewer.imageryLayers.addImageryProvider(annotationProvider);
      } else {
        const vectorProvider = new Cesium.WebMapTileServiceImageryProvider({
          url: `https://{s}.tianditu.gov.cn/vec_w/wmts?tk=${this.tdtToken}`,
          layer: "vec",
          ...option
        });

        const annotationProvider = new Cesium.WebMapTileServiceImageryProvider({
          url: `https://{s}.tianditu.gov.cn/cva_w/wmts?tk=${this.tdtToken}`,
          layer: "cva",
          ...option
        });

        this.viewer.imageryLayers.addImageryProvider(vectorProvider);
        this.viewer.imageryLayers.addImageryProvider(annotationProvider);
      }

      this.currentMapType = type;
    },
    // 加载湖面数据
    loadLakeData() {
      if (!this.lakeData) {
        console.error('湖面GeoJSON数据加载失败');
        return;
      }
      this.isLoading = true;
      this.loadingText = '加载湖面数据...';

      this.lakeDataSource = new Cesium.GeoJsonDataSource();
      this.lakeDataSource.load(this.lakeData, {
        enableFeatureStyles: false,
        clampToGround: true,
        suppressPointLabels: true
      }).then(() => {
        this.isLoading = false;
        this.configureLakeStyles();
        this.viewer.dataSources.add(this.lakeDataSource);
        // 定位到湖面区域
        this.viewer.zoomTo(this.lakeDataSource);
      }).catch(error => {
        this.isLoading = false;
        console.error('加载湖面数据失败:', error);
      });
    },
    // 配置湖面样式
    configureLakeStyles() {
      if (!this.lakeDataSource) return;

      const entities = this.lakeDataSource.entities.values;

      entities.forEach(entity => {
        const properties = entity.properties || {};
        const name = properties.NAME || `湖面${entity.id}`;

        // 湖面样式：浅蓝色半透明填充
        entity.polygon = {
          hierarchy: entity.polygon.hierarchy,
          material: new Cesium.Color(85 / 255, 130 / 255, 253 / 255, 0.65), // 浅蓝色
          outline: true,
          outlineColor: Cesium.Color.DARKBLUE, // 保持边框颜色不变
          outlineWidth: 1,
          show: false,
          fill: true,
          shadow: true,
          depthFailMaterial: new Cesium.Color(0, 0, 0, 0.2)
        };

        // 湖面标签样式
        entity.label = {
          text: name,
          font: '12px sans-serif',
          fillColor: Cesium.Color.WHITE,
          backgroundColor: new Cesium.Color(0, 191, 255, 0.7), // 浅蓝色背景
          padding: new Cesium.Cartesian2(5, 5),
          showBackground: true,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, 10),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          show: false // 初始隐藏
        };
      });
    },
    // 加载河流数据
    loadRiverData() {
      if (!this.riverData) {
        console.error('河流GeoJSON数据加载失败');
        return;
      }

      this.isLoading = true;
      this.loadingText = '加载河流数据...';

      // 使用Cesium原生GeoJsonDataSource加载
      this.riverDataSource = new Cesium.GeoJsonDataSource();

      // 配置加载选项
      this.riverDataSource.load(this.riverData, {
        enableFeatureStyles: false, // 禁用默认样式，使用自定义样式
        clampToGround: true,
        suppressPointLabels: true
      }).then(() => {
        this.isLoading = false;
        this.configureRiverStyles(); // 配置河流样式
        this.viewer.dataSources.add(this.riverDataSource);

        // 定位到河流区域
        this.viewer.zoomTo(this.riverDataSource);
      }).catch(error => {
        this.isLoading = false;
        console.error('加载河流数据失败:', error);
      });
    },
    // 配置河流样式
    configureRiverStyles() {
      if (!this.riverDataSource) return;

      const entities = this.riverDataSource.entities.values;

      entities.forEach(entity => {
        // 获取属性
        const properties = entity.properties || {};
        const name = properties.NAME || `河流${entity.id}`;

        // 河流样式：蓝色半透明填充
        entity.polygon = {
          hierarchy: entity.polygon.hierarchy,
          material: new Cesium.Color(85 / 255, 130 / 255, 253 / 255, 0.65), // 浅蓝色
          outline: true,
          outlineColor: Cesium.Color.DARKBLUE, // 保持边框颜色不变
          outlineWidth: 1,
          show: false,
          fill: true,
          shadow: true,
          depthFailMaterial: new Cesium.Color(0, 0, 0, 0.2)
        };

        // 河流标签样式
        entity.label = {
          text: name,
          font: '12px sans-serif',
          fillColor: Cesium.Color.WHITE,
          backgroundColor: new Cesium.Color(0, 0, 1, 0.7), // 蓝色背景
          padding: new Cesium.Cartesian2(5, 5),
          showBackground: true,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, 10),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          show: false // 初始隐藏，通过toggleRiverLayer控制
        };
      });
    },
    // 加载灾害点数据
    loadDisasterData() {
      this.isLoading = true;
      this.loadingText = '加载灾害点数据...';
      try {
        // 分别存储不同类型灾害点的实体引用
        this.landslideEntities = [];
        this.debrisFlowEntities = [];
        this.secondaryRiskEntities = [];
        // 滑坡数据
        getGeologicalDisasterHideByLandSlideList().then(res => {
          this.HuapoData = res.data
          // 确保数据存在且格式正确
          const huapoFeatures = this.HuapoData || [];
          console.log(`滑坡数据点数: ${huapoFeatures.length}`);
          // 加载滑坡点
          huapoFeatures.forEach(point => {
            const hideDTO = point.geologicalDisasterHideDTO || {};
            const disasterNAME = hideDTO.disasterName || '未知灾害点';
            const longitude = hideDTO.lon;
            const latitude = hideDTO.lat;
            // 将11条因子记录融合为一条包含所有因子字段的记录
            point.factorVoList = point.factorVoList.reduce((merged, item) => {
              // 提取当前因子的关键信息
              const {
                hideId,
                attributeId,
                valueId,
                attributeName,
                factorValue,
                unit,
                attributeNameAlias
              } = item;
              // 初始化合并对象（首次循环时）
              if (Object.keys(merged).length === 0) {
                merged.hideId = hideId; // 保留hideId（假设所有记录的hideId相同）
                merged.attributeIds = []; // 存储所有attributeId
                merged.valueIds = []; // 存储所有valueId
              }
              // 收集所有attributeId和valueId
              merged.attributeIds.push(attributeId);
              merged.valueIds.push(valueId);
              // 以属性别名为键，存储因子值和单位
              merged[attributeNameAlias] = {
                attributeName: attributeName, // 保留属性名称
                factorValue: factorValue,     // 因子值
                unit: unit                     // 单位
              };
              return merged;
            }, {});
            // 加入滑坡点到数组
            this.landslidePoints.push([longitude, latitude])
            // 创建灾害点实体
            const entity = this.viewer.entities.add({
              position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 5),
              // 点
              point: {
                color: Cesium.Color.RED, // 点位颜色
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 0,
                pixelSize: 0 // 像素点大小
              },
              billboard: {
                // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
                image: landslideIcon,
                width: 100, // 图片宽度,单位px
                height: 100, // 图片高度，单位px
                eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
                color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
                scale: 0.8, // 缩放比例
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
                scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
                depthTest: false, // 禁止深度测试
                disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
                show: true
              },
              // 文字
              label: {
                text: `${disasterNAME}`,
                font: '15pt Source Han Sans CN',
                fillColor: Cesium.Color.WHITE,
                backgroundColor: Cesium.Color.AQUA,
                showBackground: false,
                outline: true,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 10,
                scale: 1.0,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.CENTER,
                horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                pixelOffset: new Cesium.Cartesian2(-70, -35),
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 40000),
                show: true
              },
              // 添加灾害类型信息，用于弹窗显示
              description: this.createDisasterDescription(point, '滑坡'),
              // 保存原始样式，用于闪烁恢复
              originalColor: Cesium.Color.RED,
              originalPixelSize: 15,
              // 标记灾害类型
              disasterType: 'landslide',
              disasterData: point,
            });
            // 保存实体引用
            this.disasterEntities.push(entity);
            this.landslideEntities.push(entity);
          });
        })
        // 泥石流数据
        getGeologicalDisasterHideByFlowList().then(res => {

          this.NishiliuData = res.data
          const nishiliuFeatures = this.NishiliuData || [];
          // 加载泥石流点
          nishiliuFeatures.forEach(point => {
            const hideDTO = point.geologicalDisasterHideDTO || {};
            const disasterNAME = hideDTO.disasterName || '未知灾害点';
            const longitude = hideDTO.lon;
            const latitude = hideDTO.lat;
            // 加入泥石流点
            this.debrisFlowPoints.push([longitude, latitude])
            // 创建灾害点实体
            const entity = this.viewer.entities.add({
              position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 5),
              // 点
              point: {
                color: Cesium.Color.YELLOW, // 点位颜色
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 0,
                pixelSize: 0 // 像素点大小
              },
              billboard: {
                // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
                image: debrisFlowIcon,
                width: 100, // 图片宽度,单位px
                height: 100, // 图片高度，单位px
                eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
                color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
                scale: 0.8, // 缩放比例
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
                scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
                depthTest: false, // 禁止深度测试
                disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
                show: true
              },
              // 文字
              label: {
                text: `${disasterNAME}`,
                font: '15pt Source Han Sans CN',
                fillColor: Cesium.Color.WHITE,
                backgroundColor: Cesium.Color.AQUA,
                showBackground: false,
                outline: true,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 10,
                scale: 1.0,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.CENTER,
                horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                pixelOffset: new Cesium.Cartesian2(-70, 35),
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 40000),
                show: true
              },
              // 添加灾害类型信息，用于弹窗显示
              description: this.createDisasterDescription(point, '泥石流'),
              // 保存原始样式，用于闪烁恢复
              originalColor: Cesium.Color.YELLOW,
              originalPixelSize: 15,
              // 标记灾害类型
              disasterType: 'debrisFlow',
              disasterData: point,
            });

            // 保存实体引用
            this.disasterEntities.push(entity);
            this.debrisFlowEntities.push(entity);
          });
        })
        // 风险区数据
        getGeologicalDisasterRiskList().then(res => {
          this.DangerAreaData = res.data
          const dangerAreaFeatures = this.DangerAreaData?.features || [];
          // 添加风险区点
          dangerAreaFeatures.forEach(point => {
            const SmId = point.properties.SmUserID; // id
            const disasterName = point.properties.disasterName; //  风险区名称
            const unitCode = point.properties.unitCode; // 单位代码
            const position = point.properties.position; // 位置
            const longitude = parseFloat(point.geometry.coordinates[0]);  //经度
            const latitude = parseFloat(point.geometry.coordinates[1]);   //纬度
            const area = point.properties.area || {};   // 面积
            const residentCounts = point.properties.residentCounts; // 居民户数（户）
            const addressPopulation = point.properties.addressPopulation; // 户籍人口（人）
            const riskProperty = point.properties.riskProperty; // 威胁财产（万元）
            const permanentPopulation = point.properties.permanentPopulation; // 长居住人口（人）
            const housing = point.properties.housing; // 住房（间）

            // 加入次生灾害点
            this.secondaryRiskPoints.push([longitude, latitude])
            // 创建灾害点实体
            const entity = this.viewer.entities.add({
              position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 5),
              // 点
              point: {
                color: Cesium.Color.ORANGE, // 点位颜色
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 0,
                pixelSize: 0 // 像素点大小
              },
              billboard: {
                // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
                image: riskArea,
                width: 50, // 图片宽度,单位px
                height: 50, // 图片高度，单位px
                eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
                color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
                scale: 0.8, // 缩放比例
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
                scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
                depthTest: false, // 禁止深度测试
                disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
                show: true
              },
              // 文字
              label: {
                text: `${position}`,
                font: '15pt Source Han Sans CN',
                fillColor: Cesium.Color.WHITE,
                backgroundColor: Cesium.Color.AQUA,
                showBackground: false,
                outline: true,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 10,
                scale: 1.0,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                verticalOrigin: Cesium.VerticalOrigin.CENTER,
                horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                pixelOffset: new Cesium.Cartesian2(-70, -35),
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 40000),
                show: true
              },
              // 添加灾害类型信息，用于弹窗显示
              description: this.createDisasterDescription({position}, '次生灾害风险区'),
              // 保存原始样式，用于闪烁恢复
              originalColor: Cesium.Color.ORANGE,
              originalPixelSize: 15,
              // 标记灾害类型
              disasterType: 'secondaryRisk',
              disasterData: point,
            });
            // 保存实体引用
            this.disasterEntities.push(entity);
            this.secondaryRiskEntities.push(entity);
          });
        })
        // 获取致灾因可选值
        getFactorValueList().then(res => {
          this.factorOptions = res.data;
        });
        // 存储所有添加的实体，用于事件处理
        this.disasterEntities = [];
        // 设置实体点击事件
        this.setupEntityClickHandler();
        this.isLoading = false;
      } catch (error) {
        this.isLoading = false;
        console.error('处理灾害数据时出错:', error);
      }
    },
    // 加入滑坡区域
    loadLandSlide(landslide, target) {
      for (let i = 0; i < landslide.length; i++) {
        if (target.includes(i)) {
          console.log("所有符合:", landslide[i])
          let lon = landslide[i].lon
          let lat = landslide[i].lat
          this.viewer.entities.add({
            // fromDegrees（经度，纬度，高度，椭球，结果）从以度为单位的经度和纬度值返回Cartesian3位置
            position: Cesium.Cartesian3.fromDegrees(parseFloat(lon), parseFloat(lat)),
            properties: {
              data: landslide[i]
            }
          })

          // 根据点路线绘制多边形影响范围，如果没有点路线则绘制圆形
          if (landslide[i].点路线 && landslide[i].点路线.length > 0) {
            const routePoints = [];
            const polylinePositions = []; // 用于存储折线点的数组
            const bufferWidth = 20; // 缓冲区宽度（米），您可以根据需要调整此值

            // 收集并验证所有有效的路线点
            for (let j = 0; j < landslide[i].点路线.length; j++) {
              const currentPointData = landslide[i].点路线[j];
              if (!Array.isArray(currentPointData) || currentPointData.length === 0 || !Array.isArray(currentPointData[0]) || currentPointData[0].length < 2) {
                console.warn(`无效的点数据结构，索引 ${i}，点路线索引 ${j}:`, currentPointData);
                continue;
              }

              const point = currentPointData[0];
              const lon = parseFloat(point[0]);
              const lat = parseFloat(point[1]);

              if (!isNaN(lon) && !isNaN(lat) && lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90) {
                routePoints.push(Cesium.Cartesian3.fromDegrees(lon, lat)); // 存储为Cesium.Cartesian3对象
                polylinePositions.push(lon, lat); // 添加到折线点数组
              } else {
                console.warn(`无效的坐标值，索引 ${i}，点路线索引 ${j}: lon=${point[0]}, lat=${point[1]}`);
              }
            }
            // 绘制原始点路线
            if (polylinePositions.length >= 4) { // 至少需要两个点（4个坐标值）才能绘制线
              this.viewer.entities.add({
                polyline: {
                  positions: Cesium.Cartesian3.fromDegreesArray(polylinePositions),
                  width: 20, // 线条宽度
                  material: new Cesium.PolylineArrowMaterialProperty(Cesium.Color.YELLOW), // 使用箭头材质
                  clampToGround: true // 贴地显示
                },
                properties: {
                  data: landslide[i],
                  type: 'landslide_route'
                }
              });
            }

            // 绘制影响范围多边形（缓冲区）
            if (routePoints.length >= 1) { // 至少一个点才能考虑扇形或圆形
              // 将 generateSmoothBuffer 函数定义移动到此处，作为 loadLandSlide 的内部函数
              const generateSmoothBuffer = (routePoints, bufferWidth) => { // 移除 fanAngle 参数
                const interpolatedPoints = [];
                const segmentInterpolationCount = 50; // 每段插值点数

                // 如果只有一个点，直接生成圆形（360度扇形）
                if (routePoints.length === 1) {
                  const centerPoint = routePoints[0];
                  const radius = bufferWidth;
                  const positions = [];
                  const numSegments = 60; // 扇形分段数

                  for (let k = 0; k <= numSegments; k++) {
                    const angle = (k / numSegments) * 360; // 0到360度
                    const radian = Cesium.Math.toRadians(angle);

                    // 计算扇形边界点，使用更精确的地理坐标计算
                    const cartographic = Cesium.Cartographic.fromCartesian(centerPoint);
                    const longitude = cartographic.longitude + (radius / Cesium.Ellipsoid.WGS84.maximumRadius) * Math.sin(radian);
                    const latitude = cartographic.latitude + (radius / Cesium.Ellipsoid.WGS84.maximumRadius) * Math.cos(radian);
                    positions.push(Cesium.Cartesian3.fromRadians(longitude, latitude));
                  }
                  return new Cesium.PolygonHierarchy(positions);
                }

                // 处理多点路线的平滑缓冲区
                const leftPoints = [];
                const rightPoints = [];

                // 遍历所有线段，生成平滑缓冲区
                for (let j = 0; j < routePoints.length - 1; j++) { // 遍历到倒数第二个点
                  const start = routePoints[j];
                  const end = routePoints[j + 1];

                  interpolatedPoints.push(start);

                  for (let k = 1; k < segmentInterpolationCount; k++) {
                    const ratio = k / segmentInterpolationCount;
                    const interpolated = Cesium.Cartesian3.lerp(
                        start,
                        end,
                        ratio,
                        new Cesium.Cartesian3()
                    );
                    interpolatedPoints.push(interpolated);
                  }
                }
                // 添加最后一个原始点
                interpolatedPoints.push(routePoints[routePoints.length - 1]);

                // 计算平滑的缓冲区边界点
                for (let j = 0; j < interpolatedPoints.length; j++) {
                  const prev = j > 0 ? interpolatedPoints[j - 1] : interpolatedPoints[j];
                  const next = j < interpolatedPoints.length - 1 ? interpolatedPoints[j + 1] : interpolatedPoints[j];

                  const forwardVec = Cesium.Cartesian3.subtract(next, prev, new Cesium.Cartesian3());
                  Cesium.Cartesian3.normalize(forwardVec, forwardVec);

                  const normal = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(interpolatedPoints[j], new Cesium.Cartesian3());
                  const perpendicular = Cesium.Cartesian3.normalize(Cesium.Cartesian3.cross(normal, forwardVec, new Cesium.Cartesian3()), new Cesium.Cartesian3());

                  const scaledPerpendicular = Cesium.Cartesian3.multiplyByScalar(
                      perpendicular,
                      bufferWidth,
                      new Cesium.Cartesian3()
                  );

                  const leftPoint = Cesium.Cartesian3.add(
                      interpolatedPoints[j],
                      scaledPerpendicular,
                      new Cesium.Cartesian3()
                  );
                  const rightPoint = Cesium.Cartesian3.subtract(
                      interpolatedPoints[j],
                      scaledPerpendicular,
                      new Cesium.Cartesian3()
                  );

                  leftPoints.push(leftPoint);
                  rightPoints.push(rightPoint);
                }

                // 组合成闭合多边形：左侧点 + 右侧点（反向）
                const polygonPositions = [...leftPoints, ...rightPoints.reverse()];

                return new Cesium.PolygonHierarchy(polygonPositions);
              };

              // 调用新的平滑缓冲区生成方法
              const polygonHierarchy = generateSmoothBuffer(routePoints, bufferWidth);

              // 如果成功创建了多边形顶点，则添加实体
              if (polygonHierarchy.positions.length > 0) {
                this.viewer.entities.add({
                  polygon: {
                    hierarchy: polygonHierarchy,
                    // material: Cesium.Color.BLUE.withAlpha(0.3),
                    material: new Cesium.ImageMaterialProperty({
                      image: landslide_surface01,
                      color: Cesium.Color.WHITE,
                      repeat: new Cesium.Cartesian2(4, 4),
                    }),
                    outline: true,
                    outlineColor: Cesium.Color.BLUE,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                  },
                  properties: {
                    data: landslide[i],
                    type: 'influence_range_polygon'
                  }
                });
              }

              // 如果是多点路线，单独为最后一个点绘制圆形缓冲区
              if (routePoints.length > 1) {
                const lastPoint = routePoints[routePoints.length - 1];
                const lastPointBufferRadius = bufferWidth; // 可以根据需要调整这个半径

                this.viewer.entities.add({
                  position: lastPoint,
                  ellipse: {
                    semiMinorAxis: lastPointBufferRadius,
                    semiMajorAxis: lastPointBufferRadius,
                    material: new Cesium.ImageMaterialProperty({
                      image: landslide_surface01,
                      color: Cesium.Color.WHITE,
                      repeat: new Cesium.Cartesian2(4, 4),
                    }),
                    outline: true,
                    outlineColor: Cesium.Color.BLUE,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                  },
                  properties: {
                    data: landslide[i],
                    type: 'last_point_circular_buffer'
                  }
                });
              }

            } else {
              console.warn(`点路线点数不足，无法创建影响范围多边形，索引 ${i}`);
            }
          } else {
            // ... existing code ...
          }
        }
      }
    },
    // 创建灾害点详情描述
    createDisasterDescription(properties, type) {

      var disasterType = type.includes("滑坡") ? "滑坡" : "泥石流"
      return `
    <div style="font-family: Arial, sans-serif; padding: 50px;">
      <h3 style="color: ${disasterType === '滑坡' ? 'red' : 'yellow'}; margin-top: 0;">
        ${type || '未知灾害点'}
      </h3>
      <p><strong>灾害类型:</strong> ${disasterType}</p>
      <p><strong>坐标:</strong> ${properties.longitude || '未知'}, ${properties.latitude || '未知'}</p>
    </div>
`;
    },
    // 设置实体点击事件处理
    setupEntityClickHandler() {

      // 清除之前的点击事件处理程序
      if (this.clickHandler) {
        this.clickHandler.destroy();
      }

      // 为左键点击添加事件处理程序
      this.clickHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
      this.clickHandler.setInputAction((movement) => {
        // 检查点击是否在实体上
        const pickedObject = this.viewer.scene.pick(movement.position);
        // 判断是否有disasterName属性
        if (pickedObject.id._disasterData === undefined) {
          return;
        }

        // 隐藏之前的弹出面板
        this.closePopup();

        if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.id)) {
          const entity = pickedObject.id;
          // 获取实体的灾害数据
          this.selectedEntityData = entity._disasterData || {};
          console.log(this.selectedEntityData, "------------------点击了----------------------")

          // 计算弹出框位置并显示面板
          this.calculateAndShowPopup(entity, movement.position);

        } else {
          // 如果点击在空白处，隐藏信息框
          this.viewer.selectedEntity = undefined;
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    },
    // 加载行政区划数据
    loadAdminData() {
      this.isLoading = true;
      console.log('开始加载行政区划数据...');
      // 重置数据源数组
      this.adminDataSources = [];
      // 使用for循环同步加载所有数据源
      for (let i = 0; i < this.administrationData.length; i++) {

        // 创建新的数据源
        const dataSource = new Cesium.GeoJsonDataSource();
        this.adminDataSources.push(dataSource);

        // 配置加载选项并加载数据
        dataSource.load(this.administrationData[i], {
          enableFeatureStyles: false,
          clampToGround: true,
          suppressPointLabels: true
        }).then(() => {
          // 配置当前数据源的样式
          const color = this.generateRandomColor(i);
          this.configureAdminStyles(dataSource, i, color);
          // 存储区县颜色
          const districtId = this.administrationData[i].name || `district${i}`;
          this.districtColors[districtId] = color;
          // 添加到地图
          this.viewer.dataSources.add(dataSource);
          this.updateLegend();
        }).catch(error => {
          console.error(`加载行政区划数据失败 (${this.administrationData[i].name || "未知区域"}):`, error);
        });
      }
    },
    // 配置行政区划样式
    configureAdminStyles(dataSource, i, color) {
      if (!dataSource) return;

      const entities = dataSource.entities.values;

      entities.forEach(entity => {
        const name = entity.properties.name._value || dataSource.name;

        entity.polygon = {
          hierarchy: entity.polygon.hierarchy,
          material: color,
          outline: true,
          outlineColor: Cesium.Color.BLUE,
          outlineWidth: 1,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          show: this.showAdminLayer, // 使用统一的显示控制
          fill: true,
          shadow: true,
          depthFailMaterial: color.withAlpha(0.2)
        };

        entity.label = {
          text: name,
          font: '12px sans-serif',
          fillColor: Cesium.Color.BLACK,
          backgroundColor: color.withAlpha(0.7),
          padding: new Cesium.Cartesian2(5, 5),
          showBackground: true,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, 10),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          show: this.showAdminLayer // 使用统一的显示控制
        };

      });
    },
    // 添加切换行政区划图层显示的方法
    toggleAdminLayer() {
      this.showAdminLayer = !this.showAdminLayer;

      if (this.adminDataSources && this.adminDataSources.length > 0) {
        this.adminDataSources.forEach(dataSource => {
          const entities = dataSource.entities.values;
          entities.forEach(entity => {
            if (entity.polygon) entity.polygon.show = this.showAdminLayer;
            if (entity.label) entity.label.show = this.showAdminLayer;
          });
        });
      }
    },
    // 颜色生成器函数，增加透明度
    generateRandomColor(i) {
      // 定义13种不同的颜色
      const colors = [
        new Cesium.Color(255 / 255, 153 / 255, 0 / 255, 0.5),    // 活力橙
        new Cesium.Color(255 / 255, 51 / 255, 102 / 255, 0.5),   // 亮粉红
        new Cesium.Color(0 / 255, 178 / 255, 255 / 255, 0.5),    // 天蓝色
        new Cesium.Color(102 / 255, 255 / 255, 102 / 255, 0.5),  // 浅绿色
        new Cesium.Color(204 / 255, 102 / 255, 255 / 255, 0.5),  // 淡紫色
        new Cesium.Color(255 / 255, 204 / 255, 0 / 255, 0.5),    // 金黄色
        new Cesium.Color(0 / 255, 204 / 255, 153 / 255, 0.5),    // 青绿色
        new Cesium.Color(255 / 255, 102 / 255, 102 / 255, 0.5),  // 浅红色
        new Cesium.Color(102 / 255, 153 / 255, 255 / 255, 0.5),  // 淡蓝色
        new Cesium.Color(255 / 255, 178 / 255, 102 / 255, 0.5),  // 浅橙色
        new Cesium.Color(153 / 255, 255 / 255, 204 / 255, 0.5),  // 淡青色
        new Cesium.Color(255 / 255, 153 / 255, 204 / 255, 0.5),  // 浅粉色
        new Cesium.Color(190 / 255, 255 / 255, 232 / 255, 0.5),  // 淡靛紫
      ];

      // 确保索引在有效范围内
      if (i >= 0 && i < colors.length) {
        return colors[i];
      } else {
        // 如果索引超出范围，使用默认颜色或循环使用已有颜色
        return colors[i % colors.length];
      }
    },
    // 开启下雨特效
    toggleRainMode() {
      // 若不允许标记且当前为开启状态，则直接关闭
      if (this.rainMode) {
        this.rainMode = false;
        if (this.handler) {
          this.handler.destroy();
          this.handler = null;
        }
        document.body.style.cursor = '';
        this.showInfoPanel = false;
        return;
      }

      this.rainMode = !this.rainMode;

      if (this.rainMode) {
        this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.handler.setInputAction(this.onMapClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        document.body.style.cursor = 'crosshair';
      } else {
        if (this.handler) {
          this.handler.destroy();
          this.handler = null;
        }
        document.body.style.cursor = '';
        this.showInfoPanel = false;
      }
    },
    // 在地图上标记暴雨点
    onMapClick(movement) {
      if (!this.rainMode) return;

      const ray = this.viewer.camera.getPickRay(movement.position);
      const cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);

      if (cartesian) {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const longitude = Cesium.Math.toDegrees(cartographic.longitude);
        const latitude = Cesium.Math.toDegrees(cartographic.latitude);

        this.selectedPosition = {longitude, latitude, cartesian};
        this.showInfoPanel = true;
      }

    },
    // confirmRainPoint() {
    //   if (!this.selectedPosition) return;
    //
    //   const {longitude, latitude, cartesian} = this.selectedPosition;
    //
    //   // 计算降雨强度(mm/小时)
    //   const intensity = this.rainfall / (this.duration || 1);
    //
    //   const entity = this.viewer.entities.add({
    //     position: cartesian,
    //     point: {
    //       // 根据降雨量调整点大小
    //       pixelSize: 15,
    //       color: Cesium.Color.DARKRED,
    //       outlineColor: Cesium.Color.WHITE,
    //       outlineWidth: 1,
    //       heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
    //     },
    //     label: {
    //       text: `降雨量: ${this.rainfall}毫米每小时\n已持续: ${this.duration}小时`,
    //       // text: `降雨量: ${this.rainfall}mm\n持续: ${this.duration}小时`,
    //       font: '14px sans-serif',
    //       fillColor: Cesium.Color.WHITE,
    //       backgroundColor: Cesium.Color.RED.withAlpha(0.7),
    //       padding: new Cesium.Cartesian2(20, 20),
    //       showBackground: true,
    //       verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
    //       pixelOffset: new Cesium.Cartesian2(0, -10),
    //       heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
    //     },
    //     rainPoint: {
    //       longitude: longitude,
    //       latitude: latitude,
    //       cartesian: cartesian,
    //     }
    //   });
    //
    //   // 添加暴雨影响区域
    //   const ellipseEntity = this.addRainEllipse(cartesian, this.rainfall);
    //
    //   this.rainPoints.push(entity);
    //   this.rainPoints.push({ellipse: ellipseEntity});
    //   this.showInfoPanel = false;
    //
    //   // 标记后自动开启下雨效果
    //   this.weatherActive = true;
    //   this.rainEffect.enabled = this.weatherActive;
    //
    //   this.rainMode = false;
    //
    //   if (this.handler) {
    //     this.handler.destroy();
    //     this.handler = null;
    //   }
    //   document.body.style.cursor = '';
    //
    //   this.viewer.flyTo(entity, {
    //     duration: 1.5,
    //     offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-30), 5000)
    //   });
    // },
    confirmRainPoint() {
      if (!this.selectedPosition) return;
      const {longitude, latitude, cartesian} = this.selectedPosition;
      // 计算降雨强度(mm/小时)
      const intensity = this.rainfall / (this.duration || 1);
      // 创建标记点实体
      const entity = this.viewer.entities.add({
        position: cartesian,
        point: {
          pixelSize: 15,
          color: Cesium.Color.DARKRED,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 1,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        },
        label: {
          text: `降雨量: ${this.rainfall}毫米每小时\n已持续: ${this.duration}小时`,
          font: '14px sans-serif',
          fillColor: Cesium.Color.WHITE,
          backgroundColor: Cesium.Color.RED.withAlpha(0.7),
          padding: new Cesium.Cartesian2(20, 20),
          showBackground: true,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -10),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        },
        rainPoint: {
          longitude: longitude,
          latitude: latitude,
          cartesian: cartesian,
        }
      });

      this.rainPoints.push(entity);
      this.showInfoPanel = false;

      // 标记后自动开启下雨效果
      this.weatherActive = true;
      this.rainEffect.enabled = this.weatherActive;

      this.rainMode = false;

      if (this.handler) {
        this.handler.destroy();
        this.handler = null;
      }
      document.body.style.cursor = '';

      this.viewer.flyTo(entity, {
        duration: 1.5,
        offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-30), 5000)
      });

      // 新增逻辑：获取标记点所在行政区划
      const pointCoords = [longitude, latitude]; // 标记点经纬度[lon, lat]
      const adminArea = this.getAdministrationByPoint(pointCoords);

      if (adminArea) {
        console.log(`标记点位于行政区划: ${adminArea.name}`);
        // 获取该行政区划的经纬度范围
        const adminCoordinates = adminArea.geometry.coordinates;
        this.startLoading()
        // 检查灾害点是否在该行政区划内
        this.checkDisasterPointsInAdministration(adminCoordinates);
      } else {
        console.log("未找到标记点所在的行政区划");
      }
    },
    cancelRainPoint() {
      this.showInfoPanel = false;
    },
    onKeyDown(event) {
      if (event.key === 'Escape' && this.rainMode) {
        this.toggleRainMode();
      }
    },
    // 初始化下雨效果
    initRainEffect() {
      const rainFragmentShader = `
    #version 300 es
    precision highp float;

    uniform sampler2D colorTexture;
    uniform float rainIntensity;
    uniform vec4 rainArea;
    in vec2 v_textureCoordinates;
    out vec4 fragColor;

    float hash(float x){
        return fract(sin(x*23.3)*13.13);
    }

    // 检查点是否在矩形区域内
    bool isInRainArea(vec2 uv, vec4 area) {
        return uv.x >= area.x && uv.x <= area.x + area.z &&
               uv.y >= area.y && uv.y <= area.y + area.w;
    }

    void main(){
        float time = czm_frameNumber / 120.0;
        vec2 resolution = czm_viewport.zw;
        vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);
        vec3 c=vec3(.6,.7,.8);
        float a=-.4;
        float si=sin(a),co=cos(a);
        uv*=mat2(co,-si,si,co);
        uv*=length(uv+vec2(0,8.9))*.3+1.;
        float v=1.-sin(hash(floor(uv.x*100.))*2.);

        // 归一化的屏幕坐标
        vec2 screenUV = gl_FragCoord.xy / resolution;

        // 控制雨滴参数
        float density = 5.0 * rainIntensity;
        float brightness = 20.0 * rainIntensity;
        float threshold = 0.95 - 0.1 * rainIntensity;

        float b=clamp(abs(sin(20.*time*v+uv.y*density))-threshold,0.,1.)*brightness;
        c*=v*b;

        fragColor = mix(
            texture(colorTexture, v_textureCoordinates),
            vec4(c, 1),
            0.5 * rainIntensity
        );
    }
  `;

      this.rainEffect = new Cesium.PostProcessStage({
        fragmentShader: rainFragmentShader,
        uniforms: {
          rainIntensity: 0.5,
          rainArea: new Cesium.Cartesian4(0.25, 0.25, 0.5, 0.5)
        }
      });

      // 添加到场景但默认禁用
      this.viewer.scene.postProcessStages.add(this.rainEffect);
      this.rainEffect.enabled = false;

      // 设置降雨量的方法
      this.setRainIntensity = (value) => {
        this.rainEffect.uniforms.rainIntensity = Math.max(0.0, Math.min(1.0, value));
        this.updateRainUI(value); // 更新UI显示
      };


      // 初始化雨控制面板
      this.initRainControlUI();
    },
    // 初始化雨控制UI
    initRainControlUI() {
      // 创建控制容器
      const container = document.createElement('div');
      container.id = 'rain-control-panel';
      container.className = 'cesium-widget-credits'; // 使用Cesium风格
      container.style.cssText = `
    position: absolute;
    bottom: 20px;
    right: 20px;
    left : 25%;
    background: rgba(42, 42, 42, 0.8);
    color: white;
    padding: 10px;
    border-radius: 5px;
    width: 220px;
    z-index: 100;
  `;

      // 创建雨开关按钮
      const toggleBtn = document.createElement('button');
      toggleBtn.id = 'toggle-rain-btn';
      toggleBtn.className = 'cesium-button';
      toggleBtn.innerHTML = '<i class="cesium-icon-raindrop"></i> 雨';
      toggleBtn.style.cssText = `
    width: 100%;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
      toggleBtn.onclick = () => this.toggleWeatherEffect();

      // 创建滑块容器
      const sliderContainer = document.createElement('div');
      sliderContainer.style.cssText = 'display: flex; align-items: center;';

      // 创建降雨量标签
      const intensityLabel = document.createElement('span');
      intensityLabel.id = 'rain-intensity-label';
      intensityLabel.textContent = '降雨量: 50%';
      intensityLabel.style.cssText = 'margin-right: 10px; min-width: 70px;';

      // 创建降雨量滑块
      const intensitySlider = document.createElement('input');
      intensitySlider.id = 'rain-intensity-slider';
      intensitySlider.type = 'range';
      intensitySlider.min = '0';
      intensitySlider.max = '100';
      intensitySlider.value = '50';
      intensitySlider.className = 'cesium-baseLayerPicker-itemIcon'; // 使用Cesium风格
      intensitySlider.style.cssText = 'width: 100%;';
      intensitySlider.oninput = (e) => {
        const value = parseFloat(e.target.value) / 100;
        this.setRainIntensity(value);
      };

      // 组装UI
      sliderContainer.appendChild(intensityLabel);
      sliderContainer.appendChild(intensitySlider);
      container.appendChild(toggleBtn);
      container.appendChild(sliderContainer);

      // 添加到DOM
      this.viewer.container.appendChild(container);

      // 保存UI引用
      this.rainControlUI = {
        container,
        toggleBtn,
        intensitySlider,
        intensityLabel
      };
    },
    // 更新雨UI显示
    updateRainUI(intensity) {
      if (this.rainControlUI) {
        const percentage = Math.round(intensity * 100);
        this.rainControlUI.intensityLabel.textContent = `降雨量: ${percentage}%`;
        this.rainControlUI.intensitySlider.value = percentage;

        // 根据雨的强度改变按钮颜色
        const hue = 100 - intensity * 50; // 从蓝色到深蓝色
        this.rainControlUI.toggleBtn.style.backgroundColor = `hsl(${hue}, 80%, 45%)`;
      }
    },
    // 切换天气效果
    toggleWeatherEffect() {
      if (!this.rainMode) {
        this.weatherActive = !this.weatherActive;
        this.rainEffect.enabled = this.weatherActive;

        // 更新按钮状态
        if (this.rainControlUI) {
          const icon = this.rainControlUI.toggleBtn.querySelector('i');
          if (this.weatherActive) {
            this.rainControlUI.toggleBtn.classList.add('cesium-button-selected');
            icon.classList.add('cesium-icon-raindrop-active');
          } else {
            this.rainControlUI.toggleBtn.classList.remove('cesium-button-selected');
            icon.classList.remove('cesium-icon-raindrop-active');
          }
        }
      }
    },
    // 根据点坐标获取所在的行政区划
    getAdministrationByPoint(point) {
      // 遍历所有行政区划
      for (const admin of this.administrationData) {
        // 每个行政区划的features数组
        for (const feature of admin.features) {
          const geometry = feature.geometry;
          const coordinates = geometry.coordinates;
          // 判断点是否在当前行政区划范围内
          if (this.pointInPolygon(point, coordinates)) {
            return {
              name: feature.properties.name,
              geometry: geometry
            };
          }
        }
      }
      return null;
    },
    // 判断点是否在多边形内
    pointInPolygon(point, polygonCoords) {
      const [x, y] = point;
      let inside = false;

      // 处理多边形坐标的多层嵌套（行政区划坐标可能是[[[lon,lat],...]]结构）
      const flattenCoords = (coords) => {
        if (coords.length > 0 && typeof coords[0][0] === 'number') {
          return [coords]; // 单层坐标
        } else if (coords.length > 0 && Array.isArray(coords[0][0])) {
          return flattenCoords(coords[0]); // 多层嵌套取最内层
        }
        return [];
      };

      const polygon = flattenCoords(polygonCoords);

      // 遍历多边形的每条边
      for (let i = 0, j = polygon[0].length - 1; i < polygon[0].length; j = i++) {
        const [xi, yi] = polygon[0][i];
        const [xj, yj] = polygon[0][j];

        // 检查点是否在边的垂直范围内
        const intersect = ((yi > y) !== (yj > y))
            // 计算射线与边的交点x坐标
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

        if (intersect) inside = !inside;
      }

      return inside;
    },
    // 检查灾害点是否在行政区划范围内
    checkDisasterPointsInAdministration(adminCoordinates) {
      const landslidePointsInside = [];
      //const debrisFlowPointsInside = [];
      const secondaryRiskPointsInside = [];

      // 检查区域中的风险区
      this.secondaryRiskPoints.forEach(point => {
        if (this.pointInPolygon(point, adminCoordinates)) {
          secondaryRiskPointsInside.push(point);
        }
      });
      // 预处理：将坐标数组转换为字符串集合
      const coordinateSet = new Set();
      secondaryRiskPointsInside.forEach(coords => {
        coordinateSet.add(coords.join(','));
      });
      // 主逻辑
      const tabledatas = this.DangerAreaData.features;
      tabledatas.forEach(entity => {
        const entityCoords = entity.geometry.coordinates;
        const coordsStr = entityCoords.join(',');

        // 检查坐标字符串是否存在于集合中
        if (coordinateSet.has(coordsStr)) {
          console.log("找到了匹配的坐标:", entityCoords);
          this.allData.risk.push(entity.properties);
        }
      });

      // TODO 这里要放在单独的函数中来切换表格数据
      this.tableData = this.allData.risk;
      this.total = this.tableData.length;
      this.showRiskTable = !this.showRiskTable;
      this.showChart = !this.showChart;
      this.currentTableConfig = this.tableConfigs[this.selectedTableType];
      console.log(`行政区划内滑坡隐患点数量: ${landslidePointsInside.length}`);
      // console.log(`行政区划内泥石流隐患点数量: ${debrisFlowPointsInside.length}`);
      console.log(`行政区划内风险区点数量: ${secondaryRiskPointsInside.length}`);
      // 检查所有滑坡点
      this.landslidePoints.forEach(point => {
        if (this.pointInPolygon(point, adminCoordinates)) {
          landslidePointsInside.push(point);
        }
      });
      // 检查所有泥石流点
      // this.debrisFlowPoints.forEach(point => {
      //   if (this.pointInPolygon(point, adminCoordinates)) {
      //     debrisFlowPointsInside.push(point);
      //   }
      // });
      // 合并所有在行政区划内的灾害点并闪烁
      const allPointsInside = [
        ...landslidePointsInside,
        // ...debrisFlowPointsInside
      ];
      // 找出HuapoData中匹配的滑坡点信息
      if (landslidePointsInside.length > 0) {
        // 创建经纬度字符串集合用于快速匹配
        const pointSet = new Set();
        landslidePointsInside.forEach(point => {
          // 使用固定精度的字符串表示经纬度
          const lon = point[0];
          const lat = point[1];
          pointSet.add(`${lon},${lat}`);
        });
        // 筛选匹配的滑坡点数据
        const matchedHuapoData = []
        const matchedHuapoEntities = []
        getGeologicalDisasterHideByLandSlideList().then(res => {
          const hides = res.data;
          hides.forEach(item => {
            const lon = item.geologicalDisasterHideDTO.lon;
            const lat = item.geologicalDisasterHideDTO.lat;
            const key = `${lon},${lat}`;
            if (pointSet.has(key)) {
              matchedHuapoData.push(item.factorVoList);
            }
          });
          for (var i = 0; i < matchedHuapoData.length; i++) {
            for (var j = 0; j < matchedHuapoData[i].length; j++) {
              if (matchedHuapoData[i][j].attributeName === "降雨量") {
                matchedHuapoData[i][j].factorValue = this.rainfall
              }
            }
          }
          // 触发暴雨分析
          rainSlideTrigger(matchedHuapoData).then(res => {
            this.formatAnalyzedData = res.data;
            // 格式化
            this.formatAnalyzedData.forEach(item => {
              const disasterNAME = item.geologicalDisasterHideDTO.disasterName || '未知灾害点';
              const lon = item.geologicalDisasterHideDTO.lon;
              const lat = item.geologicalDisasterHideDTO.lat;
              const key = `${lon},${lat}`;
              if (pointSet.has(key)) {
                // 处理factorVoList，将多条因子记录融合为一条
                item.factorVoList = item.factorVoList.reduce((merged, factorItem) => {
                  const {
                    hideId,
                    attributeId,
                    valueId,
                    attributeName,
                    factorValue,
                    unit,
                    attributeNameAlias
                  } = factorItem;

                  // 初始化合并对象（首次循环时）
                  if (Object.keys(merged).length === 0) {
                    merged.hideId = hideId;
                    merged.attributeIds = [];
                    merged.valueIds = [];
                    // 保留经纬度信息用于匹配
                    merged.lon = lon;
                    merged.lat = lat;
                  }
                  // 收集所有attributeId和valueId
                  merged.attributeIds.push(attributeId);
                  merged.valueIds.push(valueId);
                  // 以属性别名为键，存储因子值和单位
                  merged[attributeNameAlias] = {
                    attributeName: attributeName,
                    factorValue: factorValue,
                    unit: unit
                  };
                  return merged;
                }, {});
                // 将返回的隐患点替换加入到当前地图展示的全部隐患点中，只替换匹配部分
                this.landslideEntities.forEach(entity => {
                  // 修改为降雨量
                  if (entity._disasterData.factorVoList.hideId === item.factorVoList.hideId) {
                    item.factorVoList.rainfall.factorValue = this.rainfall
                    // 删除原有的
                    this.viewer.entities.remove(entity);
                    // 添加最新的
                    const newentity = this.viewer.entities.add({
                      position: Cesium.Cartesian3.fromDegrees(lon, lat, 5),
                      // 点
                      point: {
                        color: Cesium.Color.RED, // 点位颜色
                        outlineColor: Cesium.Color.BLACK,
                        outlineWidth: 0,
                        pixelSize: 0 // 像素点大小
                      },
                      billboard: {
                        // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
                        image: landslideIcon,
                        width: 100, // 图片宽度,单位px
                        height: 100, // 图片高度，单位px
                        eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
                        color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
                        scale: 0.8, // 缩放比例
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
                        scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
                        depthTest: false, // 禁止深度测试
                        disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
                        show: true
                      },
                      // 文字
                      label: {
                        text: `${disasterNAME}`,
                        font: '15pt Source Han Sans CN',
                        fillColor: Cesium.Color.WHITE,
                        backgroundColor: Cesium.Color.AQUA,
                        showBackground: false,
                        outline: true,
                        outlineColor: Cesium.Color.BLACK,
                        outlineWidth: 10,
                        scale: 1.0,
                        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                        verticalOrigin: Cesium.VerticalOrigin.CENTER,
                        horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                        pixelOffset: new Cesium.Cartesian2(-70, -35),
                        distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 40000),
                        show: true
                      },
                      // 添加灾害类型信息，用于弹窗显示
                      description: this.createDisasterDescription(item, '滑坡'),
                      // 保存原始样式，用于闪烁恢复
                      originalColor: Cesium.Color.RED,
                      originalPixelSize: 15,
                      // 标记灾害类型
                      disasterType: 'landslide',
                      disasterData: item,
                    });
                    this.landslideEntities.push(newentity);
                    matchedHuapoEntities.push(item)
                    this.allData.slide.push(item.geologicalDisasterHideDTO)
                  }
                })
              }
            });
            if (allPointsInside.length > 0) {
              this.flashDisasterPoints(allPointsInside, matchedHuapoEntities);
            }
            this.stopLoading()
          })
        })
      }
      this.chartDatas.seriesDatas[0] = landslidePointsInside.length;
      this.chartDatas.seriesDatas[2] = secondaryRiskPointsInside.length;
    },
    // 闪烁灾害点
    flashDisasterPoints(points, entities) {
      console.log("传输过来的匹配实体是：", entities);

      // 若界面已关闭，直接返回
      if (this.isClosed) return;

      // 停止之前的闪烁动画
      if (this.flashInterval) {
        if (typeof this.flashInterval === 'number') {
          clearInterval(this.flashInterval);
        } else {
          cancelAnimationFrame(this.flashInterval);
        }
        this.flashInterval = null;
      }

      // 清除已有的光晕集合
      if (this.haloCollection) {
        this.haloCollection.removeAll();
        this.viewer.scene.primitives.remove(this.haloCollection);
      }

      // 如果没有需要处理的实体，直接返回
      if (!entities || entities.length === 0) return;

      // 创建光晕点集合
      this.haloCollection = new Cesium.PointPrimitiveCollection();
      this.viewer.scene.primitives.add(this.haloCollection);

      // 存储需要闪烁的实体及其对应的光晕配置
      const flashConfigs = [];

      // 处理每个实体
      entities.forEach(entity => {
        try {
          // 从实体数据中获取经纬度
          const lon = entity.geologicalDisasterHideDTO.lon;
          const lat = entity.geologicalDisasterHideDTO.lat;
          const level = entity.predict?.level || '低'; // 默认低风险

          // 将经纬度转换为Cesium可用的坐标
          const position = Cesium.Cartesian3.fromDegrees(lon, lat);

          // 根据风险等级确定颜色和是否闪烁
          let color, shouldFlash;
          switch (level) {
            case '高':
              color = Cesium.Color.RED;
              shouldFlash = true;
              break;
            case '中':
              color = Cesium.Color.YELLOW;
              shouldFlash = true;
              break;
            case '低':
            default:
              color = Cesium.Color.GREEN.withAlpha(0.5); // 低风险不闪烁，用半透明绿色标识
              shouldFlash = false;
              break;
          }

          // 创建光晕点
          const halo = this.haloCollection.add({
            position: position,
            pixelSize: 15,
            color: color,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 1,
            show: true,
            // 自定义材质用于光晕效果
            material: new Cesium.Material({
              fabric: {
                type: 'Halo',
                uniforms: {
                  color: color,
                  glowPower: 0.5,
                  innerRadius: 0.5,
                  outerRadius: 1.0
                },
                source: `
              uniform vec4 color;
              uniform float glowPower;
              uniform float innerRadius;
              uniform float outerRadius;

              czm_material czm_getMaterial(czm_materialInput materialInput) {
                czm_material material = czm_getDefaultMaterial(materialInput);
                vec2 st = materialInput.st;
                float dist = distance(st, vec2(0.5, 0.5));
                float alpha = smoothstep(outerRadius, innerRadius, dist);
                alpha = pow(alpha, glowPower);
                material.diffuse = color.rgb;
                material.alpha = alpha * color.a;
                return material;
              }
            `
              }
            })
          });

          // 只对需要闪烁的实体进行动画配置
          if (shouldFlash) {
            flashConfigs.push({
              halo: halo,
              baseColor: color,
              baseSize: 15
            });
          }
        } catch (error) {
          console.error("处理实体时出错:", error, "实体数据:", entity);
        }
      });

      // 如果没有需要闪烁的实体，直接返回
      if (flashConfigs.length === 0) return;

      // 动画控制变量
      let animationTime = 0;
      const animationDuration = 2000; // 动画周期，毫秒

      // 启动动画循环
      this.flashInterval = setInterval(() => {
        animationTime = (animationTime + 50) % animationDuration;
        const normalizedTime = animationTime / animationDuration;

        // 更新所有需要闪烁的光晕点
        flashConfigs.forEach(config => {
          const {halo, baseColor, baseSize} = config;

          // 计算光晕大小（从原始大小到3倍）
          const sizeFactor = 1.0 + Math.sin(normalizedTime * Math.PI * 2) * 2;
          halo.pixelSize = baseSize * sizeFactor;

          // 计算光晕透明度（大小最大时透明度最低）
          const alphaFactor = 1.0 - (sizeFactor - 1.0) / 2.0;
          halo.color = new Cesium.Color(
              baseColor.red,
              baseColor.green,
              baseColor.blue,
              alphaFactor * 0.8
          );
        });
      }, 50);
    },
    /* addRainEllipse(centerCartesian, rainfall) {
      // 根据降雨量计算椭圆半径 (mm -> 米)
      const majorRadius = rainfall * this.rainEllipseScale; // 长轴半径
      const minorRadius = majorRadius * 0.7; // 短轴半径，形成椭圆

      // 计算椭圆边界的经纬度坐标
      const ellipseCoordinates = this.calculateEllipseCoordinates(
          centerCartesian,
          majorRadius,
          minorRadius,
          this.rainEllipseRotation
      );

      // 创建椭圆实体
      const ellipseEntity = this.viewer.entities.add({
        position: centerCartesian,
        ellipse: {
          semiMajorAxis: majorRadius,
          semiMinorAxis: minorRadius,
          height: 0,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          material: new Cesium.Color(1, 0, 0, 0.2), // 半透明红色
          outline: true,
          outlineColor: Cesium.Color.RED,
          outlineWidth: 1,
          rotation: this.rainEllipseRotation, // 椭圆旋转角度
          shadow: true,
          show: true,
          depthFailMaterial: new Cesium.Color(0, 0, 1, 0.1)
        },
      });

      // 存储区域坐标数据
      ellipseEntity.coordinates = ellipseCoordinates;

      // 检测灾害点是否在椭圆范围内
      this.checkDisasterPointsInEllipse(ellipseEntity, centerCartesian, majorRadius, minorRadius, rainfall);

      return ellipseEntity;
    },*/
    // 计算椭圆边界的经纬度坐标
    /*    calculateEllipseCoordinates(centerCartesian, majorRadius, minorRadius, rotation) {
          const centerCartographic = Cesium.Cartographic.fromCartesian(centerCartesian);
          const centerLon = centerCartographic.longitude;
          const centerLat = centerCartographic.latitude;

          const samples = 100; // 采样点数量，决定精度
          const coordinates = [];

          for (let i = 0; i < samples; i++) {
            const angle = (i / samples) * Math.PI * 2;

            // 考虑旋转的椭圆参数方程
            const cosAngle = Math.cos(angle);
            const sinAngle = Math.sin(angle);
            const cosRotation = Math.cos(rotation);
            const sinRotation = Math.sin(rotation);

            // 计算椭圆上的点在局部坐标系中的偏移
            const x = majorRadius * cosAngle * cosRotation - minorRadius * sinAngle * sinRotation;
            const y = majorRadius * cosAngle * sinRotation + minorRadius * sinAngle * cosRotation;

            // 将偏移转换为经纬度偏移
            const latOffset = y / 111320; // 1度纬度约等于111320米
            const lonOffset = x / (111320 * Math.cos(centerLat)); // 经度距离随纬度变化

            // 计算椭圆边界点的经纬度
            const lon = centerLon + lonOffset;
            const lat = centerLat + latOffset;

            // 存储坐标 [经度, 纬度]
            coordinates.push([Cesium.Math.toDegrees(lon), Cesium.Math.toDegrees(lat)]);
          }

          return coordinates;
        },*/
    // 检查灾害点是否在椭圆范围内
    /*    checkDisasterPointsInEllipse(ellipseEntity, centerCartesian, majorRadius, minorRadius, rainfall) {
          // 获取椭圆中心点的经纬度
          const centerCartographic = Cesium.Cartographic.fromCartesian(centerCartesian);
          // 存储在椭圆内的灾害点坐标
          const landslidePointsInside = [];
          const debrisFlowPointsInside = [];
          const secondaryRiskPointsInside = [];
          let target = [];
          let flag = 0;
          // 检查所有滑坡点
          this.landslidePoints.forEach(point => {
            if (this.isPointInEllipse(point, centerCartesian, majorRadius, minorRadius, this.rainEllipseRotation)) {
              landslidePointsInside.push(point);
              target.push(flag);
            }
            flag++;
          });

          // console.log("所有符合条件的点的索引:", target);

          // 检查所有泥石流点
          this.debrisFlowPoints.forEach(point => {
            if (this.isPointInEllipse(point, centerCartesian, majorRadius, minorRadius, this.rainEllipseRotation)) {
              debrisFlowPointsInside.push(point);
            }
          });
          // 检查所有次生灾害风险点
          this.secondaryRiskPoints.forEach(point => {
            if (this.isPointInEllipse(point, centerCartesian, majorRadius, minorRadius, this.rainEllipseRotation)) {
              secondaryRiskPointsInside.push(point);
            }
          });
          // 合并所有在椭圆内的灾害点坐标
          const allPointsInside = [
            ...landslidePointsInside,
            ...debrisFlowPointsInside,
            ...secondaryRiskPointsInside
          ];

          this.loadLandSlide(landslide, target);

          // 闪烁在椭圆内的灾害点
          if (allPointsInside.length > 0) {
            // 直接传递坐标数组到闪烁函数
            this.flashDisasterPoints(allPointsInside);

            console.log(`在椭圆内的灾害点数量: ${allPointsInside.length}`);
            console.log(`滑坡点: ${landslidePointsInside.length}`);
            console.log(`泥石流点: ${debrisFlowPointsInside.length}`);
            console.log(`次生灾害风险点: ${secondaryRiskPointsInside.length}`);

            // 预处理：将坐标数组转换为字符串集合
            const coordinateSet = new Set();
            secondaryRiskPointsInside.forEach(coords => {
              coordinateSet.add(coords.join(','));
            });

            // 主逻辑
            const tabledatas = this.DangerAreaData.features;
            const tableData = [];

            tabledatas.forEach(entity => {
              const entityCoords = entity.geometry.coordinates;
              const coordsStr = entityCoords.join(',');

              // 检查坐标字符串是否存在于集合中
              if (coordinateSet.has(coordsStr)) {
                console.log("找到了匹配的坐标:", entityCoords);
                tableData.push(entity.properties);
              }
            });

            this.tableData = tableData;
            this.total = this.tableData.length;
            this.showRiskTable = !this.showRiskTable;
            // 更新椭圆描述，显示检测结果
            const description = ellipseEntity.description.getValue();
            ellipseEntity.description = description + `
          <p><strong>影响灾害点:</strong> ${allPointsInside.length}个</p>
          <p><strong>滑坡:</strong> ${landslidePointsInside.length}个</p>
          <p><strong>泥石流:</strong> ${debrisFlowPointsInside.length}个</p>
          <p><strong>次生灾害风险点:</strong> ${secondaryRiskPointsInside.length}个</p>
        `;
          }
        },*/
    // 判断点是否在椭圆内 - 使用正确的椭圆方程
    /*isPointInEllipse(pointPosition, ellipseCenter, majorRadius, minorRadius, rotation) {
      // 将经纬度转换为笛卡尔坐标（世界坐标）
      const pointCartographic = Cesium.Cartographic.fromDegrees(
          pointPosition[0],
          pointPosition[1]
      );

      // 确保点高度与椭圆中心一致（消除高度影响）
      const centerCartographic = Cesium.Cartographic.fromCartesian(ellipseCenter);
      pointCartographic.height = centerCartographic.height;

      const pointCartesian = Cesium.Ellipsoid.WGS84.cartographicToCartesian(pointCartographic);

      // 计算点到椭圆中心的地表距离（沿地球表面）
      const geodesic = new Cesium.EllipsoidGeodesic();
      geodesic.setEndPoints(
          centerCartographic,
          pointCartographic
      );
      const surfaceDistance = geodesic.surfaceDistance;

      // 计算点相对于椭圆中心的方位角（弧度）
      const azimuth = geodesic.startHeading;

      // 计算椭圆在该方位角上的半径
      const cosAz = Math.cos(azimuth - rotation);
      const sinAz = Math.sin(azimuth - rotation);
      const ellipseRadiusAtAzimuth =
          (majorRadius * minorRadius) /
          Math.sqrt(
              Math.pow(minorRadius * cosAz, 2) +
              Math.pow(majorRadius * sinAz, 2)
          );

      // 比较距离与椭圆在该方向上的半径，增加容差值以解决浮点数精度问题
      const tolerance = 0.1; // 10厘米容差，可根据需要调整
      return surfaceDistance <= ellipseRadiusAtAzimuth + tolerance;
    },*/
    //  闪烁灾害点 - 光晕扩散效果
    /*flashDisasterPoints(points) {
      // 停止之前的闪烁动画
      if (this.flashInterval) {
        clearInterval(this.flashInterval);
      }
      if (this.haloCollection) {
        this.haloCollection.removeAll();
      }

      // 创建光晕点集合
      this.haloCollection = new Cesium.PointPrimitiveCollection();
      this.viewer.scene.primitives.add(this.haloCollection);

      // 从所有灾害实体中查找匹配的点
      const entitiesToFlash = [];
      this.disasterEntities.forEach(entity => {
        const position = entity.position.getValue(Cesium.JulianDate.now());
        const cartographic = Cesium.Cartographic.fromCartesian(position);
        const entityPoint = [
          Cesium.Math.toDegrees(cartographic.longitude),
          Cesium.Math.toDegrees(cartographic.latitude)
        ];

        // 检查该实体是否在需要闪烁的点列表中
        for (const point of points) {
          if (Math.abs(point[0] - entityPoint[0]) < 0.00001 &&
              Math.abs(point[1] - entityPoint[1]) < 0.00001) {
            entitiesToFlash.push(entity);

            // 创建光晕点
            this.haloCollection.add({
              position: position,
              pixelSize: 15,
              color: entity.point.color.getValue(),
              outlineColor: Cesium.Color.RED,
              outlineWidth: 1,
              show: true,
              // 自定义材质用于光晕效果
              material: new Cesium.Material({
                fabric: {
                  type: 'Halo',
                  uniforms: {
                    color: entity.point.color.getValue(),
                    glowPower: 0.5,
                    innerRadius: 0.5,
                    outerRadius: 1.0
                  },
                  source: `
                uniform vec4 color;
                uniform float glowPower;
                uniform float innerRadius;
                uniform float outerRadius;

                czm_material czm_getMaterial(czm_materialInput materialInput) {
                  czm_material material = czm_getDefaultMaterial(materialInput);
                  vec2 st = materialInput.st;
                  float dist = distance(st, vec2(0.5, 0.5));
                  float alpha = smoothstep(outerRadius, innerRadius, dist);
                  alpha = pow(alpha, glowPower);
                  material.diffuse = color.rgb;
                  material.alpha = alpha * color.a;
                  return material;
                }
              `
                }
              })
            });

            break;
          }
        }
      });

      // 如果没有找到匹配的实体，直接返回
      if (entitiesToFlash.length === 0) return;

      // 动画控制变量
      let animationTime = 0;
      const animationDuration = 2000; // 动画周期，毫秒

      // 启动动画循环
      this.flashInterval = setInterval(() => {
        animationTime = (animationTime + 50) % animationDuration;
        const normalizedTime = animationTime / animationDuration;

        // 更新所有光晕点的大小和透明度
        for (let i = 0; i < this.haloCollection.length; i++) {
          const halo = this.haloCollection.get(i);

          // 计算光晕大小（从原始大小到3倍）
          const baseSize = 15;
          const sizeFactor = 1.0 + Math.sin(normalizedTime * Math.PI * 2) * 2;
          halo.pixelSize = baseSize * sizeFactor;

          // 计算光晕透明度（大小最大时透明度最低）
          const alphaFactor = 1.0 - (sizeFactor - 1.0) / 2.0;
          const originalColor = entitiesToFlash[i].point.color.getValue();
          halo.color = new Cesium.Color(
              originalColor.red,
              originalColor.green,
              originalColor.blue,
              alphaFactor * 0.8
          );
        }
      }, 50); // 每50ms更新一次
    },*/
    // 创建图例
    createLegend() {
      const legendContent = this.$refs.legendContent;
      if (!legendContent) return;

      // 清空所有子元素
      while (legendContent.firstChild) {
        legendContent.removeChild(legendContent.firstChild);
      }
      // 新增：添加降雨区域图例项
      // this.addRainAreaLegend(legendContent);

      // 添加行政区划图例
      const addedDistricts = new Set();
      const districtItems = []; // 存储所有行政区划图例项

      this.administrationData.forEach((district, index) => {
        const districtId = `district${index}`;
        const districtName = district.features[0].properties.name;

        if (addedDistricts.has(districtName)) {
          return;
        }
        addedDistricts.add(districtName);

        const color = this.districtColors[districtId];

        if (color) {
          const item = document.createElement('div');
          item.className = 'legend-item district-item';
          item.style.display = 'flex';
          item.style.alignItems = 'center';
          item.style.marginBottom = '10px';
          item.style.width = '45%'; // 占45%宽度，留5%间隙

          const colorDiv = document.createElement('div');
          colorDiv.className = 'legend-color';
          colorDiv.style.backgroundColor = `rgba(${Math.floor(color.red * 255)}, ${Math.floor(color.green * 255)}, ${Math.floor(color.blue * 255)}, ${color.alpha})`;
          colorDiv.style.border = `1px solid rgba(${Math.floor(color.red * 255)}, ${Math.floor(color.green * 255)}, ${Math.floor(color.blue * 255)}, 1)`;
          colorDiv.style.width = '60px';
          colorDiv.style.height = '20px';
          colorDiv.style.marginRight = '10px';

          const textDiv = document.createElement('div');
          textDiv.className = 'legend-text';
          textDiv.textContent = districtName;
          textDiv.style.fontSize = '14px';
          textDiv.style.lineHeight = '20px';

          item.appendChild(colorDiv);
          item.appendChild(textDiv);
          districtItems.push(item);
        }
      });

      // 创建两排两列的容器
      const gridContainer = document.createElement('div');
      gridContainer.style.display = 'flex';
      gridContainer.style.flexWrap = 'wrap';
      gridContainer.style.gap = '10px';
      gridContainer.style.marginTop = '10px';

      // 添加到容器中，实现两列布局
      districtItems.forEach((item, index) => {
        gridContainer.appendChild(item);
      });

      legendContent.appendChild(gridContainer);

      // 优化图例容器样式
      if (legendContent.style) {
        legendContent.style.padding = '10px';
        legendContent.style.borderRadius = '5px';
        legendContent.style.backgroundColor = 'rgba(255,255,255,0.9)';
        legendContent.style.maxWidth = '300px'; // 限制最大宽度
      }

      // 新增：添加灾害点图例
      this.addDisasterLegend(legendContent);
    },
    // 添加降雨区域图例项的函数
    /*addRainAreaLegend(container) {
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.marginBottom = '15px';
      //item.style.fontWeight = 'bold'; // 加粗标题

      const colorDiv = document.createElement('div');
      colorDiv.className = 'legend-color';
      colorDiv.style.backgroundColor = 'rgba(180, 30, 30, 0.7)'; // 暗红色（RGB: 180, 30, 30）
      colorDiv.style.border = '1px solid rgba(180, 30, 30, 1)';
      colorDiv.style.width = '60px';
      colorDiv.style.height = '20px';
      colorDiv.style.marginRight = '10px';
      colorDiv.style.borderRadius = '100px'; // 关键：设置圆角实现椭圆效果（高度的一半）
      colorDiv.style.boxSizing = 'border-box'; // 包含边框尺寸

      const textDiv = document.createElement('div');
      textDiv.className = 'legend-text';
      textDiv.textContent = '降雨影响范围';
      textDiv.style.fontSize = '14px';
      textDiv.style.lineHeight = '20px';
      textDiv.style.flex = '1';

      item.appendChild(colorDiv);
      item.appendChild(textDiv);
      container.appendChild(item);
    },*/
    // 添加灾害点图例项
    addDisasterLegend(container) {
      // 滑坡图例（使用滑坡图标）
      const landslideItem = document.createElement('div');
      landslideItem.className = 'legend-item';
      landslideItem.style.display = 'flex';
      landslideItem.style.alignItems = 'center';
      landslideItem.style.marginBottom = '10px';

      const landslideImg = document.createElement('img');
      landslideImg.className = 'legend-icon';
      landslideImg.src = landslideIcon; // 滑坡图标
      landslideImg.alt = '历史滑坡灾害点图标';
      landslideImg.style.width = '20px';
      landslideImg.style.height = '20px';
      landslideImg.style.marginRight = '10px';
      landslideImg.style.objectFit = 'contain'; // 保持图标比例

      const landslideTextDiv = document.createElement('div');
      landslideTextDiv.className = 'legend-text';
      landslideTextDiv.textContent = '历史滑坡灾害点';
      landslideTextDiv.style.fontSize = '14px';
      landslideTextDiv.style.lineHeight = '20px';

      landslideItem.appendChild(landslideImg);
      landslideItem.appendChild(landslideTextDiv);
      container.appendChild(landslideItem);

      // 泥石流图例（使用泥石流图标）
      const debrisFlowItem = document.createElement('div');
      debrisFlowItem.className = 'legend-item';
      debrisFlowItem.style.display = 'flex';
      debrisFlowItem.style.alignItems = 'center';
      debrisFlowItem.style.marginBottom = '10px';

      const debrisFlowImg = document.createElement('img');
      debrisFlowImg.className = 'legend-icon';
      debrisFlowImg.src = debrisFlowIcon; // 泥石流图标
      debrisFlowImg.alt = '历史泥石流灾害点图标';
      debrisFlowImg.style.width = '20px';
      debrisFlowImg.style.height = '20px';
      debrisFlowImg.style.marginRight = '10px';
      debrisFlowImg.style.objectFit = 'contain'; // 保持图标比例

      const debrisFlowTextDiv = document.createElement('div');
      debrisFlowTextDiv.className = 'legend-text';
      debrisFlowTextDiv.textContent = '历史泥石流灾害点';
      debrisFlowTextDiv.style.fontSize = '14px';
      debrisFlowTextDiv.style.lineHeight = '20px';

      debrisFlowItem.appendChild(debrisFlowImg);
      debrisFlowItem.appendChild(debrisFlowTextDiv);
      container.appendChild(debrisFlowItem);

      // 地质灾害风险区图例（使用风险区图标）
      const dangerItem = document.createElement('div');
      dangerItem.className = 'legend-item';
      dangerItem.style.display = 'flex';
      dangerItem.style.alignItems = 'center';
      dangerItem.style.marginBottom = '10px';

      const dangerImg = document.createElement('img');
      dangerImg.className = 'legend-icon';
      dangerImg.src = riskArea; // 风险区图标
      dangerImg.alt = '地质灾害风险点图标';
      dangerImg.style.width = '20px';
      dangerImg.style.height = '20px';
      dangerImg.style.marginRight = '10px';
      dangerImg.style.objectFit = 'contain'; // 保持图标比例

      const dangerTextDiv = document.createElement('div');
      dangerTextDiv.className = 'legend-text';
      dangerTextDiv.textContent = '地质灾害风险点';
      dangerTextDiv.style.fontSize = '14px';
      dangerTextDiv.style.lineHeight = '20px';

      dangerItem.appendChild(dangerImg);
      dangerItem.appendChild(dangerTextDiv);
      container.appendChild(dangerItem);
    },
    // 更新图例
    updateLegend() {
      this.createLegend();
    },
    // 计算并显示弹出面板
    async calculateAndShowPopup(entity, movementPosition) {
      try {
        const scene = this.viewer.scene;
        const clock = this.viewer.clock;
        // 获取当前时间
        const currentTime = clock.currentTime;
        // 使用当前时间获取位置值
        const position = entity.position.getValue(currentTime);
        // 正确检查位置有效性
        if (!position ||
            isNaN(position.x) || isNaN(position.y) || isNaN(position.z) ||
            !isFinite(position.x) || !isFinite(position.y) || !isFinite(position.z)) {
          console.log('位置无效或未定义');
          return;
        }
        // 转换为窗口坐标
        const windowPosition = scene.cartesianToCanvasCoordinates(position);
        if (windowPosition) {
          // 计算最终位置（添加偏移量）
          this.popupPosition = {
            x: windowPosition.x + 20,
            y: windowPosition.y - 10
          };
          // 检测边界防止面板超出视口
          this.checkPopupBoundary();
          // 显示弹出面板
          this.popupVisible = true;
          // 平滑定位到点击的实体
          await this.viewer.flyTo(entity, {
            duration: 0.5,
            offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-30), 5000)
          });
        }
      } catch (error) {
        console.error("计算弹出面板位置出错:", error);
      }
    },
    // 检测弹出面板边界
    checkPopupBoundary() {
      const panelWidth = 280;
      const panelHeight = 200;
      const canvas = this.viewer.canvas;
      const rect = canvas.getBoundingClientRect();
      // 防止面板超出右边界
      if (this.popupPosition.x + panelWidth > rect.right) {
        this.popupPosition.x = rect.right - panelWidth - 10;
      }
      // 防止面板超出下边界
      if (this.popupPosition.y + panelHeight > rect.bottom) {
        this.popupPosition.y = rect.bottom - panelHeight - 10;
      }
      // 防止面板超出左边界
      if (this.popupPosition.x < 10) {
        this.popupPosition.x = 10;
      }
      // 防止面板超出上边界
      if (this.popupPosition.y < 10) {
        this.popupPosition.y = 10;
      }
    },
    // 计算弹出面板左坐标
    calculatePopupLeft() {
      return this.popupPosition.x;
    },
    // 计算弹出面板上坐标
    calculatePopupTop() {
      return this.popupPosition.y;
    },
    // 关闭弹出面板
    closePopup() {
      this.popupVisible = false;
      this.selectedEntityData = null;
    },
    // 阻止事件冒泡
    stopPropagation(e) {
      e.stopPropagation();
    },
    // 获取灾害类型名称
    getDisasterTypeName(type) {
      const typeMap = {
        'landslide': '滑坡',
        'debrisFlow': '泥石流',
        'secondaryRisk': '次生灾害风险区'
      };
      return typeMap[type] || type;
    },
    toggleRiskTable() {
      this.showRiskTable = !this.showRiskTable;
    },
    // 行点击事件处理
    handleRowClick(row, event, column) {
      console.log('点击行数据:', row);
      this.jumpToPosition(row);
    },
    // 跳转到指定位置
    jumpToPosition(row) {
      if (!this.viewer || !row.lon || !row.lat) return;
      // 从行数据获取经纬度
      const longitude = parseFloat(row.lon);
      const latitude = parseFloat(row.lat);

      // 设置视角参数
      const height = 1000; // 视角高度(米)
      const heading = 0;   // 方位角(弧度)
      const pitch = -Math.PI / 4; // 俯仰角(弧度)
      // 计算目标位置
      const target = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
      // 跳转到目标位置
      this.viewer.camera.setView({
        destination: target,
        orientation: {
          // heading: heading,
          // pitch: pitch,
          roll: 0
        },
        duration: 2.0 // 动画持续时间(秒)
      });
      // 可选：高亮显示该风险区
      this.highlightRiskArea(row);
    },
    // 高亮显示风险区
    highlightRiskArea(row) {
      // 这里可以添加高亮显示逻辑
      // 例如：在地图上标记该风险区位置
      console.log('高亮显示风险区:', row.disasterName);
    },
    // 页码变化
    handleCurrentChange(page) {
      this.currentPage = page;
      this.handlePagination(this.allData[this.selectedTableType] || []);
    },
    // 每页条数变化
    handleSizeChange(size) {
      this.pageSize = size;
      this.currentPage = 1;
      this.handlePagination(this.allData[this.selectedTableType] || []);
    },
    loadData() {
      this.loading = true;
      setTimeout(() => {
        this.loading = false;
        this.total = this.tableData.length;
      }, 500);
    },
    toggleTableExpand() {
      this.isExpanded = !this.isExpanded;

      // 切换时如果表格处于收缩状态，隐藏分页组件
      if (!this.isExpanded) {
        this.currentPage = 1; // 重置到第一页
      }
    },
    toggleTablePanel() {
      this.showRiskTable = !this.showRiskTable;
    },
    // 切换致灾因子视图
    toggleHazardFactorView() {
      this.isHazardFactorView = !this.isHazardFactorView;
    },
    // 修改致灾因子值
    submitFactorChanges() {
      // 获取表单值
      getGeologicalDisasterHideByLandSlideList().then(res => {
        this.formatUpdateAnalyzedDataList = res.data
        const updatedDataList = this.formatUpdateAnalyzedDataList
        updatedDataList.forEach(item => {
          if (item.geologicalDisasterHideDTO.id === this.selectedEntityData.factorVoList.hideId) {
            // 转换数据格式
            const requestData = this.attributeMap.map(mapItem => {
              // 获取实体中对应别名的属性数据
              const entityAttr = this.selectedEntityData.factorVoList [mapItem.attributeNameAlias] || {};
              return {
                // 核心 ID 使用实体中的实际值
                hideId: this.selectedEntityData.factorVoList.hideId,
                // 基础属性从映射表获取
                attributeId: mapItem.attributeId,
                valueId: mapItem.valueId,
                attributeName: mapItem.attributeName,
                attributeNameAlias: mapItem.attributeNameAlias,
                // 动态值优先使用实体中用户修改后的数据
                factorValue: entityAttr.factorValue !== undefined ? entityAttr.factorValue : mapItem.factorValue,
                unit: entityAttr.unit || mapItem.unit || ''
              };
            }).filter(item => item.factorValue !== '' && item.factorValue !== null);
            // 发送请求
            rainSlideFactorUpdata(requestData).then(res => {
              this.formatUpdateAnalyzedData = res.data
              // 将11条因子记录融合为一条包含所有因子字段的记录
              this.formatUpdateAnalyzedData.factorVoList = this.formatUpdateAnalyzedData.factorVoList.reduce((merged, item) => {
                // 提取当前因子的关键信息
                const {
                  hideId,
                  attributeId,
                  valueId,
                  attributeName,
                  factorValue,
                  unit,
                  attributeNameAlias
                } = item;
                // 初始化合并对象（首次循环时）
                if (Object.keys(merged).length === 0) {
                  merged.hideId = hideId; // 保留hideId（假设所有记录的hideId相同）
                  merged.attributeIds = []; // 存储所有attributeId
                  merged.valueIds = []; // 存储所有valueId
                }
                // 收集所有attributeId和valueId
                merged.attributeIds.push(attributeId);
                merged.valueIds.push(valueId);
                // 以属性别名为键，存储因子值和单位
                merged[attributeNameAlias] = {
                  attributeName: attributeName, // 保留属性名称
                  factorValue: factorValue,     // 因子值
                  unit: unit                     // 单位
                };
                return merged;
              }, {});
              console.log(this.formatUpdateAnalyzedData.factorVoList, "新值")
              this.selectedEntityData.factorVoList = this.formatUpdateAnalyzedData.factorVoList;
              console.log(this.selectedEntityData.factorVoList, "表格值")
              this.selectedEntityData.predict = this.formatUpdateAnalyzedData.predict
            })
          }
        })
      })
    },
    // 资源释放
    closeInterface() {
      this.isClosed = true;
      this.releaseAllResources();
      // 清空DOM引用
      const container = this.$refs.cesiumContainer;
      if (container) container.innerHTML = '';
      // 触发组件销毁
      this.$destroy();
    },
    // 释放所有资源的核心方法
    releaseAllResources() {
      // 1. 清理Cesium核心资源
      if (this.viewer) {
        // 移除所有实体
        this.viewer.entities.removeAll();
        // 移除所有数据源
        this.viewer.dataSources.removeAll();
        // 移除所有图元
        this.viewer.scene.primitives.removeAll();
        // 移除所有 imagery图层
        this.viewer.imageryLayers.removeAll();
        // 销毁viewer实例
        this.viewer.destroy();
        this.viewer = null;
      }

      // 2. 清理定时器和动画帧
      this.timers.forEach(id => {
        if (typeof id === 'number') {
          clearInterval(id);
          clearTimeout(id);
        } else {
          cancelAnimationFrame(id);
        }
      });
      this.timers = [];

      // 3. 清理事件监听
      if (this.clickHandler) {
        this.clickHandler.destroy();
        this.clickHandler = null;
      }
      if (this.handler) {
        this.handler.destroy();
        this.handler = null;
      }
      document.removeEventListener('keydown', this.onKeyDown);
      if (this.viewer?.camera?.moveEnd) {
        this.viewer.camera.moveEnd.removeEventListener(this.handleCameraMoveEnd);
      }

      // 4. 清理自定义数据结构
      this.disasterEntities = [];
      this.landslideEntities = [];
      this.debrisFlowEntities = [];
      this.secondaryRiskEntities = [];
      this.rainPoints = [];
      this.entityCache.clear(); // 清空实体缓存

      // 5. 清理DOM元素
      const rainControl = document.getElementById('rain-control-panel');
      if (rainControl) rainControl.remove();
      const legend = this.$refs.legendContent;
      if (legend) legend.innerHTML = '';

      // 6. 强制垃圾回收（浏览器环境下触发）
      if (window.gc) {
        try {
          window.gc();
        } catch (e) {
          console.log('触发垃圾回收失败:', e);
        }
      }

      console.log('所有资源已释放');
    },
    // 重写定时器相关方法，统一管理定时器ID
    setSafeInterval(fn, delay) {
      const id = setInterval(fn, delay);
      this.timers.push(id);
      return id;
    },
    setSafeTimeout(fn, delay) {
      const id = setTimeout(fn, delay);
      this.timers.push(id);
      return id;
    },
    requestSafeAnimationFrame(fn) {
      const id = requestAnimationFrame(fn);
      this.timers.push(id);
      return id;
    },
    // 加载
    startLoading() {
      this.loadingModel = true;
    },
    // 停止加载
    stopLoading() {
      this.loadingModel = false;
    },
    // 表格类型改变时触发
    handleTableTypeChange(type) {
      this.selectedTableType = type;
      this.currentTableConfig = this.tableConfigs[type];
      this.currentPage = 1; // 重置页码
      this.loadTableData(type); // 加载对应类型的数据
    },
    // 加载表格数据
    loadTableData(type) {
      this.loading = true;
      // 这里根据类型加载不同的数据
      this.tableData = this.allData[type] || [];

      console.log(this.tableData,"当前的数据是：============")

      this.total = this.tableData.length;
      this.handlePagination(this.tableData);
      this.loading = false;
    },
    // 处理分页
    handlePagination(data) {
      this.displayData = data.slice(
          (this.currentPage - 1) * this.pageSize,
          this.currentPage * this.pageSize
      );
    },

  }

}
</script>

<style scoped>
.cesium-container {
  width: 100%;
  height: calc(100vh - 50px);
  padding: 0;
  margin: 0;
  position: relative;
  overflow: hidden;
}

/* 控制面板样式优化 */
.controls {
  position: absolute;
  top: 10px;
  left: 35%;
  z-index: 100;
}

.btn-group {
  display: flex;
  gap: 8px; /* 按钮间距 */
}

.rain-btn, .weather-btn, .admin-btn, .table-btn {
  background-color: rgba(35, 158, 187, 1);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  white-space: nowrap;
  min-width: 100px; /* 最小宽度确保按钮不挤压 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.rain-btn:hover, .weather-btn:hover:not(.disabled), .admin-btn:hover {
  background-color: rgba(33, 158, 188, 1);
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.weather-btn.disabled {
  background-color: rgba(150, 150, 150, 0.8);
  cursor: not-allowed;
}

/* 响应式处理 - 小屏幕下换行 */
@media (max-width: 640px) {
  .btn-group {
    flex-direction: column; /* 小屏幕下垂直排列 */
    gap: 6px;
  }

  .rain-btn, .weather-btn, .admin-btn {
    min-width: 80px;
  }
}

/* 加载指示器 */
.loading-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 100;
}

/* 暴雨信息面板样式优化 */
.rain-info-panel {
  position: absolute;
  top: 130px;
  left: 10px;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15px;
  border-radius: 6px;
  width: 240px;
  height: 190px;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.panel-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #444;
  text-align: center;
}

.panel-content div {
  margin-bottom: 12px;
  display: flex;

}

.panel-content label {
  width: 70px;
  /* text-align: right; 标签文本右对齐 */
  font-weight: 500;
  flex-shrink: 0; /* 防止标签宽度被压缩 */
  display: inline-block; /* 确保宽度生效 */
}

.jiangyuliang {
  text-align-last: justify;
}

.panel-content input {
  width: 60px;
  padding: 6px 8px;
  border: none;
  border-radius: 4px;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  height: 30px; /* 固定高度确保垂直居中 */
  box-sizing: border-box; /* 包含内边距 */
}

/* 优化单位文本样式，确保与输入框垂直对齐 */
.panel-content span {
  width: auto; /* 固定单位宽度，实现对齐 */
  text-align: left; /* 单位文本左对齐 */
  display: inline-block; /* 转为行内块元素便于设置宽度 */
  height: 30px; /* 与输入框等高，确保垂直对齐 */
  line-height: 30px; /* 垂直居中 */
}

/* 按钮组样式优化，确保按钮对齐 */
.button-group {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.panel-content button {
  padding: 6px 12px;
  background-color: #386641;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  height: 32px; /* 固定按钮高度，确保对齐 */
  line-height: normal; /* 重置行高 */
}

.panel-content button:last-child {
  background-color: #bc4749;
  margin-left: 10px;
}

.panel-content button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* 图例面板样式 */
.legend-panel {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 6px;
  padding: 10px;
  z-index: 100;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  max-height: 70%;
  overflow-y: auto;
}

.legend-title {
  font-size: 17px;
  font-weight: bold;
  margin-bottom: 8px;
  padding-bottom: 5px;
  border-bottom: 1px solid #ddd;
  text-align: center;
}

.legend-content {
  font-size: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.legend-color {
  width: 16px;
  height: 16px;

  margin-right: 6px;
  border-radius: 2px;
}

.legend-text {
  white-space: nowrap;
}

.legend-panel {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 6px;
  padding: 10px;
  z-index: 100;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  max-height: 70%;
  overflow-y: auto;
  max-width: 300px; /* 新增：限制图例最大宽度 */
}

.legend-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 8px;
  padding-bottom: 5px;
  border-bottom: 1px solid #ddd;
  text-align: center;
}

.legend-content {
  font-size: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.legend-color {
  width: 16px;
  height: 16px;
  margin-right: 6px;
  border-radius: 2px;
}

.legend-text {
  white-space: nowrap;
}

.disaster-popup {
  position: absolute;
  z-index: 1000;
  width: 330px; /* 减小宽度 */
  background-color: white;
  border-radius: 6px; /* 减小圆角 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 减小阴影 */
  font-family: 'Source Han Sans CN', sans-serif;
  overflow: hidden;
  transition: opacity 0.2s, transform 0.2s;
  transform-origin: top left;
  opacity: 0;
  transform: scale(0.95);
  pointer-events: none;
  border: 1px solid #e0e0e0;
  font-size: 13px; /* 减小整体字体大小 */
}

.disaster-popup[style*="display: block"] {
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
  transition: all 0.3s ease;
}

.popup-header {
  padding: 8px 12px; /* 减小内边距 */
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.popup-header h3 {
  margin: 0;
  font-size: 14px; /* 减小标题字体大小 */
  font-weight: 600;
  color: #333;
}

.popup-header button {
  background: none;
  border: none;
  font-size: 14px; /* 减小关闭按钮大小 */
  cursor: pointer;
  color: #6c757d;
  transition: color 0.2s;
}

.popup-header button:hover {
  color: #333;
}

.popup-content {
  padding: 10px 12px; /* 减小内边距 */
}

.disaster-table {
  width: 100%;
  border-collapse: collapse;
}

.disaster-table th,
.disaster-table td {
  padding: 6px 8px; /* 减小单元格内边距 */
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.disaster-table th {
  font-weight: 500;
  color: #495057;
  width: 35%; /* 固定标题列宽度 */
}

.disaster-table td {
  color: #333;
  word-break: break-all;
}

.disaster-table tr:last-child th,
.disaster-table tr:last-child td {
  border-bottom: none; /* 最后一行不显示底边 */
}

.popup-footer button {
  padding: 4px 10px; /* 减小按钮尺寸 */
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 12px; /* 减小按钮字体大小 */
}

.popup-footer button:hover {
  background-color: #308ee0;
}

/* 风险区表格样式 */
.risk-table-container {
  position: fixed;
  top: 7%;
  left: 13%;
  width: 500px;
  max-height: 500px;
  overflow: hidden;
  z-index: 900;
  transition: all 0.3s ease;
  background-color: rgba(52, 152, 219, 0.1);
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background-color: rgba(43, 47, 51, 0.6);
}

:deep(.el-table tr) {
  background-color: rgba(43, 47, 51, 0.6);
  height: 55px;
}

.title-text {
  font-size: 16px;
  font-weight: 500;
  color: white;
  text-align: center;
  width: 100%;
  margin-top: 5px;
}

/* 修改 el-table 的样式 */
:deep(.el-table) {
  background-color: transparent;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

:deep(.el-table th) {
  background-color: rgba(52, 73, 94, 0.2);
  border-top: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
  color: white;
  font-weight: 500;
  font-size: 14px;
}

:deep(.el-table td) {
  background-color: rgba(43, 47, 51, 0.6);
  border-top: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
  color: white;
}

:deep(.el-table--enable-row-hover .el-table__body tr:hover > td) {
  background-color: rgba(43, 47, 51, 0.6);
}

:deep(.el-table__body tr.current-row > td) {
  background-color: rgba(52, 152, 219, 0.1);
}

.table-pagination {
  color: white;
  padding: 15px 10px;
  background-color: rgba(43, 47, 51, 0);
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: center;
}

/* 修改分页器样式 */
:deep(.el-pagination) {
  background-color: transparent;
}

:deep(.el-pagination button) {
  background-color: transparent;
  border: 1px solid #ebeef5;
}

:deep(.el-pagination .el-select .el-input) {
  background-color: transparent;
}

:deep(.el-pagination .el-input__inner) {
  background-color: transparent;
  border: 1px solid #ebeef5;
}

:deep(.el-table .el-table__header-wrapper th, .el-table .el-table__fixed-header-wrapper th) {
  background-color: rgba(43, 47, 51, 0.6) !important;
}

.rf_table {
  background-color: rgba(43, 47, 51, 0.6);
  padding: 15px 20px;
}

:deep(.el-pagination>.is-first) {
  margin-left: 0 !important;
  color: white !important;
}

:deep(.el-pagination__goto) {
  color: white;
}

:deep(.el-pagination__classifier) {
  color: white;
}

:deep(.el-table__row) {
  border: 1px solid #ebeef5;
}

.el-table__body-wrapper .cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.el-table__body-wrapper .cell:hover {
  overflow: visible;
  white-space: normal;
}

:deep(.el-table thead) {
  height: 55px !important;
}

.form-item {
  display: flex;
  align-items: self-start;
  margin-bottom: 15px;
}

/* 输入框与单位在同一行显示的样式 */
.input-with-unit {
  width: 200px;
  display: flex;
  gap: 8px; /* 输入框和单位之间的间距 */
}

/* 单位样式 */
.unit {
  white-space: nowrap; /* 防止单位换行 */
  color: #606266; /* 与Element UI表单文字颜色保持一致 */
}

.probability-level {
  margin-top: 10px;
  margin-bottom: 10px;
  font-size: 20px;
  color: red;
}


</style>
