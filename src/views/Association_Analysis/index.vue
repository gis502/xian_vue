<template>
  <div id="cesiumContainer">
    <div class="navbar">
      <h2 class="zhts-title">
        <div class="logo">
          <span class="text">西安今日天气</span>
        </div>
      </h2>

      <!-- 天气数据区域-->
      <div class="weather-container">
        <!-- 加载状态 -->
        <div v-if="weatherLoading" class="text-center py-4">
          <i class="fa fa-spinner fa-spin mr-2"></i>加载中...
        </div>

        <!-- 错误状态 -->
        <div v-else-if="weatherError" class="text-center py-4 text-red-500">
          <i class="fa fa-exclamation-circle mr-2"></i>{{ weatherError }}
        </div>
        <!-- 天气数据 -->
        <div v-else-if="weatherData" class="weather-info">

          <!-- 天气状况 -->
          <div class="weather-item">
            <div class="font-medium">{{ weatherData?.weather || '-' }}</div>
          </div>

          <!-- 天气图标 -->
          <div class="weather-item icon-item">
            <span class="text-3xl mr-2" v-text="getWeatherIcon(weatherData?.weather)"></span>
          </div>

          <!-- 温度 -->
          <div class="weather-item temperature-item">
            <span class="text-xl font-bold">温度： {{ weatherData?.temperature || '-' }}°C</span>
          </div>

          <!-- 湿度 -->
          <div class="weather-item">
            <span class="text-sm flex items-center">
              <i class="fa fa-tint text-blue-400 mr-1"></i>
              <!-- 使用 || 确保始终有显示内容 -->
              湿度：{{ weatherData?.humidity || '50' }}%
            </span>
          </div>

          <!-- 降雨量 -->
          <div class="weather-item rainfall-item" v-if="shouldShowRainfall(weatherData?.weather)">
            <span class="text-sm flex items-center">
              <i class="fa fa-cloud-rain text-blue-500 mr-1"></i>
              降雨量：{{ weatherData?.precipitation === '0' ? '无降雨' : `${weatherData.precipitation}mm` }}
            </span>
          </div>

          <!-- 风向 -->
          <div class="weather-item wind-item">
            <span class="text-sm flex items-center">
              <i class="fa fa-location-arrow text-gray-600 mr-1"></i>
              <!-- 使用 || 确保始终有显示内容 -->
              风向：{{ weatherData?.winddirection || '无风向数据' }}风
            </span>
          </div>

          <!-- 获取时间 -->
          <div class="weather-item time-item">
            <span class="text-xs text-gray-500">
              更新时间：{{ formatTime(weatherData?.reporttime) }}
            </span>
          </div>

        </div>
      </div>

      <el-button type="primary" @click="refreshWeather">
        {{'刷新'}}
      </el-button>

      <div>
        <el-select
            v-model="eqlistName"
            placeholder="请选择灾害信息"
            size="large"
            style="width: 350px"
            filterable
        >
        </el-select>
      </div>

    </div>

    <div class="legend">
      <div class="legend-title">图例</div>
      <div class="legend-item"><span class="legend-color" style="background: rgba(246,5,5,0.5);"></span>Ⅻ度</div>
      <div class="legend-item"><span class="legend-color" style="background: rgba(231,7,7,0.4);"></span>Ⅺ度</div>
      <div class="legend-item"><span class="legend-color" style="background: rgba(182,37,37,0.4);"></span>Ⅹ度</div>
      <div class="legend-item"><span class="legend-circle" style="background: yellow;"></span> 震源</div>
      <div class="legend-item"><span class="legend-line" style="background: #ff0000;"></span>断裂带</div>
      <div class="legend-item"><span class="legend-circle" style="background: #ff0000;"></span> 危险源</div>
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

    <!-- 新增的表格区域 -->
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
        <!-- 遍历weather_data数组，每个item对应一个区县的数据 -->
        <tr v-for="(item, index) in weather_data" :key="index">
          <!-- 只显示指定的4个字段，按顺序排列 -->
          <td style="white-space:nowrap;overflow:hidden;text-overflow: ellipsis;" :title="item.name">
            {{ item.name }}
          </td>
          <td style="white-space:nowrap;overflow:hidden;text-overflow: ellipsis;" :title="item.winddirection">
            {{ item.winddirection }}
          </td>
          <td style="white-space:nowrap;overflow:hidden;text-overflow: ellipsis;" :title="item.temperature">
            {{ item.temperature }}°C  <!-- 补充温度单位 -->
          </td>
          <td style="white-space:nowrap;overflow:hidden;text-overflow: ellipsis;" :title="item.rainfall">
            {{ item.rainfall }}mm
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import * as Cesium from "cesium";

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

import "cesium/Source/Widgets/widgets.css";
import lineData from "@/assets/西安断层数据.json";
import DebrisFlow from "@/assets/static/disaster/Huapo.json"
import landslideIcon from "@/assets/images/landslide.png"
import riskArea from "@/assets/static/disaster/xian_risk.json"
import riskAreaIcon from "@/assets/images/riskArea.png"
import flowIcon from "@/assets/images/DebrisFlow.png"
import CesiumNavigation from "cesium-navigation-es6";
import {initCesium} from '@/cesium/initLayer.js'
import axios from 'axios';
import {getFlow, getRisk, getSlide} from "@/api/system/association_analysis.js";

