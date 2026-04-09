<template>
  <div id="cesiumContainer">
    <!-- 新增的西安各区县天气表格区域 -->
    <div class="data-table">
      <button @click="toggleTableVisibility" class="toggle-table-btn">{{ isTableVisible ? '-' : '+' }}</button>
      <div class="table-title">西安各区县天气</div>
      <table v-if="isTableVisible" style="table-layout: fixed;">
        <thead>
        <tr >
          <th style="text-align: center" v-for="(header, index) in tableHeaders" :key="index">{{ header }}</th>
        </tr>
        </thead>

        <tbody>
        <!-- 只渲染当前页的数据 -->
        <tr v-if="weather_data.length === 0">
          <td :colspan="tableHeaders.length" class="no-data-cell">
            正在加载中...
          </td>
        </tr>
        <tr v-for="(item, index) in currentPageData" :key="index">
          <td style="white-space:nowrap;overflow:hidden;text-overflow: ellipsis;" :title="item.name">
            {{ item.name }}
          </td>
          <td style="white-space:nowrap;overflow:hidden;text-overflow: ellipsis;" :title="item.rainfall">
            {{ item.rainfall }}mm
          </td>
          <td style="white-space:nowrap;overflow:hidden;text-overflow: ellipsis;" :title="item.temperature">
            {{ item.temperature }}°C
          </td>
          <td style="white-space:nowrap;overflow:hidden;text-overflow: ellipsis;" :title="item.humidity">
            {{ item.humidity }}%
          </td>
        </tr>
        </tbody>
      </table>
      <div class="pagination-controls" v-if="isTableVisible">
        <button @click="prevPage" :disabled="currentPage === 1">上一页</button>
        <span>{{ currentPage }} / {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages">下一页</button>
        <span class="total-items">共 {{ weather_data.length }} 条</span>
      </div>
    </div>

    <!-- 新增的预警点信息表格区域 -->
    <div  v-if="tableChange==true" class="warn-point-table">
      <button @click="togglePointTableVisibility" class="toggle-point-table-btn">{{ iswarn_point_table ? '-' : '+' }}</button>
      <div class="table-title">预警点信息</div>
      <table v-if="iswarn_point_table" style="table-layout: fixed;">
        <thead>
        <tr >
          <th style="text-align: center" v-for="(header, index) in point_tableHeaders" :key="index">{{ header }}</th>
        </tr>
        </thead>

        <tbody>
        <tr v-if="warn_point.length === 0">
          <td :colspan="point_tableHeaders.length" class="no-data-cell">
            暂无数据
          </td>
        </tr>
        <!-- 只渲染当前页的数据 -->
        <tr v-for="(item, index) in currentPointPageData" :key="index" @click="pointTableClick(item)" >
          <td style="white-space:nowrap;overflow:hidden;text-overflow: ellipsis;" :title="item.disasterName">
            {{ item.disasterName }}
          </td>
          <td style="white-space:nowrap;overflow:hidden;text-overflow: ellipsis;" :title="item.disasterType">
            {{ item.disasterType }}
          </td>
          <td style="white-space:nowrap;overflow:hidden;text-overflow: ellipsis;" :title="item.riskGrade">
            {{ item.riskGrade}}
          </td>
          <td style="white-space:nowrap;overflow:hidden;text-overflow: ellipsis;" :title="item.scaleGrade">
            {{ item.scaleGrade}}
          </td>
          <td style="white-space:nowrap;overflow:hidden;text-overflow: ellipsis;" :title="item.village">
            {{ item.village}}
          </td>
        </tr>
        </tbody>
      </table>
      <div class="pagination-controls" v-if="iswarn_point_table">
        <button @click="prevPointPage" :disabled="currentPointPage === 1">上一页</button>
        <span>{{ currentPointPage }} / {{ totalPointPages }}</span>
        <button @click="nextPointPage" :disabled="currentPointPage === totalPointPages">下一页</button>
        <span class="total-items">共 {{ warn_point.length }} 条</span>
      </div>
    </div>

    <!-- 新增的历史案例表格区域 -->
    <div v-if="tableChange==false" class="warn-point-table">
      <button @click="togglePointTableVisibility" class="toggle-point-table-btn">
        {{ iswarn_point_table ? '-' : '+' }}
      </button>
      <div class="table-title">历史案例信息</div>

      <table v-if="iswarn_point_table && hisDas.length > 0" style="table-layout: fixed;">
        <thead>
        <tr>
          <th style="text-align: center" v-for="(header, index) in history_disasterHeaders" :key="index">
            {{ header }}
          </th>
        </tr>
        </thead>

        <tbody>
        <!-- 使用 v-for 遍历数组 -->
        <tr v-for="(item, index) in hisDas" :key="index">
          <td style="white-space:nowrap;overflow:hidden;text-overflow: ellipsis;" :title="item.locateName">
            {{ item.locateName }}
          </td>
          <td style="white-space:nowrap;overflow:hidden;text-overflow: ellipsis;" :title="item.historyDisasterevent">
            {{ item.historyDisasterevent }}
          </td>
          <td style="white-space:nowrap;overflow:hidden;text-overflow: ellipsis;" :title="item.historyDisastertype">
            {{ Array.isArray(item.historyDisastertype) ? item.historyDisastertype.join(', ') : item.historyDisastertype }}
          </td>
          <td style="white-space:nowrap;overflow:hidden;text-overflow: ellipsis;" :title="item.missing_persons">
            {{ item.missing_persons }}
          </td>
          <td style="white-space:nowrap;overflow:hidden;text-overflow: ellipsis;" :title="item.collapsedHouses">
            {{ item.collapsedHouses }}
          </td>
        </tr>
        </tbody>
      </table>

      <!-- 添加空数据提示 -->
      <div v-if="iswarn_point_table && hisDas.length === 0" class="no-data">
        暂无历史案例数据
      </div>
    </div>

    <div
        v-show="popupVisible"
        class="cesium-info-window"
        :style="{ left: popupPosition.left + 'px', top: popupPosition.top + 'px' }"
    >
      <div class="disaster-popup">
        <div class="popup-header">
          <h3>{{ popupType === 'riskArea' ? '风险区信息' : '隐患点信息' }}</h3>
<!--          <button class="toggle-btn" @click="handleMatchHistory">匹配历史案例</button>-->
          <button class="close-btn" @click="handleClosePopup">关闭</button>
        </div>
        <table class="disaster-info-table">
          <tbody>
          <!-- 滑坡/泥石流隐患点 -->
          <template v-if="popupType === 'slide' || popupType === 'flow'">
            <tr>
              <td class="label">城市</td>
              <td>{{ popupInfo.city }}</td>
            </tr>
            <tr>
              <td class="label">地区</td>
              <td>{{ popupInfo.county }}</td>
            </tr>
            <tr>
              <td class="label">灾害名称</td>
              <td>{{ popupInfo.disasterName }}</td>
            </tr>
            <tr>
              <td class="label">经度</td>
              <td>{{ popupInfo.lon }}</td>
            </tr>
            <tr>
              <td class="label">纬度</td> <!-- 修复原经度重复问题 -->
              <td>{{ popupInfo.lat }}</td>
            </tr>
            <tr>
              <td class="label">灾害位置</td>
              <td>{{ popupInfo.position }}</td>
            </tr>
            <tr>
              <td class="label">危险等级</td>
              <td>{{ popupInfo.riskGrade }}</td>
            </tr>
            <tr>
              <td class="label">规模等级</td>
              <td>{{ popupInfo.scaleGrade }}</td>
            </tr>
          </template>

          <!-- 风险区信息 -->
          <template v-if="popupType === 'riskArea'">
            <tr>
              <td class="label">风险区名称</td>
              <td>{{ popupInfo.disasterName }}</td>
            </tr>
            <tr>
              <td class="label">巡查员姓名</td>
              <td>{{ popupInfo.inspectorName }}</td>
            </tr>
            <tr>
              <td class="label">巡查员电话</td>
              <td>{{ popupInfo.inspectorTele }}</td>
            </tr>
            <tr>
              <td class="label">经度</td>
              <td>{{ popupInfo.lon }}</td>
            </tr>
            <tr>
              <td class="label">纬度</td> <!-- 修复原经度重复问题 -->
              <td>{{ popupInfo.lat }}</td>
            </tr>
            <tr>
              <td class="label">风险区位置</td>
              <td>{{ popupInfo.position }}</td>
            </tr>
            <tr>
              <td class="label">住房</td>
              <td>{{ popupInfo.housing }}户</td>
            </tr>
            <tr>
              <td class="label">户籍人口</td>
              <td>{{ popupInfo.addressPopulation }}</td>
            </tr>
            <tr>
              <td class="label">居民户数</td>
              <td>{{ popupInfo.residentCounts }}</td>
            </tr>
          </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 图表容器 -->
    <div v-if="showChart" class="chart-container">
      <div id="main" style="height: 100%"></div>
    </div>
  </div>
</template>

<script>
import * as Cesium from "cesium";
import "cesium/Source/Widgets/widgets.css";
import lineData from "@/assets/西安断层数据.json";
import DebrisFlow from "@/assets/static/disaster/Huapo.json"
import landslideIcon from "@/assets/images/landslide.png"
import riskArea from "@/assets/static/disaster/xian_risk.json"
import riskAreaIcon from "@/assets/images/riskArea.png"
import flowIcon from "@/assets/images/DebrisFlow.png"
import {init_cesium_navigation, initCesium} from '@/cesium/initLayer.js'
import {getFlow, getHistoryDisaster, getRisk, getSlide} from "@/api/system/association_analysis.js";
import * as echarts from "echarts";
import basicLayers from "@/cesium/basicLayers.js";
import {getRain} from "@/api/system/aroundanalysis.js";

export default {
  name: "index",
  data() {
    return {
      image_landslideIcon:landslideIcon,
      viewer: null,
      handler: null, // 创建共享的 handler
      tdtToken: "07f071d2d20098468ee7697112e8fc58",//天地图密钥
      weather: "c8e118cd71b1ab650c73d86a6eaa7cba",//高德密钥
      mapViewer: undefined,
      isDebrisFlowActive: false,
      debrisFlowPrimitive: null,
      flowSpeed: 5,
      flowProgress: 0,
      showChart: false,
      animationCallback: null,
      tempEntities: [],
      popupVisible: false, // 弹窗的显示与隐藏，传值给子组件
      popupPosition: {x: 0, y: 0}, // 弹窗显示位置，传值给子组件
      popupData: {}, // 弹窗内容，传值给子组件
      lineData: lineData,
      line_data: [], // 西安所有断裂带的数据
      FaultZone: [], // 西安所有断裂带点的数据
      showFaultZone: false,  // 控制断裂带显示状态的变量
      DebrisFlow: DebrisFlow, // 泥石流隐患点
      hasDrawn: false, // 标记是否已经点击过
      isButtonDisabled: false,
      buttonText: '地震模拟',
      operationCompleted: false,
      dialogVisible: false,
      showInfoPanel: false,
      magnitude: 6.0,
      depth: 10,
      selectedPosition: null,
      earthquakeMode: false,
      bearing: 0,//烈度圈偏转角度
      earthPoint:null,//地震点
      eqlistName: '',
      rainData: null,
      //天气相关数据
      weatherData: null,
      weatherLoading: false,
      weatherError: null,
      weatherIconMap: {
        '晴': '☀️',
        '多云': '🌤️',
        '少云': '⛅',
        '阴': '☁️',
        '小雨': '🌧️',
        '中雨': '🌧️',
        '大雨': '🌧️',
        '暴雨': '🌧️',
        '雷阵雨': '⛈️',
        '小雪': '🌨️',
        '中雪': '🌨️',
        '大雪': '🌨️',
        '雾': '🌫️',
        '霾': '🌫️',
        '扬沙': '🌫️',
        '浮尘': '🌫️',
        '沙尘暴': '🌫️',
        '强沙尘暴': '🌪️',
        '龙卷风': '🌪️',
        '雨夹雪': '🌨️',
        '冻雨': '🌨️',
        '热': '🌡️',
        '冷': '❄️',
        '未知': '❓'
      },
      // administrationData: [BaQiaoArea, BeiLin, ChangAn, GaoLing, HuYi, LanTIan, LianHu, LinTong, WeiYang, XinCheng, YanLiang, YanTa, ZhouZhi],
      // adminDataSources:[],
      // cityAdcode: '610100', // 西安市 adcode
      cityWeather: {}, // 西安市整体天气
      districts: [ // 区县列表（含 adcode）
        { name: '灞桥区', adcode: '610111' },
        // { name: '碑林区', adcode: '610103' },//无
        { name: '长安区', adcode: '610116' },
        { name: '高陵区', adcode: '610117' },
        { name: '鄠邑区', adcode: '610118' },
        { name: '蓝田县', adcode: '610122' },
        // { name: '莲湖区', adcode: '610104' },//无
        { name: '临潼区', adcode: '610115' },
        { name: '未央区', adcode: '610112' },
        { name: '新城区', adcode: '610102' },
        { name: '阎良区', adcode: '610114' },
        // { name: '雁塔区', adcode: '610113' },//无
        { name: '周至县', adcode: '610124' }
      ],
      districtWeather: [], // 区县天气数据
      weather_data: [], //存储各区县天气数据的数组
      isTableVisible: true, // 控制表格显示/隐藏的状态
      searchQuery: '搜索',
      currentPage: 1,
      tableHeaders: ['区县名称','12H降水量', '温度', '湿度'],
      point_tableHeaders: ['预警点名称', '预警灾害类型','预警点危险等级','预警灾害规模', '预警点位置'],
      history_disasterHeaders: ['灾害位置', '灾害名称','灾害类型','遇难人数', '倒塌房屋'],
      pageSize: 4,
      slide: [], // 滑坡隐患点信息
      warn_point: [], //预警点数组
      iswarn_point_table: true, //控制表格显示/隐藏的状态
      currentPointPage: 1,
      pagePointSize: 5,
      countByCounty: [], //预警点统计数量数组
      history_desaster: [], //历史灾害数组
      tableChange: true, //表格变化
      hisDas: null,
      districtColors: {}, // 存储各区县的颜色
      popupInfo: {},
      popupType: '',          // 弹窗类型（slide/flow/riskArea）
      currentPopupCounty: ''  // 缓存当前弹窗的区县（用于匹配历史案例）
    };
  },

  mounted() {
    this.init();
    basicLayers.loadAdminData();
  },

  computed: {
    // 计算总页数
    totalPages() {
      return Math.ceil(this.weather_data.length / this.pageSize);
    },
    // 西安天气表当前页要显示的数据
    currentPageData() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.weather_data.slice(start, end);
    },

    // 预警点信息表计算总页数
    totalPointPages() {
      return Math.ceil(this.warn_point.length / this.pagePointSize);
    },

    // 预警点信息表
    currentPointPageData() {
      const start = (this.currentPointPage - 1) * this.pagePointSize;
      const end = start + this.pagePointSize;
      return this.warn_point.slice(start, end);
    }
  },

  methods: {
    init() {
      this.viewer = initCesium("cesiumContainer");

      // 注释版权信息
      this.viewer._cesiumWidget._creditContainer.style.display = "none";
      window.viewer = this.viewer;

      // 添加短暂延迟确保 Viewer 完全初始化
      setTimeout(() => {
        try {
          init_cesium_navigation(108.948024, 34.263161, 200000, this.viewer);
          // 调整到指定位置
          window.viewer.cesiumWidget.creditContainer.style.display = "none";
          window.viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(108.93, 34.27, 200000),
            orientation: {
              heading: Cesium.Math.toRadians(0),
              pitch: Cesium.Math.toRadians(-90),
              roll: 0.0,
            },
          });
        } catch (error) {
          console.error("导航控件初始化失败:", error);
          // 可以在这里添加重试逻辑
        }
      }, 100);
      // 添加风险区
      this.Addriskzone();
      //添加滑坡隐患点
      this.AddSlide();
      //添加泥石流隐患点
      this.AddFlow();
      //获取区县所有气象数据，并把它们存入数组
      this.getData();
    },
    async getData(){
      await getRain().then(res => {
        this.rainData = res.data;
      })
      this.fetchDistrictWeather();
    },
    //获取各区县天气数据
    fetchDistrictWeather() {
      // 清空原有数据
      this.weather_data = [];
      this.districtWeather = [];
      const rainFeatures = this.rainData?.features || [];
      // 处理数据，过滤掉 null 值
      const allResults = this.districts
          .map((district) => {
            const point = rainFeatures.find(p =>
                p.properties.adminCode == district.adcode
            );
            // 调试：输出匹配结果
            // console.log(`匹配 ${district.name} (${district.adcode}):`, point ? "成功" : "失败");
            if (!point) {
              console.warn(`未找到 ${district.name} 的天气数据`);
              return {
                ...district,
                rainfall: 0,
                temperature: 0,
                humidity: 0
              };
            }

            return {
              ...district,
              rainfall: point.properties.rainPreHours ?? 0,
              temperature: point.properties.temperature ?? 0,
              humidity: point.properties.relativeHumidity ?? 15,
            };
          });
      this.districtWeather = allResults;
      // 直接使用 allResults，不需要再次映射
      const sortedWeatherData = [...allResults]
          .sort((a, b) => b.rainfall - a.rainfall)
          .map(item => ({
            name: item.name,
            adcode: item.adcode,
            rainfall: item.rainfall,
            temperature: item.temperature,
            humidity: item.humidity,
          }));

      this.weather_data = sortedWeatherData;
      this.flashPoints();
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    },
    nextPointPage() {
      if (this.currentPointPage < this.totalPointPages) {
        this.currentPointPage++;
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },
    prevPointPage() {
      if (this.currentPointPage > 1) {
        this.currentPointPage--;
      }
    },
    toggleTableVisibility() {
      this.isTableVisible = !this.isTableVisible;
    },
    togglePointTableVisibility(){
      this.iswarn_point_table = !this.iswarn_point_table;
    },
    AddSlide(){
      let pointInfo;
      //添加滑坡隐患点数据
      getSlide().then(res => {
        let data = res.data;
        data.forEach(point => {
          // console.log("--------------",point)
          // this.flashPoints(point);
          this.slide.push(point)
          let lat = point.lat;
          let lon = point.lon;
          //存储点的详细信息
          pointInfo = {
            city: point.city || "城市",
            county: point.county || "地区",
            disasterName: point.disasterName || "灾害名称",
            lon: point.lon || "经度",
            lat: point.lat || "纬度",
            position: point.position || "灾害发生位置",
            riskGrade: point.riskGrade || "危险等级",
            scaleGrade: point.scaleGrade || "规模等级",
          };
          let entity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(lon, lat),
            billboard: {
              // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
              image: landslideIcon,
              width: 60, // 图片宽度,单位px
              height: 60, // 图片高度，单位px
              eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
              color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
              scale: 0.8, // 缩放比例
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
              scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
              depthTest: false, // 禁止深度测试
              disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
              show: true,
              zIndex:99999999,
            },
            // 绑定自定义数据，用于点击时获取信息
            userData: {
              type: 'slide',
              info: pointInfo,
              originalPosition: { lon, lat } // 保存原始经纬度
            }
          });
        });
      });
      // 设置点击事件处理
      this.setupEntityClickHandler();
    },
    AddFlow(){
      let pointInfo;
      getFlow().then(params =>{
        // console.log(params)
        let data = params.data
        data.forEach(point => {
          this.slide.push(point)
          let lon = point.lon;
          let lat = point.lat;
          //存储点的详细信息
          pointInfo = {
            city: point.city || "城市",
            county: point.county || "地区",
            disasterName: point.disasterName || "灾害名称",
            lon: point.lon || "经度",
            lat: point.lat || "纬度",
            position: point.position || "灾害发生位置",
            riskGrade: point.riskGrade || "危险等级",
            scaleGrade: point.scaleGrade || "规模等级",
          };
          this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(lon, lat),
            billboard: {
              // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
              image: flowIcon,
              width: 60, // 图片宽度,单位px
              height: 60, // 图片高度，单位px
              eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
              color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
              scale: 0.8, // 缩放比例
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
              scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
              depthTest: false, // 禁止深度测试
              disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
              show: true,
              zIndex:99999999,
            },
            // 绑定自定义数据，用于点击时获取信息
            userData: {
              type: 'flow',
              info: pointInfo,
              originalPosition: { lon, lat } // 保存原始经纬度
            }
          });
        })
      });
    },
    Addriskzone() {
      let riskAreaInfo;
      getRisk().then(risk => {
        let data = risk.data.features;
        data.forEach(point => {
          let lon = point.geometry.coordinates[0];
          let lat = point.geometry.coordinates[1];
          // 存储点的详细信息（从原始数据中提取）
          riskAreaInfo = {
            disasterName: point.properties.disasterName || "风险区名称",
            inspectorName: point.properties.inspectorName || "巡查员姓名",
            inspectorTele: point.properties.inspectorTele || "巡查员电话",
            county: point.properties.county,
            lon: point.properties.lon || "经度",
            lat: point.properties.lat || "纬度",
            position: point.properties.position || "风险区位置",
            housing: point.properties.housing || "住房",
            addressPopulation: point.properties.addressPopulation || "户籍人口",
            residentCounts: point.properties.residentCounts || "居民户数",
          };
          this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(lon, lat),
            billboard: {
              // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
              image: riskAreaIcon,
              width: 60, // 图片宽度,单位px
              height: 60, // 图片高度，单位px
              eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
              color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
              scale: 0.8, // 缩放比例
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
              scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
              depthTest: false, // 禁止深度测试
              disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
              show: true,
              zIndex:99999999,
            },
            userData: {
              type: 'riskArea',
              info: riskAreaInfo,
              originalPosition: { lon, lat } // 保存原始经纬度
            }
          });
        })
      })
      // 设置点击事件处理
      this.setupEntityClickHandler();
    },
    setupEntityClickHandler() {
      if (this.entityClickHandler) {
        this.entityClickHandler.destroy();
      }
      this.entityClickHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
      this.entityClickHandler.setInputAction((click) => {
        // 隐藏弹窗（替代原生移除DOM）
        this.popupVisible = false;
        this.tableChange = true;

        const pickedObject = this.viewer.scene.pick(click.position);
        if (pickedObject && Cesium.defined(pickedObject.id)) {
          const entity = pickedObject.id;
          if (entity.userData && ['slide', 'flow', 'riskArea'].includes(entity.userData.type)) {
            let cartesian = this.viewer.scene.globe.pick(this.viewer.camera.getPickRay(click.position),this.viewer.scene);
            let ellipsoid=this.viewer.scene.globe.ellipsoid;
            let cartographic=ellipsoid.cartesianToCartographic(cartesian);
            // let lat=Cesium.Math.toDegrees(cartographic.latitude);
            // let lon=Cesium.Math.toDegrees(cartographic.longitude);
            this.showInfoList(entity.userData.info,entity);
            // this.viewer.camera.flyTo({
            //   destination: Cesium.Cartesian3.fromDegrees(lon, lat, 5000),
            //   orientation: {
            //     heading: 6.283185307179581,
            //     pitch: -1.5688168484696687,
            //     roll: 0.0
            //   },
            //   duration: 1.0,
            //   complete: () => {
            //     this.showInfoList(entity.userData.info,entity);
            //   }
            // });
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    },

    showInfoList(info,entity) {
      // 隐藏原有弹窗（如果有）
      this.popupVisible = false;

      // 获取实体位置的屏幕坐标
      const position = entity.position.getValue(this.viewer.clock.currentTime);
      const canvasPosition = this.viewer.scene.cartesianToCanvasCoordinates(position);
      if (!canvasPosition) return;

      // 1. 设置弹窗位置（替代原生style.cssText）
      this.popupPosition = {
        left: canvasPosition.x + 10,  // 右侧显示
        top: canvasPosition.y + 10     // 垂直偏移（原top-10）
      };

      // 2. 设置弹窗数据和类型
      this.popupInfo = { ...info };
      this.popupType = entity.userData.type;
      this.currentCounty = info.county; // 存储区县，用于匹配历史案例

      // 3. 调整弹窗位置（防止超出视口）
      this.adjustWindowPosition();

      // 4. 显示弹窗
      this.popupVisible = true;
    },
    adjustWindowPosition() {
      this.$nextTick(() => {
        const popupEl = document.querySelector('.cesium-info-window');
        if (!popupEl) return;

        const rect = popupEl.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const newPosition = { ...this.popupPosition };

        // 右侧溢出时调整
        if (rect.right > viewportWidth) {
          newPosition.left = this.popupPosition.left - (rect.right - viewportWidth + 20);
        }

        // 底部溢出时调整
        if (rect.bottom > viewportHeight) {
          newPosition.top = this.popupPosition.top - (rect.bottom - viewportHeight + 20);
        }

        // 顶部溢出时调整
        if (rect.top < 0) {
          newPosition.top = 20;
        }

        // 更新响应式位置
        this.popupPosition = newPosition;
      });
    },

    handleMatchHistory() {
      this.GetHistoryDisaster(this.currentCounty);
      this.tableChange = false;
    },

    handleClosePopup() {
      this.popupVisible = false;
      this.closHisHisDasTableVisibility();
    },
    flashPoints(){
      const flag = [];
      const poin = [];
      this.weather_data.forEach(i => {
        if (i.rainfall > 30){
          flag.push(i.name);
        }
      });
      if (flag.length === 0) {
        if (this.flashInterval) {
          clearInterval(this.flashInterval);
          this.flashInterval = null;
        }
        if (this.haloCollection) {
          this.haloCollection.removeAll();
        }
        return;
      }
      this.warn_point = [];
      this.slide.forEach(item => {
        if (flag.includes(item.county)) { // 匹配区县名称
          this.warn_point.push(item)
          const haloEntity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(item.lon, item.lat),
            point: {
              pixelSize: 40, // 增大光晕大小，使其更明显
              color: Cesium.Color.RED.withAlpha(0.4), // 提高透明度，使其更明显
              outlineColor: Cesium.Color.RED.withAlpha(1.0), // 完全不透明的边框
              outlineWidth: 1, // 适中的边框宽度
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
              disableDepthTestDistance: Number.POSITIVE_INFINITY // 确保不被地形遮挡
            }
          });
          this.addPulseAnimation(haloEntity,Cesium.Color.RED);
        }else {
          poin.push(item)
        }
      });
      // 获取所有区县（需要预警和不需要预警的）
      const allCounties = [
        ...new Set(this.warn_point.map(item => item.county)),
        ...new Set(poin.map(item => item.county))
      ];
      // 初始化统计对象，需要预警的点计数，不需要预警的点为0
      const sortedCounties = allCounties.reduce((acc, county) => {
        // 判断该区县是否有需要预警的点
        const hasWarningPoints = this.warn_point.some(item => item.county === county);
        acc[county] = hasWarningPoints ?
            this.warn_point.filter(item => item.county === county).length : 0;
        return acc;
      }, {});
      this.countByCounty = Object.entries(sortedCounties)
          .sort((a, b) => a[1] - b[1])
          .reduce((obj, [county, count]) => {
            obj[county] = count;
            return obj;
          }, {});
      // console.log(789789,this.countByCounty)
      if(this.countByCounty){
        this.showChart = true;
        this.$nextTick(() => {
          this.AddChart();
        });
      }
    },

    addPulseAnimation(haloEntity, baseColor){
        let pulsePhase = 0;
        // 使用定时器创建脉冲效果
        const pulseInterval = setInterval(() => {
          pulsePhase += 0.2; // 稍微加快动画速度
          const alpha = 0.2 + 0.5 * Math.sin(pulsePhase); // 提高透明度范围
          const size = 30 + 20 * Math.sin(pulsePhase); // 增大尺寸变化范围

          haloEntity.point.color = baseColor.withAlpha(alpha);
          haloEntity.point.pixelSize = size;

        }, 100); // 适中的更新频率

        // 存储定时器引用以便清理
        haloEntity.pulseInterval = pulseInterval;
      },

    pointTableClick(item) {
      console.log(123456789,item)
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(item.lon, item.lat, 4000.0),
        orientation: {
          // 指向
          heading: 6.283185307179581,
          // 视角
          pitch: -1.5688168484696687,
          roll: 0.0
        }
      });
    },

    AddChart() {
      // 若无统计数据则返回
      if (!this.countByCounty || Object.keys(this.countByCounty).length === 0) return;

      let chartDom = document.getElementById("main");
      let myChart = echarts.init(chartDom);
      let option;

      // 从统计结果中提取数据，适配图表所需格式
      const yAxisData = Object.keys(this.countByCounty);
      const seriesData = [
        {
          name: '预警点数量',
          data: yAxisData.map(county => this.countByCounty[county])
        }
      ];

      const gradient = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: "#438BFD" }, // 顶部颜色
        { offset: 0.5, color: "#13B0D7" }, // 中间颜色
        { offset: 1, color: "#13B0D7" }, // 底部颜色
      ]);

      option = {
        title: {
          subtext: "预警点数量统计",
          left: "center",
          top: 0,
          subtextStyle: {
            color: "#000",
            fontSize: 16,
            fontWeight: "bold", // 加粗字体
            marginBottom: 10, // 底部边距
            textAlign: "center", // 文本居中
            marginTop: 0, // 顶部边距
            paddingTop: 20, // 顶部内边距
          },
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type:'shadow'
          }
        },
        grid: {
          left: '2%', // 增大左侧边距，给 y 轴标签留空间，可根据实际情况调整百分比或像素值（如 '150px'）
          right: '4%',
          bottom: '3%',
          containLabel: true // 确保边距包含标签，避免被裁剪
        },
        xAxis: {
          type: 'value',
          boundaryGap: [0, 0.01],
          axisLabel: {
            color: "#000",
          },
        },
        yAxis: {
          type: 'category',
          data: yAxisData,
          axisLabel: {
            color: "#000",
          },
        },
        series: [
          {
            name: '预警点数量',
            type: 'bar',
            data: seriesData[0].data,
            itemStyle: {
              color: gradient // 应用渐变色
            }
          }
        ]
      };

      option && myChart.setOption(option);
      // 窗口大小变化时自适应图表
      window.addEventListener("resize", () => {
        myChart.resize();
      });
    },

    //获取历史灾害数据
    GetHistoryDisaster(county){
      getHistoryDisaster(county).then(history => {
        let data = history.data;
        const dataFeatures = data?.features || [];

        // 清空之前的数据
        this.history_desaster = [];

        dataFeatures.forEach(feature => {
          this.history_desaster.push(feature.properties);
        });

        this.toggleHisDasTableVisibility();
      }).catch(error => {
        console.error('获取历史灾害数据失败:', error);
      });
    },

    toggleHisDasTableVisibility(){
      if(this.tableChange == true){
        this.tableChange = !this.tableChange;
      }
      // 确保 hisDas 是响应式的数组
      this.hisDas = [...this.history_desaster];
      console.log('历史灾害数据:', this.hisDas);
    },

    closHisHisDasTableVisibility(){
      this.tableChange = true;
    },
  },
  beforeDestroy() {
    if (this.viewer) {
      this.viewer.destroy();
      this.viewer = null;
    }
  },
}
</script>

