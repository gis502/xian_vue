<template>
  <div id="cesiumContainer">

    <div class="legend">
      <div class="legend-title">图例</div>
      <div class="legend-content" ref="legendContent"></div>
      <div class="legend-item">
        <div class="legend-icon" id="flow"></div>
        泥石流隐患点
      </div>
      <div class="legend-item">
        <div class="legend-icon" id="yhdlen"></div>
        滑坡隐患点
      </div>
      <div class="legend-item">
        <div class="legend-icon" id="risk_area"></div>
        风险区
      </div>
    </div>

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
<!--          <td style="white-space:nowrap;overflow:hidden;text-overflow: ellipsis;" :title="item.city">-->
<!--            {{ item.city }}-->
<!--          </td>-->
<!--          <td style="white-space:nowrap;overflow:hidden;text-overflow: ellipsis;" :title="item.county">-->
<!--            {{ item.county}}-->
<!--          </td>-->
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
    <div  v-if="tableChange==false" class="warn-point-table">
      <button @click="togglePointTableVisibility" class="toggle-point-table-btn">{{ iswarn_point_table ? '-' : '+' }}</button>
      <div class="table-title">历史案例信息</div>
      <table v-if="iswarn_point_table" style="table-layout: fixed;">
        <thead>
        <tr >
          <th style="text-align: center" v-for="(header, index) in history_disasterHeaders" :key="index">{{ header }}</th>
        </tr>
        </thead>

        <tbody>
        <tr>
          <td style="white-space:nowrap;overflow:hidden;text-overflow: ellipsis;" :title="this.hisDas.locateName">
            {{ this.hisDas.locateName}}
          </td>
          <td style="white-space:nowrap;overflow:hidden;text-overflow: ellipsis;" :title="this.hisDas.historyDisasterevent">
            {{ this.hisDas.historyDisasterevent }}
          </td>
          <td style="white-space:nowrap;overflow:hidden;text-overflow: ellipsis;" :title="this.hisDas.historyDisastertype">
            {{ this.hisDas.historyDisastertype}}
          </td>
          <td style="white-space:nowrap;overflow:hidden;text-overflow: ellipsis;" :title="this.hisDas.missing_persons">
            {{ this.hisDas.missing_persons }}
          </td>
          <td style="white-space:nowrap;overflow:hidden;text-overflow: ellipsis;" :title="this.hisDas.collapsedHouses">
            {{ this.hisDas.collapsedHouses}}
          </td>
        </tr>
        </tbody>
      </table>
