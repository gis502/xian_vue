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

          <!-- 天气图标 -->
          <div class="weather-item icon-item">
            <span class="text-3xl mr-2" v-text="getWeatherIcon(weatherData?.weather)"></span>
          </div>

          <!-- 天气状况 -->
          <div class="weather-item">
            <div class="font-medium">{{ weatherData?.weather || '-' }}</div>
          </div>

          <!-- 温度 -->
          <div class="weather-item temperature-item">
            <span class="text-xl font-bold">温度： {{ weatherData?.temperature || '-' }}°C</span>
          </div>

          <!-- 湿度 -->
          <div class="weather-item">
            <span class="text-sm">湿度： {{ weatherData?.humidity || '-' }}%</span>
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

      <el-select
          v-model="eqlistName"
          placeholder="请选择灾害信息"
          size="large"
          style="width: 350px"
          filterable
      >
      </el-select>
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
        <div class="legend-icon" id="yhdlen"></div>
        隐患点
      </div>
      <div class="legend-item">
        <div class="legend-icon" id="risk_area"></div>
        风险区
      </div>
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
import CesiumNavigation from "cesium-navigation-es6";
import {initCesium} from '@/cesium/initLayer.js'
import axios from 'axios';

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
      isShowMessage: false,  // 是否显示提示-添加受灾点
      lineData: lineData,
      line_data: [], // 西安所有断裂带的数据
      FaultZone: [], // 西安所有断裂带点的数据
      showFaultZone: false,  // 控制断裂带显示状态的变量
      DebrisFlow: DebrisFlow, // 泥石流隐患点
      riskArea: riskArea, // 泥石流风险区
      HazardPoint: [], // 泥石流隐患点数组
      riskZone: [], // 风险区数组
      showHiddenDangerPoints: false,  // 控制隐患点显示状态的变量
      showriskArea: false, //控制风险区显示的变量
      hasDrawn: false, // 标记是否已经点击过
      isButtonDisabled: false,
      buttonText: '地震模拟',
      operationCompleted: false,
      FaultZone_entities: [],//断裂带实体数组
      HiddenDangerPoints_entities: [],//隐患点实体数组
      riskArea_entities: [],//风险区实体数组
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
      }
    };
  },
  mounted() {
    this.init();
    this.AddCompass();
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

      //添加隐患点
      this.AddHiddenDangerPoints();

      //添加风险区
      this.Addriskzone();
    },

    // 获取高德天气数据
    fetchWeatherData() {
      this.weatherLoading = true;
      this.weatherError = null;

      // 使用 extensions=all 获取更详细的天气数据（可能包含降雨量）
      const url = `https://restapi.amap.com/v3/weather/weatherInfo?key=${this.weather}&city=610100&extensions=all`;

      axios.get(url)
          .then(response => {
            console.log('完整API响应:', response.data);

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
              humidity: liveData.humidity || '-', // 湿度
              precipitation: liveData.precipitation || forecastData.dayrain || forecastData.rainfall || '0', // 降雨量
              winddirection: liveData.winddirection ||
                  forecastData.daywind ||  // 预报中的风向
                  forecastData.winddirection ||  // 备选字段
                  '无风向数据',  // 最终默认值
              reporttime: liveData.reporttime || new Date().toLocaleString(), // 报告时间
            };

            console.log('整合后的天气数据:', this.weatherData);
          })
          .catch(error => {
            this.weatherError = error.message;
            console.error('获取天气数据出错:', error);
          })
          .finally(() => {
            this.weatherLoading = false;
          });
    },

    // 刷新天气数据
    refreshWeather() {
      this.fetchWeatherData();
    },

    getWeatherIcon(code) {
      // 打印实际获取的天气代码，方便调试
      console.log('Weather code:', code);

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


    AddHiddenDangerPoints() {
      //添加隐患点
      let pointInfo;
      this.DebrisFlow.features.forEach(hazard_source => {
        this.HazardPoint.push(hazard_source.geometry)

        // 存储点的详细信息（从原始数据中提取）
        pointInfo = {
          name: hazard_source.properties.disasterName || "灾害点名称",
          lon: hazard_source.properties.lon || "经度",
          lat: hazard_source.properties.lat || "纬度",
          // description: hazard_source.properties.description || '无描述信息'
          // 可根据实际数据结构添加更多字段
        };
        // console.log(pointInfo,"===================")
        this.HazardPoint.forEach(hazard_point => {
          let lon = hazard_point.coordinates[0]
          let lat = hazard_point.coordinates[1]
          let a = this.viewer.entities.add({
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
              type: 'hiddenDangerPoint',
              info: pointInfo,
              originalPosition: { lon, lat } // 保存原始经纬度
            }
          });
          this.HiddenDangerPoints_entities.push(a);
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
          if (entity.userData && entity.userData.type === 'hiddenDangerPoint') {

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
        padding: 15px;
        z-index: 1000;
        max-height: 200px;
        overflow-y: auto;
      `;

      // 构建信息列表内容
      if (entity.userData.type == 'hiddenDangerPoint'){
        container.innerHTML = `
    <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px;">灾害信息</div>
    <div style="margin-bottom: 5px;"><span style="color: #666;">名字:</span> ${info.name}</div>
    <div style="margin-bottom: 5px;"><span style="color: #666;">经度:</span> ${info.lon}</div>
    <div style="margin-bottom: 10px;"><span style="color: #666;">纬度:</span> ${info.lat}</div>
    <button onclick="this.parentNode.remove()" style="background: #f0f0f0; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">关闭</button>
  `;
      }
      else if (entity.userData.type == 'riskArea'){
        container.innerHTML = `
<!--    <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px;">风险区信息</div>-->
    <div style="margin-bottom: 5px;"><span style="color: #666;">风险区名称:</span> ${info.name}</div>
    <div style="margin-bottom: 5px;"><span style="color: #666;">风险区经度:</span> 北纬${info.lon}</div>
    <div style="margin-bottom: 5px;"><span style="color: #666;">风险区纬度:</span> 东经${info.lat}</div>
    <div style="margin-bottom: 5px;"><span style="color: #666;">风险区面积:</span> ${parseFloat(info.area_Km2).toFixed(3)}平方米</div>
    <button onclick="this.parentNode.remove()" style="background: #f0f0f0; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">关闭</button>
  `;
      }


      // 添加到页面
      document.body.appendChild(container);
      // 检查是否超出视口边界并调整位置
      this.adjustWindowPosition(container);
      // this.currentInfoWindow = {
      //   element: container,
      //   initialLeft: left,
      //   initialTop: top,
      //   entityId: entity.id
      // };
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

    Addriskzone() {
      let riskAreaInfo;
      //添加风险区
      this.riskArea.features.forEach(hazard_source => {
        this.riskZone.push(hazard_source.geometry)

        // 存储点的详细信息（从原始数据中提取）
        riskAreaInfo = {
          name: hazard_source.properties.position || "风险区名称",
          lon: hazard_source.properties.lon || "经度",
          lat: hazard_source.properties.lat || "纬度",
          area_Km2: hazard_source.properties.area || "风险区面积",
          // grade: hazard_source.properties.grade || "风险等级",
          // description: hazard_source.properties.description || '无描述信息'
          // 可根据实际数据结构添加更多字段
        };

        // console.log(riskAreaInfo,"====================================")

      })
      this.riskZone.forEach(hazard_point => {
        let lon = hazard_point.coordinates[0]
        let lat = hazard_point.coordinates[1]
        let a = this.viewer.entities.add({
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
          // 绑定自定义数据，用于点击时获取信息
          userData: {
            type: 'riskArea',
            info: riskAreaInfo,
            originalPosition: { lon, lat } // 保存原始经纬度
          }
        });
        this.riskArea_entities.push(a);
      })

      // 设置点击事件处理
      this.setupEntityClickRiskArea();

    },

    setupEntityClickRiskArea() {
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
          if (entity.userData && entity.userData.type === 'riskArea') {

            // //屏幕坐标转世界坐标
            // let cartesian = this.viewer.scene.globe.pick(this.viewer.camera.getPickRay(click.position),this.viewer.scene);
            // //世界坐标转经纬度
            // let ellipsoid=this.viewer.scene.globe.ellipsoid;
            // let cartographic=ellipsoid.cartesianToCartographic(cartesian);
            // let lat=Cesium.Math.toDegrees(cartographic.latitude);
            // let lon=Cesium.Math.toDegrees(cartographic.longitude);
            this.viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(entity.userData.originalPosition.lon, entity.userData.originalPosition.lat, 5000),
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

button {
  background-color: #4CAF50;
  border: none;
  color: white;
  padding: 8px 16px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 14px;
  /*margin-bottom: 10px;*/
  cursor: pointer;
  border-radius: 4px;
  margin: auto;
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