<style scoped>
#cesiumContainer {
  width: 100%;
  height: calc(100vh - 50px);
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.text-3xl mr-2{
  left: auto;
}

.weather-container {
  display: flex;
  align-items: center;
  flex: 1;
  margin: 0 20px;
}

.weather-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.weather-item {
  display: flex;
  align-items: center;
  padding: 0 5px;
}

.weather-item:last-child {
  border-right: none;
}

.icon-item {
  margin-right: 5px;
}

.time-item {
  margin-left: 10px;
}

.data-table {
  position: absolute;
  top: 60px;
  right: 0;
  background-color: rgba(14, 52, 98, 0.8);
  color: white;
  padding: 15px;
  border: 1px solid rgba(0, 225, 255, 0.5);
  border-radius: 2px;
  z-index: 1000;
  width: 361px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  font-size: 14px;
}

.warn-point-table {
  position: absolute;
  top: 120px;
  left: 20px;
  background: rgba(14, 52, 98, 0.8);
  color: white;
  padding: 15px;
  border-radius: 2px;
  z-index: 1000;
  width: 550px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  font-size: 14px;
  border: 1px solid rgba(0, 225, 255, 0.5);
}

.toggle-point-table-btn{
  position: absolute;
  top: 5px;
  left: 5px;
  background-image: linear-gradient(159deg, #1c9fff 2%, #9be7ff 128%);
  color: white;
  border: none;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  font-size: 14px;
  line-height: 1;
  text-align: center;
  cursor: pointer;
  z-index: 1001;
  display: flex;
  justify-content: center;
  align-items: center;
}

.toggle-table-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background-image: linear-gradient(159deg, #1c9fff 2%, #9be7ff 128%);
  color: white;
  border: none;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  font-size: 14px;
  line-height: 1;
  text-align: center;
  cursor: pointer;
  z-index: 1001;
  display: flex;
  justify-content: center;
  align-items: center;
}

.toggle-table-btn:hover {
  background-color: #0056b3;
}

.toggle-point-table-btn:hover{
  background-color: #0056b3;
}

.table-title {
  font-weight: bold;
  margin-bottom: 15px;
  font-size: 16px;
  text-align: center;
  margin-top: 0;
  padding-top: 10px;
  color: white;
}

.chart-container {
  position: absolute;
  bottom: 71px;
  left: 0;
  background-color: rgba(255, 255, 255, 0.75);
  color: white;
  padding: 15px;
  border-radius: 4px;
  z-index: 1000;
  height: 367px;
  width: 420px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  font-size: 14px;
}

.data-table table {
  width: 100%;
  border-collapse: collapse;
}

.warn-point-table table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: linear-gradient(180deg, rgba(86, 204, 242, 1) 0%, rgba(47, 128, 237, 1) 100%);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 10px 12px;
  text-align: center;
  font-size: 14px;
  font-weight: bold;
  height: 50px;
}