export default {
  name: "index",
  data() {
    return {
      image_landslideIcon:landslideIcon,
      viewer: null,
      handler: null, // 创建共享的 handler
      tdtToken: "72ec1fc9cf0b5783de5bd13f5f85af39",//天地图密钥
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
      administrationData: [BaQiaoArea, BeiLin, ChangAn, GaoLing, HuYi, LanTIan, LianHu, LinTong, WeiYang, XinCheng, YanLiang, YanTa, ZhouZhi],
      adminDataSources:[],
      cityAdcode: '610100', // 西安市 adcode
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
      tableHeaders: ['区县名称','风向', '温度', '降水量'],
      slide: [], // 村村滑坡隐患点信息
      disasterEntities: [],//存储所有添加的实体，用于事件处理
    };
  },
  mounted() {
    this.init();
    this.AddCompass();
    this.loadAdminData(); // 加载行政区划数据
  },
  methods: {

    init() {

      this.viewer = initCesium("cesiumContainer")

      // 注释版权信息
      this.viewer._cesiumWidget._creditContainer.style.display = "none";

      //定位到西安
      this.locatedXiAn();

      //获取天气数据
      this.fetchWeatherData();

      //添加风险区
      this.Addriskzone();

      //添加滑坡隐患点
      this.AddSlide();

      //添加泥石流隐患点
      this.AddFlow();

      //获取区县所有气象数据，并把它们存入数组
      this.fetchDistrictWeather();

    },

    // 获取高德天气数据
    fetchWeatherData() {
      this.weatherLoading = true;
      this.weatherError = null;

      // 使用 extensions=all 获取更详细的天气数据（可能包含降雨量）
      const url = `https://restapi.amap.com/v3/weather/weatherInfo?key=${this.weather}&city=610100&extensions=all`;

      axios.get(url)
          .then(response => {
            // console.log('完整API响应:', response.data);

            if (response.data.status !== '1') {
              throw new Error(`API错误: ${response.data.info}`);
            }

            // 提取实时天气数据（如果有）
            const liveData = response.data.lives && response.data.lives.length > 0
                ? response.data.lives[0]
                : {};

            // 提取预报天气数据（可能包含降雨量）
            const forecastData = response.data.forecasts && response.data.forecasts.length > 0 &&
            response.data.forecasts[0].casts && response.data.forecasts[0].casts.length > 0
                ? response.data.forecasts[0].casts[0] // 今天的预报
                : {};

            // 整合数据，优先使用实时数据，缺少的字段用预报数据补充
            this.weatherData = {
              weather: liveData.weather || forecastData.dayweather || '-', // 天气状况
              temperature: liveData.temperature || forecastData.daytemp || '-', // 温度
              humidity: liveData.humidity ||
                  liveData.humidity_float ||  // 备选字段
                  '50',
              precipitation: liveData.precipitation || forecastData.dayrain || forecastData.rainfall || '0', // 降雨量
              winddirection: liveData.winddirection ||
                  forecastData.daywind ||  // 预报中的风向
                  forecastData.winddirection ||  // 备选字段
                  '无风向数据',  // 最终默认值
              reporttime: liveData.reporttime || new Date().toLocaleString(), // 报告时间
            };

            // console.log('整合后的天气数据:', this.weatherData);
          })
          .catch(error => {
            this.weatherError = error.message;
            console.error('获取天气数据出错:', error);
          })
          .finally(() => {
            this.weatherLoading = false;
          });
    },

    //获取各区县天气数据
    async fetchDistrictWeather() {
      // 清空原有数据
      this.weather_data = [];
      this.districtWeather = [];

      // 1. 先请求所有区县数据
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

      // 2. 等待所有请求完成，处理数据
      const allResults = await Promise.all(requests);
      this.districtWeather = allResults;

      // 3. 筛选出有效数据，取第一个作为基准
      const validDataList = allResults.filter(item => item.is_valid);
      const baseData = validDataList.length > 0 ? validDataList[0] : null;

      // 4. 填充weather_data：无数据的条目复用第一个有效数据的字段（除了降雨量）
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
          minRain = 0;
          maxRain = 5; // 晴天最多5毫米
          break;
        case '小雨':
          minRain = 0.1;
          maxRain = 10;
          break;
        case '中雨':
          minRain = 10.1;
          maxRain = 25;
          break;
        case '大雨':
          minRain = 25.1;
          maxRain = 50;
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

    // 刷新天气数据
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

    toggleTableVisibility(){
      this.isTableVisible = !this.isTableVisible;
    },

    locatedXiAn() {
      //默认定位到西安
      const savedView = localStorage.getItem('mapView');
      if (savedView) {
        const {destination, orientation} = JSON.parse(savedView);
        this.viewer.camera.setView({destination, orientation});
      } else {
        this.viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(108.0, 34.2, 40000.0),
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

    AddCompass(){
      //添加罗盘功能
      const options = {};

      options.defaultResetView = Cesium.Cartographic.fromDegrees(108.948024, 34.263161, 40000.0);
      // 相机方向
      options.orientation = {
        heading: Cesium.Math.toRadians(0),   // 朝向正北（0度）
        roll: 0 // 翻滚角为0
      };
      // 相机延时
      // options.duration = 4; // 默认为3s

      // 用于启用或禁用罗盘。true是启用罗盘，false是禁用罗盘。默认值为true。如果将选项设置为false，则罗盘将不会添加到地图中。
      options.enableCompass = true;
      // 用于启用或禁用缩放控件。true是启用，false是禁用。默认值为true。如果将选项设置为false，则缩放控件将不会添加到地图中。
      options.enableZoomControls = true;
      // 用于启用或禁用距离图例。true是启用，false是禁用。默认值为true。如果将选项设置为false，距离图例将不会添加到地图中。
      options.enableDistanceLegend = true;
      // 用于启用或禁用指南针外环。true是启用，false是禁用。默认值为true。如果将选项设置为false，则该环将可见但无效。
      options.enableCompassOuterRing = true;

      // 修改重置视图的tooltip
      options.resetTooltip = "重置视图";
      // 修改放大按钮的tooltip
      options.zoomInTooltip = "放大";
      // 修改缩小按钮的tooltip
      options.zoomOutTooltip = "缩小";

      new CesiumNavigation(this.viewer, options);
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
              show: true
            },
            // 绑定自定义数据，用于点击时获取信息
            userData: {
              type: 'slide',
              info: pointInfo,
              originalPosition: { lon, lat } // 保存原始经纬度
            }
          });
          this.disasterEntities.push(entity);
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
              show: true
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
              show: true
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
      const left = canvasPosition.x + 20; // 右侧显示
      const top = canvasPosition.y - 100; // 垂直居中

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
          this.configureAdminStyles(dataSource,i);
          // 添加到地图
          this.viewer.dataSources.add(dataSource);
        }).catch(error => {
          console.error(`加载行政区划数据失败 (${this.administrationData[i].name || "未知区域"}):`, error);
          // 继续检查是否所有数据源都已完成（包括失败的）
        });
      }
    },

    // 配置行政区划样式
    configureAdminStyles(dataSource,i) {
      if (!dataSource) return;

      const color = this.generateRandomColor(i);
      const entities = dataSource.entities.values;

      entities.forEach(entity => {
        const name = entity.properties.name._value || dataSource.name;
        // console.log( name,"==================================================")


        entity.polygon = {
          hierarchy: entity.polygon.hierarchy,
          material: color,
          outline: true,
          outlineColor: Cesium.Color.BLUE,
          outlineWidth: 1,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          show: true, // 使用统一的显示控制
          fill: true,
          shadow: true,
          depthFailMaterial: color.withAlpha(0.2)
        };

        if(name !=="新城区"){
          // 计算多边形的中心点作为标签的位置
          const positions = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions; // 输入一组坐标
          const boundingSphere = Cesium.BoundingSphere.fromPoints(positions); // 自动计算中心位置和半径
          entity.position = boundingSphere.center;
        }else{
          let point1 = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions[0];
          let point2 = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions[parseInt(entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions.length/6)];
          let point3 = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions[parseInt(entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions.length/3)];
          entity.position = Cesium.BoundingSphere.fromPoints([point1, point2, point3]).center;
        }

        entity.label = {
          text: name,
          font: '40px',
          fillColor: Cesium.Color.BLACK,
          backgroundColor: color.withAlpha(0.7),
          padding: new Cesium.Cartesian2(5, 5),
          showBackground: true,
          verticalOrigin: Cesium.VerticalOrigin.CENTER, // 将垂直原点设置为中心
          pixelOffset: new Cesium.Cartesian2(0, 0), // 像素偏移量设置为0
          // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 移除此行，因为position已经确定了高度
          show: true // 使用统一的显示控制
        };
      });
    },

    // 颜色生成器函数，增加透明度
    generateRandomColor(i) {
      // 定义13种不同的颜色
      const colors = [
        new Cesium.Color(0.1, 0.5, 0.8, 0.5), // 蓝色
        new Cesium.Color(0.8, 0.1, 0.1, 0.5), // 红色
        new Cesium.Color(0.1, 0.8, 0.1, 0.5), // 绿色
        new Cesium.Color(0.8, 0.8, 0.1, 0.5), // 黄色
        new Cesium.Color(0.8, 0.1, 0.8, 0.5), // 紫色
        new Cesium.Color(0.1, 0.8, 0.8, 0.5), // 青色
        new Cesium.Color(0.5, 0.3, 0.8, 0.5), // 靛蓝色
        new Cesium.Color(0.8, 0.5, 0.1, 0.5), // 橙色
        new Cesium.Color(0.6, 0.2, 0.8, 0.5), // 深紫色
        new Cesium.Color(0.3, 0.8, 0.6, 0.5), // 绿松石色
        new Cesium.Color(0.8, 0.3, 0.5, 0.5), // 粉红色
        new Cesium.Color(0.5, 0.5, 0.5, 0.5), // 灰色
        new Cesium.Color(0.9, 0.6, 0.9, 0.5), // 淡紫色
      ];

      // 确保索引在有效范围内
      if (i >= 0 && i < colors.length) {
        return colors[i];
      } else {
        // 如果索引超出范围，使用默认颜色或循环使用已有颜色
        return colors[i % colors.length];
      }
    },

    flashPoints(){
      // console.log(7897897,this.disasterEntities)
      // const warningCounties = this.weather_data
      //     .filter(item => item.rainfall !== undefined && item.rainfall >= 50)
      //     .map(item => item.name); // 提取区县名称（如"周至县"）
      // console.log(11111,warningCounties)

      const flag = this.weather_data;
      console.log(1, flag);
      flag.forEach(i => {
        console.log(2252,i.name)
        if (i.rainfall > 50){
          console.log(2252,i.name)
        }
      });
      // console.log(11111,warningCounties)

      // 若没有符合条件的区县，停止之前的动画并返回
      // if (warningCounties.length === 0) {
      //   if (this.flashInterval) {
      //     clearInterval(this.flashInterval);
      //     this.flashInterval = null;
      //   }
      //   if (this.haloCollection) {
      //     this.haloCollection.removeAll();
      //   }
      //   return;
      // }
      // const warningPoints = this.slide
      //     .filter(item => warningCounties.includes(item.county)) // 匹配区县名称
      //     .map(item => {
      //       // 假设 slide 中的点包含经纬度字段（longitude/latitude），若字段名不同需修改
      //       return [item.lon, item.lat]; // 转换为 [经度, 纬度] 格式
      //     });
      //
      // // 3. 停止之前的闪烁动画
      // if (this.flashInterval) {
      //   clearInterval(this.flashInterval);
      // }
      // if (this.haloCollection) {
      //   this.haloCollection.removeAll();
      // }
      //
      // // 4. 创建光晕点集合
      // this.haloCollection = new Cesium.PointPrimitiveCollection();
      // this.viewer.scene.primitives.add(this.haloCollection);
      //
      // // 5. 从所有灾害实体中查找匹配的点（使用筛选出的 warningPoints）
      // const entitiesToFlash = [];
      // this.disasterEntities.forEach(entity => {
      //   const position = entity.position.getValue(Cesium.JulianDate.now());
      //   const cartographic = Cesium.Cartographic.fromCartesian(position);
      //   const entityPoint = [
      //     Cesium.Math.toDegrees(cartographic.longitude), // 实体经度（度）
      //     Cesium.Math.toDegrees(cartographic.latitude)   // 实体纬度（度）
      //   ];
      //
      //
      //   // 检查该实体是否在预警点列表中
      //   for (const point of warningPoints) {
      //     // 经纬度误差在 0.00001 度内视为匹配（约1米精度）
      //     if (Math.abs(point[0] - entityPoint[0]) < 0.00001 &&
      //         Math.abs(point[1] - entityPoint[1]) < 0.00001) {
      //       entitiesToFlash.push(entity);
      //
      //       // 创建光晕点
      //       this.haloCollection.add({
      //         position: position,
      //         pixelSize: 15,
      //         color: entity.point.color.getValue(),
      //         outlineColor: Cesium.Color.RED,
      //         outlineWidth: 1,
      //         show: true,
      //         // 自定义光晕材质
      //         material: new Cesium.Material({
      //           fabric: {
      //             type: 'Halo',
      //             uniforms: {
      //               color: entity.point.color.getValue(),
      //               glowPower: 0.5,
      //               innerRadius: 0.5,
      //               outerRadius: 1.0
      //             },
      //             source: `
      //           uniform vec4 color;
      //           uniform float glowPower;
      //           uniform float innerRadius;
      //           uniform float outerRadius;
      //
      //           czm_material czm_getMaterial(czm_materialInput materialInput) {
      //             czm_material material = czm_getDefaultMaterial(materialInput);
      //             vec2 st = materialInput.st;
      //             float dist = distance(st, vec2(0.5, 0.5));
      //             float alpha = smoothstep(outerRadius, innerRadius, dist);
      //             alpha = pow(alpha, glowPower);
      //             material.diffuse = color.rgb;
      //             material.alpha = alpha * color.a;
      //             return material;
      //           }
      //         `
      //           }
      //         })
      //       });
      //
      //       break;
      //     }
      //   }
      // });
      //
      // // 6. 启动动画循环（若有匹配的实体）
      // if (entitiesToFlash.length > 0) {
      //   let animationTime = 0;
      //   const animationDuration = 2000; // 动画周期（毫秒）
      //
      //   this.flashInterval = setInterval(() => {
      //     animationTime = (animationTime + 50) % animationDuration;
      //     const normalizedTime = animationTime / animationDuration;
      //
      //     // 更新所有光晕点的大小和透明度
      //     for (let i = 0; i < this.haloCollection.length; i++) {
      //       const halo = this.haloCollection.get(i);
      //
      //       // 计算光晕大小（1.0-3.0倍原始大小波动）
      //       const baseSize = 15;
      //       const sizeFactor = 1.0 + Math.sin(normalizedTime * Math.PI * 2) * 2;
      //       halo.pixelSize = baseSize * sizeFactor;
      //
      //       // 计算光晕透明度（大小最大时透明度最低）
      //       const alphaFactor = 1.0 - (sizeFactor - 1.0) / 2.0;
      //       const originalColor = entitiesToFlash[i].point.color.getValue();
      //       halo.color = new Cesium.Color(
      //           originalColor.red,
      //           originalColor.green,
      //           originalColor.blue,
      //           alphaFactor * 0.8
      //       );
      //     }
      //   }, 50); // 每50ms更新一次动画
      // }
    },

    draw(type) {
      let that = this;
      let viewer = this.mapViewer;
      let tempEntities = this.tempEntities;
      let position = [];
      let tempPoints = [];
      // 开启深度检测
      viewer.scene.globe.depthTestAgainstTerrain = true;
      if (that.handler) {
        that.handler.destroy();
      }
      this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      switch (type) {
          // case "AddHypocenter":
          //     // 监听鼠标左键
          //   this.handler.setInputAction(movement => {
          //     // 从相机位置通过windowPosition 世界坐标中的像素创建一条射线。返回Cartesian3射线的位置和方向。
          //     let ray = viewer.camera.getPickRay(movement.position);
          //     // 查找射线与渲染的地球表面之间的交点。射线必须以世界坐标给出。返回Cartesian3对象
          //     position = viewer.scene.globe.pick(ray, viewer.scene);
          //     if (position) {
          //       this.selectedPosition = position;
          //       this.showInfoPanel = true;
          //       // console.log(this.showInfoPanel)
          //       that.pointToLineDistance(position);
          //       // console.log("位置已选择:", position);
          //     }
          //     let Hypo = that.drawHypocenter(position);
          //     tempEntities.push(Hypo);
          //     // 绘制完成后立即停止监听
          //     this.handler.destroy();
          //     this.handler = null;
          //   }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
          //
          //     // 双击或右键点击仍可停止绘制
          //   this.handler.setInputAction(function () {
          //     this.handler.destroy();
          //     this. handler = null;
          //     }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
          //
          //   this. handler.setInputAction(function () {
          //     this.handler.destroy();
          //     this.handler = null;
          //     }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
          //   break;
        case "point":
          // 监听鼠标左键
          this.handler.setInputAction(function (movement) {
            // 从相机位置通过windowPosition 世界坐标中的像素创建一条射线。返回Cartesian3射线的位置和方向。
            let ray = viewer.camera.getPickRay(movement.position);
            // 查找射线与渲染的地球表面之间的交点。射线必须以世界坐标给出。返回Cartesian3对象
            position = viewer.scene.globe.pick(ray, viewer.scene);
            let point = that.drawPoint(position);
            tempEntities.push(point);
            that.handler.destroy();
            that.handler = null;
          }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
          // 左键双击停止绘制
          that.handler.setInputAction(function () {
            that.handler.destroy(); //关闭事件句柄
            that.handler = null;
          }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
          // 右击单击停止绘制
          that.handler.setInputAction(function () {
            that.handler.destroy(); //关闭事件句柄
            that.handler = null;
          }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
          break;
        case "polyline":
          //鼠标移动事件
          this.handler.setInputAction(function (movement) {
              },
              Cesium.ScreenSpaceEventType.MOUSE_MOVE);
          //左键点击操作
          this.handler.setInputAction(function (click) {
            //调用获取位置信息的接口
            let ray = viewer.camera.getPickRay(click.position);
            position = viewer.scene.globe.pick(ray, viewer.scene);
            tempPoints.push(position);
            let tempLength = tempPoints.length;
            //调用绘制点的接口
            let point = that.drawPoint(tempPoints[tempPoints.length - 1]);
            tempEntities.push(point);
            if (tempLength > 1) {
              let pointline = that.drawPolyline([
                tempPoints[tempPoints.length - 2],
                tempPoints[tempPoints.length - 1],
              ]);
              tempEntities.push(pointline);
            } else {
              // tooltip.innerHTML = "请绘制下一个点，右键结束";
            }
          }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
          //右键点击操作
          this.handler.setInputAction(function (click) {
            tempPoints = [];
            this.handler.destroy(); //关闭事件句柄
            this.handler = null;
          }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
          break;
        case "polygon":
          //鼠标移动事件
          this.handler.setInputAction(function (movement) {
              },
              Cesium.ScreenSpaceEventType.MOUSE_MOVE);
          //左键点击操作
          this.handler.setInputAction(function (click) {
            //调用获取位置信息的接口
            let ray = viewer.camera.getPickRay(click.position);
            position = viewer.scene.globe.pick(ray, viewer.scene);
            tempPoints.push(position);
            let tempLength = tempPoints.length;
            //调用绘制点的接口
            let point = that.drawPoint(position);
            tempEntities.push(point);
            if (tempLength > 1) {
              let pointline = that.drawPolyline([
                tempPoints[tempPoints.length - 2],
                tempPoints[tempPoints.length - 1],
              ]);
              tempEntities.push(pointline);
            } else {
              // tooltip.innerHTML = "请绘制下一个点，右键结束";
            }
          }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
          //右键点击操作
          this.handler.setInputAction(function (click) {
            let cartesian = viewer.camera.pickEllipsoid(
                click.position,
                viewer.scene.globe.ellipsoid
            );

            if (cartesian) {
              let tempLength = tempPoints.length;
              if (tempLength < 3) {
                alert("请选择3个以上的点再执行闭合操作命令");
              } else {
                //闭合最后一条线
                let pointline = that.drawPolyline([
                  tempPoints[tempPoints.length - 1],
                  tempPoints[0],
                ]);
                tempEntities.push(pointline);
                that.drawPolygon(tempPoints);
                tempEntities.push(tempPoints);
                this.handler.destroy(); //关闭事件句柄
                this.handler = null;
              }
            }
          }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
          break;
      }
    },

    drawPoint(position, config) {
      let viewer = this.mapViewer;
      let config_ = config ? config : {};
      return viewer.entities.add({
        name: "点几何对象",
        position: position,
        point: {
          color: Cesium.Color.RED,
          pixelSize: 5,
          outlineColor: Cesium.Color.RED,
          outlineWidth: 3,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      });
    },

    drawPolyline(positions, config_) {
      let viewer = this.mapViewer;
      if (positions.length < 1) return;
      let config = config_ ? config_ : {};
      return viewer.entities.add({
        name: "线几何对象",
        polyline: {
          positions: positions,
          width: config.width ? config.width : 5.0,
          material: new Cesium.PolylineGlowMaterialProperty({
            color: config.color
                ? new Cesium.Color.fromCssColorString(config.color)
                : Cesium.Color.RED,
          }),
          depthFailMaterial: new Cesium.PolylineGlowMaterialProperty({
            color: config.color
                ? new Cesium.Color.fromCssColorString(config.color)
                : Cesium.Color.RED,
          }),
          clampToGround: true,
        },
      });
    },

    drawPolygon(positions, config_) {
      let viewer = this.mapViewer;
      if (positions.length < 2) return;
      let config = config_ ? config_ : {};
      return viewer.entities.add({
        name: "面几何对象",
        polygon: {
          hierarchy: positions,
          material: config.color
              ? new Cesium.Color.fromCssColorString(config.color).withAlpha(0.2)
              : new Cesium.Color.fromCssColorString("red").withAlpha(0.2),
        },
      });
    },

    drawHypocenter(position) {
      // let config_ = config ? config : {};
      // console.log("123313132131",position)
      this.viewer.entities.add({
        name: "点几何对象",
        //输入笛卡尔坐标系
        position: position.cartesian,
        point: {
          color: Cesium.Color.YELLOW,
          pixelSize: 20,
          outlineColor: Cesium.Color.YELLOW,
          outlineWidth: 3,
          depthTest: false, // 禁止深度测试
          scale: 0.8, // 缩放比例
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
        },
      });
    },

    pointToLineDistance(position) {
      /**
       * point:线外点 longitude latitude height
       * linePoint1, linePoint2：线的两个端点   longitude latitude height
       * return  距离（m）  point ：笛卡尔
       */
      let point = position.cartesian;
      let min_line_distance = 1000000000;
      let min_line = null
      let des;
      let magnitude = this.magnitude;
      let bearing = this.bearing;
      //坐标系转换
      let ellipsoid = this.viewer.scene.globe.ellipsoid;
      let cartographic = ellipsoid.cartesianToCartographic(point);
      let latitude = Cesium.Math.toDegrees(cartographic.latitude);
      let longitude = Cesium.Math.toDegrees(cartographic.longitude);
      // let height = cartographic.height;
      point = {x: longitude, y: latitude}
      // console.log(point,123,point)
      const distancePointToLine = (point, linePoint1, linePoint2) => {
        let p = Cesium.Cartesian3.fromDegrees(point.x, point.y)
        let a = Cesium.Cartesian3.fromDegrees(linePoint1[0], linePoint1[1])
        let b = Cesium.Cartesian3.fromDegrees(linePoint2[0], linePoint2[1])

        //向量ab
        let ab = new Cesium.Cartesian3()
        Cesium.Cartesian3.subtract(b, a, ab)

        //向量ap
        let ap = new Cesium.Cartesian3()
        Cesium.Cartesian3.subtract(p, a, ap)

        //向量ap在ab上的投影
        let abNormalized = new Cesium.Cartesian3()
        Cesium.Cartesian3.normalize(ab, abNormalized)
        let apProjectionMagnitude = Cesium.Cartesian3.dot(ap, abNormalized)
        let apProjection = Cesium.Cartesian3.multiplyByScalar(abNormalized, apProjectionMagnitude, new Cesium.Cartesian3())

        //ap在zb投影的垂足坐标
        let footPoint = new Cesium.Cartesian3()
        Cesium.Cartesian3.add(a, apProjection, footPoint)

        let distanceToA = Cesium.Cartesian3.distance(footPoint, a)
        let distanceToB = Cesium.Cartesian3.distance(footPoint, b)

        let distanceAB = Cesium.Cartesian3.distance(a, b)

        // 浮点数的精度有限，可能会存在微小的误差  因此认为距离差小于0.1 的在ab上
        if (Math.abs(distanceToA + distanceToB - distanceAB) < 0.1) {
          // console.log("footPoint在ab上")
          let distance = Cesium.Cartesian3.distance(footPoint, p)
          return {point: footPoint, distance: distance}
        } else {
          // console.log("footPoint在ab延长线上")
          if (distanceToA < distanceToB) {
            //a距离footPoint最近 返回端点a
            let distance = Cesium.Cartesian3.distance(a, p)
            return {point: a, distance: distance}
          } else {
            //b距离footPoint最近 返回端点b
            let distance = Cesium.Cartesian3.distance(b, p)
            return {point: b, distance: distance}
          }
        }
      }
      // 断裂带数据导入
      this.lineData.features.forEach(line => {
        this.line_data.push(line.geometry)
      })
      this.line_data.forEach(lonlat => {
        let min = 100000000000
        for (let i = 0; i < lonlat.coordinates.length - 1; i++) {
          let linePoint1 = lonlat.coordinates[i]
          let linePoint2 = lonlat.coordinates[i + 1]
          des = distancePointToLine(point, linePoint1, linePoint2).distance
          if (des <= min) {
            min = des;
          }
        }
        if (min < min_line_distance) {
          min_line_distance = min
          //把距离最近的断裂带数组传递给min_line
          min_line = lonlat
        }
      })
      // console.log(min_line_distance,min_line,"==================")
      let first_point = min_line.coordinates[0]
      let last_point = min_line.coordinates[min_line.coordinates.length - 1]
      //测试用
      // this.viewer.entities.add({
      //   position: Cesium.Cartesian3.fromDegrees(first_point[0],first_point[1]),
      //   point: {
      //     color: Cesium.Color.YELLOW,
      //     pixelSize: 10,
      //     outlineColor: Cesium.Color.YELLOW,
      //     outlineWidth: 3,
      //     disableDepthTestDistance: Number.POSITIVE_INFINITY,
      //     heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      //   },
      // });
      // this.viewer.entities.add({
      //   position: Cesium.Cartesian3.fromDegrees(last_point[0],last_point[1]),
      //   point: {
      //     color: Cesium.Color.RED,
      //     pixelSize: 10,
      //     outlineColor: Cesium.Color.RED,
      //     outlineWidth: 3,
      //     disableDepthTestDistance: Number.POSITIVE_INFINITY,
      //     heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      //   },
      // });

      //计算角度
      // this.bearing = this.calculateStrikeDirection(last_point[1], last_point[0], first_point[1], first_point[0])
      bearing = this.calculateStrikeDirection(first_point[0], first_point[1], last_point[0], last_point[1])

      // console.log(bearing, "==================")
      // // 绘制椭圆
      let circle = this.DrawCircle(point, bearing, magnitude);
      this.tempEntities.push(circle)
    },

    calculateStrikeDirection(lon1, lat1, lon2, lat2) {
      // 计算角度，将角度转换为弧度
      const radLat1 = Cesium.Math.toRadians(lat1);
      const radLon1 = Cesium.Math.toRadians(lon1);
      const radLat2 = Cesium.Math.toRadians(lat2);
      const radLon2 = Cesium.Math.toRadians(lon2);

      // 计算经纬度差
      const dLon = radLon2 - radLon1;

      // 计算方位角
      const y = Math.sin(dLon) * Math.cos(radLat2);
      const x = Math.cos(radLat1) * Math.sin(radLat2) - Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(dLon);

      // 计算角度并转换为0-360度范围
      let bearing = Cesium.Math.toDegrees(Math.atan2(y, x));
      bearing = (bearing + 360) % 360;

      return bearing;
    },

    DrawCircle(point, bearing, magnitude) {
      // console.log("88888888888888888")
      // 地震源位置
      let position = point;
      // 根据断裂带计算的角度
      let strikeDirection = bearing;
      let i = 0;

      // 根据震级计算椭圆参数
      const ellipseParams = this.calculateEllipseParams(magnitude);

      // 存储所有创建的椭圆实体
      // const entities = [];

      // 循环创建多个同心椭圆，长轴方向与断裂带走向一致
      ellipseParams.forEach(params => {
        // 将角度转换为弧度（Cesium使用弧度）
        const adjustedDegrees = -(strikeDirection - 90);
        const rotation = Cesium.Math.toRadians(adjustedDegrees);

        let ellipse = new Cesium.Entity({
          position: Cesium.Cartesian3.fromDegrees(position.x, position.y),
          name: "面几何对象",
          ellipse: {
            semiMinorAxis: params.semiMinorAxis*50,
            semiMajorAxis: params.semiMajorAxis*50,
            //extrudedHeight: params.extrudedHeight,
            material: Cesium.Color.RED.withAlpha(params.alpha[i]),
            outline: false,
            outlineColor: Cesium.Color.BLUE,
            rotation: rotation // 设置椭圆旋转角度
          }
        });
        // console.log(params.semiMajorAxis,"长轴")
        // console.log(params.semiMinorAxis,"短轴")
        // console.log(strikeDirection, "方位角(度)");
        // console.log(rotation, "方位角(弧度)");
        this.viewer.entities.add(ellipse);
        i++;
        this.tempEntities.push(ellipse)
        // entities.push(ellipse); // 将实体添加到返回数组
      });

      // return entities; // 返回创建的所有椭圆实体
    },

    clearDrawEntities() {
      //清除所有实体
      let viewer = this.mapViewer;
      this.tempEntities = [];
      // 清除之前的实体
      const entitys = viewer.entities._entities._array;
      let length = entitys.length;
      // 倒叙遍历防止实体减少之后entitys[f]不存在
      for (let f = length - 1; f >= 0; f--) {
        if (
            entitys[f]._name &&
            (entitys[f]._name === "点几何对象" ||
                entitys[f]._name === "线几何对象" ||
                entitys[f]._name === "面几何对象")
        ) {
          viewer.entities.remove(entitys[f]);
        }
      }
    },

    /**
     * @param M  震级
     * @param Ia 长轴烈度
     * @author: xiaodemos
     * @date: 2025/3/31 9:43
     * @description: 计算椭圆长轴
     * @return: 返回椭圆长轴
     */
    calculateRa(M, Ia) {
      const a = (Math.pow(10, (4.0293 + 1.3003 * M - Ia) / 3.6404) - 10) * 27;
      // console.log(a, "=============================")
      return a;
    },

    /**
     * @param M  震级
     * @param Ib 短轴烈度
     * @author: xiaodemos
     * @date: 2025/3/31 9:43
     * @description: 计算椭圆短轴
     * @return: 返回椭圆短轴
     */
    calculateRb(M, Ib) {
      const b = (Math.pow(10, (2.3816 + 1.3003 * M - Ib) / 2.8573) - 5) * 27;
      // console.log(b, "=============================")

      return b;
    },

    // 根据震级和烈度计算椭圆参数的函数
    calculateEllipseParams(magnitude) {
      let sum = magnitude+2;
      // 定义不同层级的烈度值

      let intensityLevels = [
        {ia: sum-2, ib: sum-2},  // 内层椭圆：较高烈度
        {ia: sum-1, ib: sum-1},  // 中层椭圆：中等烈度
        {ia: sum, ib: sum}   // 外层椭圆：较低烈度
      ];

      // 存储计算出的椭圆参数
      let params = intensityLevels.map(level => {
        // 使用提供的公式计算长短轴
        let semiMajorAxis = this.calculateRa(magnitude, level.ia);

        let semiMinorAxis= this.calculateRb(magnitude, level.ib);

        // 根据烈度级别设置透明度
        let alpha = [0.1,0.25,0.4];

        // 计算 extrusion height，使较大的椭圆有更高的 extrusion
        // const extrudedHeight = semiMajorAxis * 0.15;

        return {
          semiMinorAxis,
          semiMajorAxis,
          // extrudedHeight,
          alpha
        };
      });

      // console.log("paramas:===================>", params);

      return params;
    },
  },

  beforeDestroy() {
    if (this.viewer) {
      this.viewer.destroy();
      this.viewer = null;
    }
  }
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

.navbar {
  background-color:rgba(40, 59, 77, 0.8);
  height: 8%;
  display: flex;
  align-items: center;
  padding: 0 20px;
  background-size: 30% 100%;
  z-index: 100;
}

.text-3xl mr-2{
  left: auto;
}

.zhts-title {
  width: 18vw;
  background-size: 100% 100%;
  /*left: 2%;*/
  font-weight: 550;
  font-size: 1.8rem;
  position: relative;
  background-repeat: no-repeat;
  color: #fff;
  /*text-shadow: 0 3px 6px #1973c0;*/
  margin-right: 10px;
}

.text {
  font-size: 20px;
  margin: auto;
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
  top: 82px; /* 距离顶部20px */
  left: 0; /* 距离左侧20px */
  background-color: rgba(40, 40, 40, 0.8); /* 与图例背景色一致 */
  color: white;
  padding: 15px;
  border-radius: 4px;
  z-index: 1000;
  width: 550px; /* 限制表格宽度 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); /* 添加阴影效果 */
  font-size: 14px; /* 调整字体大小 */
  /* position: relative; /* 移除此行，因为子元素的绝对定位不需要它 */
}

.toggle-table-btn {
  position: absolute;
  top: 5px; /* 调整按钮位置 */
  left: 5px; /* 调整按钮位置 */
  background-color: #007bff;
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

.table-title {
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 16px;
  text-align: center;
  margin-top: 0; /* 将 margin-top 设置为0，避免空白区域 */
  padding-top: 20px; /* 增加内边距，为按钮留出空间 */
}




.data-table table {
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

.data-table th {
  background-color: rgba(60, 60, 60, 0.9); /* 表头背景色 */
  font-weight: bold;
}

.data-table tbody tr:nth-child(even) {
  background-color: rgba(50, 50, 50, 0.7); /* 斑马纹效果 */
}

.data-table tbody tr:hover {
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
  background-color: #007bff;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.pagination-controls button:disabled {
  background-color: #6c757d;
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
  margin-left: 10px;
  font-size: 14px;
  color: #ccc;
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

.legend-color {
  width: 18px;
  height: 18px;
  margin-right: 8px; /* 调整颜色块与文字间距 */
  border: 1px solid rgba(255, 255, 255, 0.3); /* 浅色边框 */
}

.legend-circle{
  width: 18px;
  height: 18px;
  border-radius: 50%;
  margin-right: 8px; /* 调整颜色块与文字间距 */
  border: 1px solid rgba(255, 255, 255, 0.3); /* 浅色边框 */
}

.legend-line {
  width: 24px;
  height: 3px;
  margin-right: 8px;
  background-color: red;
  border-radius: 2px;
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
  left: 20px;
}

::v-deep .navigation-controls {
  position: absolute;
  top: 120px;
  left: 53px;
}

</style>