<!--      <div class="pagination-controls" v-if="iswarn_point_table">-->
<!--        <button @click="prevPointPage" :disabled="currentPointPage === 1">上一页</button>-->
<!--        <span>{{ currentPointPage }} / {{ totalPointPages }}</span>-->
<!--        <button @click="nextPointPage" :disabled="currentPointPage === totalPointPages">下一页</button>-->
<!--        <span class="total-items">共 {{ warn_point.length }} 条</span>-->
<!--      </div>-->
    </div>

    <!-- 图表容器 -->
    <div class="chart-container">
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
import CesiumNavigation from "cesium-navigation-es6";
import {init_cesium_navigation, initCesium} from '@/cesium/initLayer.js'
import axios from 'axios';
import {getFlow, getRisk, getSlide,getHistoryDisaster} from "@/api/system/association_analysis.js";
import * as echarts from "echarts";
import basicLayers from "@/cesium/basicLayers.js";

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
        { name: '碑林区', adcode: '610103' },
        { name: '长安区', adcode: '610116' },
        { name: '高陵区', adcode: '610117' },
        { name: '鄠邑区', adcode: '610118' },
        { name: '蓝田县', adcode: '610122' },
        { name: '莲湖区', adcode: '610104' },
        { name: '临潼区', adcode: '610115' },
        { name: '未央区', adcode: '610112' },
        { name: '新城区', adcode: '610102' },
        { name: '阎良区', adcode: '610114' },
        { name: '雁塔区', adcode: '610113' },
        { name: '周至县', adcode: '610124' }
      ],
      districtWeather: [], // 区县天气数据
      weather_data: [], //存储各区县天气数据的数组
      isTableVisible: true, // 控制表格显示/隐藏的状态
      searchQuery: '搜索',
      currentPage: 1,
      tableHeaders: ['区县名称','降水量', '温度', '湿度'],
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
    };
  },

  mounted() {
    this.init();
    // this.AddCompass();
    // basicLayers.loadAdminData();
    // this.loadAdminData(); // 加载行政区划数据
    // this.createLegend(); // 创建图例

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

      this.viewer = initCesium("cesiumContainer")

      // 注释版权信息
      this.viewer._cesiumWidget._creditContainer.style.display = "none";
      init_cesium_navigation(108.948024, 34.263161, 200000,this.viewer);
      window.viewer=this.viewer
      //定位到西安
      // this.locatedXiAn();
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
      basicLayers.loadAdminData();
      // 获取天气数据
      // this.fetchWeatherData();

      // 添加风险区
      this.Addriskzone();

      //添加滑坡隐患点
      this.AddSlide();

      //添加泥石流隐患点
      this.AddFlow();

      //获取区县所有气象数据，并把它们存入数组
      this.fetchDistrictWeather();

    },

    // 获取高德天气数据
    // fetchWeatherData() {
    //   this.weatherLoading = true;
    //   this.weatherError = null;
    //
    //   // 使用 extensions=all 获取更详细的天气数据（可能包含降雨量）
    //   const url = `https://restapi.amap.com/v3/weather/weatherInfo?key=${this.weather}&city=610100&extensions=all`;
    //
    //   axios.get(url)
    //       .then(response => {
    //         // console.log('完整API响应:', response.data);
    //
    //         if (response.data.status !== '1') {
    //           throw new Error(`API错误: ${response.data.info}`);
    //         }
    //
    //         // 提取实时天气数据（如果有）
    //         const liveData = response.data.lives && response.data.lives.length > 0
    //             ? response.data.lives[0]
    //             : {};
    //
    //         // 提取预报天气数据（可能包含降雨量）
    //         const forecastData = response.data.forecasts && response.data.forecasts.length > 0 &&
    //         response.data.forecasts[0].casts && response.data.forecasts[0].casts.length > 0
    //             ? response.data.forecasts[0].casts[0] // 今天的预报
    //             : {};
    //
    //         // 整合数据，优先使用实时数据，缺少的字段用预报数据补充
    //         this.weatherData = {
    //           weather: liveData.weather || forecastData.dayweather || '-', // 天气状况
    //           temperature: liveData.temperature || forecastData.daytemp || '-', // 温度
    //           humidity: liveData.humidity ||
    //               liveData.humidity_float ||  // 备选字段
    //               '50',
    //           precipitation: liveData.precipitation || forecastData.dayrain || forecastData.rainfall || '0', // 降雨量
    //           winddirection: liveData.winddirection ||
    //               forecastData.daywind ||  // 预报中的风向
    //               forecastData.winddirection ||  // 备选字段
    //               '无风向数据',  // 最终默认值
    //           reporttime: liveData.reporttime || new Date().toLocaleString(), // 报告时间
    //         };
    //
    //         // console.log('整合后的天气数据:', this.weatherData);
    //       })
    //       .catch(error => {
    //         this.weatherError = error.message;
    //         console.error('获取天气数据出错:', error);
    //       })
    //       .finally(() => {
    //         this.weatherLoading = false;
    //       });
    // },
    //获取各区县天气数据
    async fetchDistrictWeather() {
      // 清空原有数据
      this.weather_data = [];
      this.districtWeather = [];


      const requests = this.districts.map(async (district) => {
        try {
          const res = await axios.get(
              `https://restapi.amap.com/v3/weather/weatherInfo?key=${this.weather}&city=${district.adcode}&extensions=base`
          );

          if (res.data.status === '1' && res.data.lives && res.data.lives.length > 0) {
            // 成功获取数据：保留完整信息 + 模拟降雨量
            const weatherData = {
              ...district,
              ...res.data.lives[0],
              rainfall: this.simulateRainfall(), // 模拟降雨量
              is_valid: true // 标记为有效数据
            };
            // console.log(`${district.name} 数据正常:`, weatherData);
            return weatherData;
          }

          // 无数据：仅保留名称，其他字段置空，模拟降雨量
          const noData = {
            ...district,
            weather: '无数据',
            temperature: '-',
            humidity: '-',
            winddirection: '-',
            rainfall: this.simulateRainfall(), // 模拟降雨量
            is_valid: false // 标记为无效数据
          };
          // console.log(`${district.name} 无数据:`, noData);
          return noData;
        } catch (err) {
          // 请求失败：仅保留名称，其他字段置空，模拟降雨量
          const errorData = {
            ...district,
            weather: '获取失败',
            temperature: '-',
            humidity: '-',
            winddirection: '-',
            rainfall: this.simulateRainfall(), // 模拟降雨量
            is_valid: false // 标记为无效数据
          };
          console.error(`${district.name} 获取失败:`, err);
          return errorData;
        }
      });

      const allResults = await Promise.all(requests);
      this.districtWeather = allResults;


      const validDataList = allResults.filter(item => item.is_valid);
      const baseData = validDataList.length > 0 ? validDataList[0] : null;


      let p = allResults.map(item => {
        if (item.is_valid) {
          // 有效数据：直接保留
          return item;
        } else {
          // 无效数据：保留名称和自身模拟的降雨量，其他字段复用baseData
          if (baseData) {
            return {
              name: item.name, // 保留自身名称
              adcode: item.adcode, // 保留自身adcode
              rainfall: item.rainfall, // 使用自身模拟的降雨量
              // 其他字段复用第一个有效数据的值
              province: baseData.province,
              city: baseData.city,
              weather: baseData.weather,
              temperature: baseData.temperature,
              humidity: baseData.humidity,
              winddirection: baseData.winddirection,
              windpower: baseData.windpower,
              reporttime: baseData.reporttime
            };
          } else {
            // 极端情况：无任何有效数据，仅保留名称和模拟的降雨量
            return {
              name: item.name,
              adcode: item.adcode,
              weather: '无数据',
              rainfall: item.rainfall // 使用自身模拟的降雨量
            };
          }
        }
      });

      p.sort((a, b) => b.rainfall - a.rainfall);

      this.weather_data.push(...p)
      this.flashPoints();
      // console.log('最终处理后的天气数据:', this.weather_data);
    },

    simulateRainfall() {
      // 根据天气状况调整降雨量概率分布
      const weatherConditions = ['晴', '多云', '阴', '小雨', '中雨', '大雨', '暴雨'];
      const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];

      let minRain = 0;
      let maxRain = 50;

      // 根据天气类型调整降雨量范围
      switch (randomWeather) {
        case '晴':
        case '多云':
        case '阴':
          minRain = 20;
          maxRain = 35; // 晴天最多5毫米
          break;
        case '小雨':
          minRain = 35;
          maxRain = 85;
          break;
        case '中雨':
          minRain = 30;
          maxRain = 95;
          break;
        case '大雨':
          minRain = 30;
          maxRain = 100;
          break;
        case '暴雨':
          minRain = 50.1;
          maxRain = 100;
          break;
      }

      // 生成指定范围内的随机降雨量，保留1位小数
      const rainfall = (Math.random() * (maxRain - minRain) + minRain).toFixed(1);
      return parseFloat(rainfall); // 转换为数字类型
    },

    refreshWeather() {
      this.fetchWeatherData();
    },

    getWeatherIcon(code) {
      // 打印实际获取的天气代码，方便调试
      // console.log('Weather code:', code);

      // 处理可能的 null/undefined 情况
      if (!code) {
        return this.weatherIconMap.default || '🌍';
      }

      // 统一转换为字符串，避免类型不匹配
      const codeStr = code.toString();


      // 如果映射表中有对应项，返回对应图标
      if (this.weatherIconMap[codeStr]) {
        return this.weatherIconMap[codeStr];
      }

      // 否则返回默认图标
      return this.weatherIconMap.default || '🌍';
    },

    shouldShowRainfall(weatherText) {
      if (!weatherText) return false;

      // 包含雨、雪、雷等关键字的天气状况显示降雨量
      const rainfallKeywords = ['雨', '雪', '雷', '雹', '冻'];
      return rainfallKeywords.some(keyword => weatherText.includes(keyword));
    },

    formatTime(timeStr) {
      if (!timeStr) return '-';

      // 如果是 ISO 格式的时间字符串
      if (timeStr.includes('T')) {
        return new Date(timeStr).toLocaleString();
      }

      // 处理高德 API 返回的格式（如 "2025-07-23 16:38:23"）
      return timeStr.replace(' ', ' '); // 简单处理，可根据需要优化
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

    locatedXiAn() {
      //默认定位到西安
      const savedView = localStorage.getItem('mapView');
      if (savedView) {
        const {destination, orientation} = JSON.parse(savedView);
        this.viewer.camera.setView({destination, orientation});
      } else {
        this.viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(108.0, 34.2, 200000.0),
          orientation: {
            // 指向
            heading: 6.283185307179581,
            // 视角
            pitch: -1.5688168484696687,
            roll: 0.0
          }
        });
      }
      // 添加视图变化监听器，保存当前视图到localStorage
      this.viewer.camera.changed.addEventListener(() => {
        const position = this.viewer.camera.position;
        const heading = this.viewer.camera.heading;
        //const pitch = this.viewer.camera.pitch;
        //const roll = this.viewer.camera.roll;
        localStorage.setItem('mapView', JSON.stringify({
          destination: position,
          orientation: {heading}
        }));
      });
    },

    // AddCompass(){
    //   //添加罗盘功能
    //   const options = {};
    //
    //   options.defaultResetView = Cesium.Cartographic.fromDegrees(108.948024, 34.263161, 40000.0);
    //   // 相机方向
    //   options.orientation = {
    //     heading: Cesium.Math.toRadians(0),   // 朝向正北（0度）
    //     roll: 0 // 翻滚角为0
    //   };
    //   // 相机延时
    //   // options.duration = 4; // 默认为3s
    //
    //   // 用于启用或禁用罗盘。true是启用罗盘，false是禁用罗盘。默认值为true。如果将选项设置为false，则罗盘将不会添加到地图中。
    //   options.enableCompass = true;
    //   // 用于启用或禁用缩放控件。true是启用，false是禁用。默认值为true。如果将选项设置为false，则缩放控件将不会添加到地图中。
    //   options.enableZoomControls = true;
    //   // 用于启用或禁用距离图例。true是启用，false是禁用。默认值为true。如果将选项设置为false，距离图例将不会添加到地图中。
    //   options.enableDistanceLegend = true;
    //   // 用于启用或禁用指南针外环。true是启用，false是禁用。默认值为true。如果将选项设置为false，则该环将可见但无效。
    //   options.enableCompassOuterRing = true;
    //
    //   // 修改重置视图的tooltip
    //   options.resetTooltip = "重置视图";
    //   // 修改放大按钮的tooltip
    //   options.zoomInTooltip = "放大";
    //   // 修改缩小按钮的tooltip
    //   options.zoomOutTooltip = "缩小";
    //
    //   new CesiumNavigation(this.viewer, options);
    // },

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
          // this.riskzone.push(point.properties)
          // locat = this.extractDistrictName(point.properties.position);
          // console.log(44444,locat);
          let lon = point.geometry.coordinates[0];
          let lat = point.geometry.coordinates[1];
          // 存储点的详细信息（从原始数据中提取）
          riskAreaInfo = {
            disasterName: point.properties.disasterName || "风险区名称",
            inspectorName: point.properties.inspectorName || "巡查员姓名",
            inspectorTele: point.properties.inspectorTele || "巡查员电话",
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

    // 提取区县名称的工具函数
    // extractDistrictName(address) {
    //   // 地址格式："陕西省西安市XX区/县XX街道..."
    //   // 匹配 "西安市" 后的第一个 "区" 或 "县" 名称
    //   const regex = /西安市([^区]+[区|县])/;
    //   const match = address.match(regex);
    //   if (match && match[1]) {
    //     return match[1].trim(); // 提取并去除空格（如 "灞桥区"）
    //   }
    //   // 兼容其他格式（如无"西安市"直接匹配区县）
    //   const backupRegex = /([^省]+[区|县])/;
    //   const backupMatch = address.match(backupRegex);
    //   return backupMatch?.[1]?.trim() || '未知区县';
    // },

    setupEntityClickHandler() {
      // 清除旧的事件处理程序
      if (this.entityClickHandler) {
        this.entityClickHandler.destroy();
      }

      // 添加新的事件处理程序
      this.entityClickHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
      this.entityClickHandler.setInputAction((click) => {
        // 清除现有信息窗口
        const existingWindows = document.querySelectorAll('.cesium-info-window');
        existingWindows.forEach(win => win.remove());
        // 获取点击位置的实体
        const pickedObject = this.viewer.scene.pick(click.position);

        if (pickedObject && Cesium.defined(pickedObject.id)) {
          const entity = pickedObject.id;
          if (entity.userData && entity.userData.type === 'slide') {

            //屏幕坐标转世界坐标
            let cartesian = this.viewer.scene.globe.pick(this.viewer.camera.getPickRay(click.position),this.viewer.scene);
            //世界坐标转经纬度
            let ellipsoid=this.viewer.scene.globe.ellipsoid;
            let cartographic=ellipsoid.cartesianToCartographic(cartesian);
            let lat=Cesium.Math.toDegrees(cartographic.latitude);
            let lon=Cesium.Math.toDegrees(cartographic.longitude);
            this.viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(lon, lat, 5000),
              orientation: {
                // 指向
                heading: 6.283185307179581,
                // 视角
                pitch: -1.5688168484696687,
                roll: 0.0
              },
              duration: 1.0, // 设置飞行持续时间为1秒（默认约3秒）
              complete: () => {
                // 飞行完成后显示信息窗口
                this.showInfoList(entity.userData.info,entity);
              }

            });
          }
          else if (entity.userData && entity.userData.type === 'flow') {

            //屏幕坐标转世界坐标
            let cartesian = this.viewer.scene.globe.pick(this.viewer.camera.getPickRay(click.position),this.viewer.scene);
            //世界坐标转经纬度
            let ellipsoid=this.viewer.scene.globe.ellipsoid;
            let cartographic=ellipsoid.cartesianToCartographic(cartesian);
            let lat=Cesium.Math.toDegrees(cartographic.latitude);
            let lon=Cesium.Math.toDegrees(cartographic.longitude);
            this.viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(lon, lat, 5000),
              orientation: {
                // 指向
                heading: 6.283185307179581,
                // 视角
                pitch: -1.5688168484696687,
                roll: 0.0
              },
              duration: 1.0, // 设置飞行持续时间为1秒（默认约3秒）
              complete: () => {
                // 飞行完成后显示信息窗口
                this.showInfoList(entity.userData.info,entity);
              }

            });
          }
          else if (entity.userData && entity.userData.type === 'riskArea') {

            //屏幕坐标转世界坐标
            let cartesian = this.viewer.scene.globe.pick(this.viewer.camera.getPickRay(click.position),this.viewer.scene);
            //世界坐标转经纬度
            let ellipsoid=this.viewer.scene.globe.ellipsoid;
            let cartographic=ellipsoid.cartesianToCartographic(cartesian);
            let lat=Cesium.Math.toDegrees(cartographic.latitude);
            let lon=Cesium.Math.toDegrees(cartographic.longitude);
            this.viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(lon, lat, 5000),
              orientation: {
                // 指向
                heading: 6.283185307179581,
                // 视角
                pitch: -1.5688168484696687,
                roll: 0.0
              },
              duration: 1.0, // 设置飞行持续时间为1秒（默认约3秒）
              complete: () => {
                // 飞行完成后显示信息窗口
                this.showInfoList(entity.userData.info,entity);
              }

            });
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    },

    showInfoList(info,entity) {

      // 清除现有信息窗口
      const existingWindows = document.querySelectorAll('.cesium-info-window');
      existingWindows.forEach(win => win.remove());


      // 获取实体位置的屏幕坐标
      const position = entity.position.getValue(this.viewer.clock.currentTime);
      const canvasPosition = this.viewer.scene.cartesianToCanvasCoordinates(position);
      if (!canvasPosition) return; // 位置不可见时返回

      // 创建信息列表DOM（可替换为框架组件）
      const container = document.createElement('div');
      container.className = 'cesium-info-window';

      // 计算窗口位置（基于屏幕坐标偏移）
      const left = canvasPosition.x + 250; // 右侧显示
      const top = canvasPosition.y + 20; // 垂直居中

      container.style.cssText = `
        position: absolute;
        left: ${left}px;
        top: ${top-10}px;
        width: 300px;
        background: white;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        padding: 0px;
        z-index: 1000;
        max-height: 450px;
        overflow-y: auto;
      `;
      // 构建信息列表内容
      if (entity.userData.type == 'slide'){
        container.innerHTML = `
            <div class="disaster-popup">
                <div class="popup-header">
                    <h3>隐患点信息</h3>
                    <button class="toggle-btn">匹配历史案例</button>
                    <button onclick="this.parentNode.parentNode.remove()" class="close-btn">关闭</button>
                </div>
                <table class="disaster-info-table">
                    <tbody>
                        <tr>
                          <td class="label">城市</td>
                          <td>${info.city}</td>
                        </tr>
                           <tr>
                          <td class="label">地区</td>
                          <td>${info.county}</td>
                        </tr>
                        <tr>
                          <td class="label">灾害名称</td>
                          <td>${info.disasterName}</td>
                        </tr>
                        <tr>
                          <td class="label">经度</td>
                          <td>${info.lon}</td>
                        </tr>
                        <tr>
                          <td class="label">经度</td>
                          <td>${info.lat}</td>
                        </tr>
                        <tr>
                          <td class="label">灾害位置</td>
                          <td>${info.position}</td>
                        </tr>
                        <tr>
                          <td class="label">危险等级</td>
                          <td>${info.riskGrade}</td>
                        </tr>
                        <tr>
                          <td class="label">规模等级</td>
                          <td>${info.scaleGrade}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
      } else if (entity.userData.type == 'flow'){
        container.innerHTML = `
          <div class="disaster-popup">
              <div class="popup-header">
                  <h3>隐患点信息</h3>
                  <button class="toggle-btn">匹配历史案例</button>
                  <button onclick="this.parentNode.parentNode.remove()" class="close-btn">关闭</button>
              </div>
              <table class="disaster-info-table">
                <tbody>
                  <tr>
                    <td class="label">城市</td>
                    <td>${info.city}</td>
                  </tr>
                  <tr>
                    <td class="label">地区</td>
                    <td>${info.county}</td>
                  </tr>
                  <tr>
                    <td class="label">灾害名称</td>
                    <td>${info.disasterName}</td>
                  </tr>
                  <tr>
                    <td class="label">经度</td>
                    <td>${info.lon}</td>
                  </tr>
                  <tr>
                    <td class="label">经度</td>
                    <td>${info.lat}</td>
                  </tr>
                  <tr>
                    <td class="label">灾害位置</td>
                    <td>${info.position}</td>
                  </tr>
                  <tr>
                    <td class="label">危险等级</td>
                    <td>${info.riskGrade}</td>
                  </tr>
                  <tr>
                    <td class="label">规模等级</td>
                    <td>${info.scaleGrade}</td>
                  </tr>
                 </tbody>
              </table>
          </div>
        `;
      }else if (entity.userData.type == 'riskArea'){
        container.innerHTML = `
            <div class="disaster-popup">
                <div class="popup-header">
                    <h3>风险区信息</h3>
                    <button class="toggle-btn">匹配历史案例</button>
                    <button onclick="this.parentNode.parentNode.remove()" class="close-btn">关闭</button>
                </div>
                <table class="disaster-info-table">
                    <tbody>
                        <tr>
                          <td class="label">风险区名称</td>
                          <td>${info.disasterName}</td>
                        </tr>
                           <tr>
                          <td class="label">巡查员姓名</td>
                          <td>${info.inspectorName}</td>
                        </tr>
                        <tr>
                          <td class="label">巡查员电话</td>
                          <td>${info.inspectorTele}</td>
                        </tr>
                        <tr>
                          <td class="label">经度</td>
                          <td>${info.lon}</td>
                        </tr>
                        <tr>
                          <td class="label">经度</td>
                          <td>${info.lat}</td>
                        </tr>
                        <tr>
                          <td class="label">风险区位置</td>
                          <td>${info.position}</td>
                        </tr>
                        <tr>
                          <td class="label">住房</td>
                          <td>${info.housing}户</td>
                        </tr>
                        <tr>
                          <td class="label">户籍人口</td>
                          <td>${info.addressPopulation}</td>
                        </tr>
                        <tr>
                          <td class="label">居民户数</td>
                          <td>${info.residentCounts}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
      }

      // 添加以下 CSS 样式，让表格更美观
      const style = document.createElement('style');
      style.textContent = `
        .disaster-popup {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 0px;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 减小阴影 */

        }
        .popup-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: #f8f9fa;
            padding: 2px 15px;
            border-bottom: 1px solid #e9ecef;
        }
        .popup-header h3 {
            font-size: 14px;
            font-weight: bold;
            font-family: 'Source Han Sans CN';
        }
        .disaster-info-table {
            width: 100%;
            border-collapse: collapse;

        }
        .disaster-info-table th, .disaster-info-table td {
            padding: 8px;
            border-top: 1px solid #ddd;  /* 保留上边框 */
            border-bottom: 1px solid #ddd;  /* 保留底边框 */
            border-left: none;  /* 去除左边框 */
            border-right: none;  /* 去除右边框 */
            text-align: left;
            font-family: 'Source Han Sans CN';
            font-size: 13px;
        }
        .disaster-info-table .label {
            color: #333;
            width: 30%;
            font-size: 13px;
        }
        .close-btn {
            font-weight: nom;
            background:none;
            border: none;
            padding: 5px 10px;
            cursor: pointer;
            font-size: 14px; /* 减小标题字体大小 */
            color: #6c757d;
            transition: color 0.2s;
        }

    `;
      document.head.appendChild(style);
      // 添加到页面
      document.body.appendChild(container);
      // 检查是否超出视口边界并调整位置
      this.adjustWindowPosition(container);
      // 然后手动绑定事件
      const toggleBtn = container.querySelector('.toggle-btn');
      toggleBtn.addEventListener('click', () => {
        this.GetHistoryDisaster();
      });
      const closeBtn = container.querySelector('.close-btn');
      closeBtn.addEventListener('click', () => {
        this.closHisHisDasTableVisibility();
      });
    },

    adjustWindowPosition(container) {
      const rect = container.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // 右侧溢出时调整
      if (rect.right > viewportWidth) {
        container.style.left = `${parseInt(container.style.left) - (rect.right - viewportWidth + 20)}px`;
      }

      // 底部溢出时调整
      if (rect.bottom > viewportHeight) {
        container.style.top = `${parseInt(container.style.top) - (rect.bottom - viewportHeight + 20)}px`;
      }

      // 顶部溢出时调整
      if (rect.top < 0) {
        container.style.top = '20px';
      }
    },
    flashPoints(){
      // console.log(99999,this.riskzone)
      const flag = [];
      const poin = [];
      this.weather_data.forEach(i => {
        if (i.rainfall > 50){
          flag.push(i.name);
        }
      });
      // console.log(7897897987,flag)
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
      // console.log(45646,poin)

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
      console.log(789789,this.countByCounty)
      this.AddChart();
      // console.log(66666666,countByCounty)
      // console.log(46556456464,this.warn_point)
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
    GetHistoryDisaster(){
      getHistoryDisaster().then(history => {
        let data = history.data.features[0];
        this.history_desaster.push(data.properties);
        this.toggleHisDasTableVisibility();
      })

    },

    toggleHisDasTableVisibility(){
      this.tableChange = !this.tableChange;
      this.hisDas = this.history_desaster[0]
      console.log(7897,this.hisDas)
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
  flex: 1; /* 占据中间可用空间 */
  margin: 0 20px;
}

.weather-info {
  display: flex;
  align-items: center;
  gap: 10px; /* 元素之间的间距 */
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
  top: 20px; /* 距离顶部20px */
  right: 0; /* 距离左侧20px */
  background-color: rgba(255, 255, 255, 0.75); /* 与图例背景色一致 */
  color: black;
  padding: 15px;
  border: 1px solid #FFFFFF;
  border-radius: 16px;
  z-index: 1000;
  width: 361px; /* 限制表格宽度 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); /* 添加阴影效果 */
  font-size: 14px; /* 调整字体大小 */
  /* position: relative; /* 移除此行，因为子元素的绝对定位不需要它 */
}

.warn-point-table {
  position: absolute;
  top: 20px; /* 距离顶部20px */
  left: 0; /* 距离左侧20px */
  background-color: rgba(255, 255, 255, 0.75); /* 与图例背景色一致 */
  color: black;
  padding: 15px;
  border: 1px solid #FFFFFF;
  border-radius: 16px;
  z-index: 1000;
  width: 647px; /* 限制表格宽度 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); /* 添加阴影效果 */
  font-size: 14px; /* 调整字体大小 */
}

.toggle-point-table-btn{
  position: absolute;
  top: 5px; /* 调整按钮位置 */
  left: 5px; /* 调整按钮位置 */
  background-image: linear-gradient(159deg, #1c9fff 2%, #9be7ff 128%);
  color: white;
  border: none;
  border-radius: 50%; /* 圆形按钮 */
  width: 25px; /* 按钮宽度 */
  height: 25px; /* 按钮高度 */
  font-size: 14px;
  line-height: 1; /* 垂直居中文本 */
  text-align: center;
  cursor: pointer;
  z-index: 1001; /* 确保按钮在表格内容之上 */
  display: flex;
  justify-content: center;
  align-items: center;
}

.toggle-table-btn {
  position: absolute;
  top: 5px; /* 调整按钮位置 */
  right: 5px; /* 调整按钮位置 */
  background-image: linear-gradient(159deg, #1c9fff 2%, #9be7ff 128%);
  color: white;
  border: none;
  border-radius: 50%; /* 圆形按钮 */
  width: 25px; /* 按钮宽度 */
  height: 25px; /* 按钮高度 */
  font-size: 14px;
  line-height: 1; /* 垂直居中文本 */
  text-align: center;
  cursor: pointer;
  z-index: 1001; /* 确保按钮在表格内容之上 */
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
  margin-bottom: 10px;
  font-size: 16px;
  text-align: center;
  margin-top: 0; /* 将 margin-top 设置为0，避免空白区域 */
  padding-top: 20px; /* 增加内边距，为按钮留出空间 */
}

.chart-container {
  position: absolute;
  bottom: 71px; /* 距离顶部20px */
  left: 0; /* 距离左侧20px */
  /*background-color: white; !* 与图例背景色一致 *!*/
  background-color: rgba(255, 255, 255, 0.75);
  color: white;
  padding: 15px;
  border-radius: 4px;
  z-index: 1000;
  height: 367px;
  width: 420px; /* 限制表格宽度 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); /* 添加阴影效果 */
  font-size: 14px; /* 调整字体大小 */
}

.data-table table {
  width: 100%;
  border-collapse: collapse; /* 合并边框 */
}

.warn-point-table table {
  width: 100%;
  border-collapse: collapse; /* 合并边框 */
}

.data-table th,
.data-table td {
  height: 50px;
  border: 1px solid rgba(255, 255, 255, 0.2); /* 浅色边框 */
  padding: 8px 12px;
  text-align: center;
  font-size: 14px;
}

.warn-point-table th,
.warn-point-table td{
  height: 50px;
  border: 1px solid rgba(255, 255, 255, 0.2); /* 浅色边框 */
  padding: 8px 12px;
  text-align: center;
  font-size: 14px;
}

.data-table th {
  background-color: rgba(255,255,255,0.5); /* 表头背景色 */
  font-weight: bold;
  color: black;
}

.warn-point-table th {
  background-color: rgba(255,255,255,0.5); /* 表头背景色 */
  font-weight: bold;
  color: black;
}

.data-table tbody tr:nth-child(even) {
  background-color: rgba(255,255,255,0.5); /* 斑马纹效果 */
}

.warn-point-table tbody tr:nth-child(even) {
  background-color: rgba(255,255,255,0.5); /* 斑马纹效果 */
}

.data-table tbody tr:hover {
  background-color: rgba(70, 70, 70, 0.9); /* 鼠标悬停效果 */
}

.warn-point-table tbody tr:hover {
  background-color: rgba(70, 70, 70, 0.9); /* 鼠标悬停效果 */
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 10px;
  gap: 10px;
}

.pagination-controls button {
  background-color: #3c86ff;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
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
}

.total-items {
  color: black;
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
  max-width: 200px; /* 限制图例宽度 */
}

.legend-item {
  display: flex;
  align-items: center;
  margin: 4px 0; /* 减小行间距 */
  font-size: 14px; /* 缩小字体 */
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

</style>