.warn-point-table th {
  background: linear-gradient(180deg, rgba(86, 204, 242, 1) 0%, rgba(47, 128, 237, 1) 100%);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 10px 12px;
  text-align: center;
  font-size: 14px;
  font-weight: bold;
  height: 50px;
}

.data-table td {
  background-color: rgba(14, 52, 98, 0.8);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 10px 12px;
  text-align: center;
  font-size: 14px;
  height: 50px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.warn-point-table td {
  background-color: rgba(14, 52, 98, 0.8);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 10px 12px;
  text-align: center;
  font-size: 14px;
  height: 50px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.data-table tbody tr:nth-child(even) {
  background-color: rgba(255, 255, 255, 0.1);
}

.warn-point-table tbody tr:nth-child(even) {
  background-color: rgba(255, 255, 255, 0.1);
}

.data-table tbody tr:hover {
  background-color: rgba(86, 204, 242, 0.3);
}

.warn-point-table tbody tr:hover {
  background-color: rgba(86, 204, 242, 0.3);
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 15px;
  gap: 10px;
}

.pagination-controls button {
  background-color: #3c86ff;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.pagination-controls button:disabled {
  background-color: #373e52;
  cursor: not-allowed;
}

.pagination-controls button:hover:not(:disabled) {
  background-color: #0056b3;
}

.pagination-controls span {
  font-size: 14px;
  font-weight: bold;
  color: white;
}

.total-items {
  color: white;
  margin-left: 10px;
  font-size: 14px;
}

.legend-content {
  font-size: 12px;
}

.controls {
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 100;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 15px;
  border-radius: 8px;
  color: white;
}

.legend-title {
  font-weight: bold;
  margin-bottom: 10px;
}

.legend {
  position: absolute;
  bottom: 30px;
  right: 20px;
  background-color: rgba(40, 40, 40, 0.8);
  color: white;
  padding: 15px;
  border-radius: 4px;
  z-index: 1000;
  max-width: 200px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin: 4px 0;
  font-size: 14px;
}

.legend-icon {
  width: 18px;
  height: 18px;
  margin-right: 8px;
  vertical-align: middle;
}

#flow{
  background-image: url("../../assets/images/DebrisFlow.png");
  background-size: cover;
}

#yhdlen{
  background-image: url("../../assets/images/landslide.png");
  background-size: cover;
}

#risk_area{
  background-image:  url("../../assets/images/riskArea.png");
  background-size: cover;
}

.panel-title {
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 14px;
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panel-content label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.earthquake-info-panel {
  position: absolute;
  top: 70px;
  left: 300px;
  background-color: rgba(40, 40, 40, 0.9);
  color: white;
  padding: 15px;
  border-radius: 4px;
  z-index: 1000;
  width: 250px;
}

.earthquake-info-panel input {
  width: 60px;
  margin-left: 10px;
  padding: 5px;
  background-color: rgba(255,255,255,0.1);
  border: 1px solid #666;
  color: white;
}

.earthquake-info-panel button {
  margin-top: 10px;
  margin-right: 30px;
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.earthquake-info-panel button:first-child {
  background-color: #386641;
  color: white;
  width: 100%;
}

.earthquake-info-panel button:last-child {
  background-color: #bc4749;
  color: white;
  width: 100%;
}

.el-select--large {
  font-size: 14px;
  gap: 6px;
  line-height: 24px;
  min-height: 40px;
  padding: 8px 16px;
}

::v-deep .compass {
  position: absolute;
  top: 20px;
}

::v-deep .navigation-controls {
  position: absolute;
  top: 120px;
}

.no-data {
  text-align: center;
  color: white;
  padding: 20px;
  font-size: 14px;
}

:deep(.cesium-info-window) {
  position: absolute;
  width: 300px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  padding: 0px;
  z-index: 1000;
  max-height: 450px;
  overflow-y: auto;
}

:deep(.disaster-popup) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 0px;
  border-radius: 2px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: rgba(0, 94, 153, 1);
  color: white;
}

:deep(.toggle-btn) {
  background: linear-gradient(180deg, rgba(86, 204, 242, 1) 0%, rgba(47, 128, 237, 1) 100%);
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 2px;
  cursor: pointer;
}

:deep(.popup-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(14, 52, 98, 0.95);
  padding: 2px 15px;
  border-bottom: 1px solid #e9ecef;
}

:deep(.popup-header h3) {
  font-size: 14px;
  font-weight: bold;
  font-family: 'Source Han Sans CN';
  margin: 5px 0;
}

:deep(.disaster-info-table) {
  width: 100%;
  border-collapse: collapse;
  color: white;
}

:deep(.disaster-info-table th),
:deep(.disaster-info-table td) {
  padding: 8px;
  border-top: 1px solid #000;
  border-bottom: 1px solid #000;
  border-left: none;
  border-right: none;
  text-align: left;
  font-family: 'Source Han Sans CN';
  font-size: 13px;
}

:deep(.disaster-info-table .label) {
  width: 30%;
  font-size: 13px;
}

:deep(.close-btn) {
  background: none;
  border: 1px solid rgba(0, 225, 255, 1);
  padding: 5px 10px;
  cursor: pointer;
  font-size: 14px;
  transition: color 0.2s;
  color: white;
  border-radius: 2px;
}

:deep(.close-btn:hover) {
  background: rgba(0, 225, 255, 0.2);
}

.no-data-cell {
  text-align: center;
  padding: 30px 12px;
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
}
</style>
