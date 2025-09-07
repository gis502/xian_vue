<template>
  <div class="rain-info-panel" :style="styleObject">
    <div class="panel-title">暴雨信息</div>
    <div class="panel-content">
      <!-- 一次性展示所有区县 -->
      <div v-for="(entry, index) in entries" :key="entry.code" class="form-item"
           :class="{ 'red-highlight': entry.rainfall > 30 }">
        <!--        <label class="form-label district-label">区县:</label>-->
        <span class="district-name">{{ entry.name }}</span>
        <label :for="'rainfall-' + index" class="form-label rain-label">累积12小时降雨量:</label>
        <input style="margin-right: 10px;" v-model.number="entry.rainfall" type="number" min="0" max="500" step="1"
               :id="'rainfall-' + index"/>
        <span style="margin-right: 20px;">毫米</span>
        <!--        <label style="margin-right: 10px" :for="'duration-' + index" class="form-label duration-label">持续时间:</label>-->
        <!--        <input v-model.number="entry.duration" type="number" min="0" max="72" step="1" :id="'duration-' + index" />-->
        <!--        <span style="margin-left: 5px ;margin-right: 5px;">小时</span>-->
      </div>
      <!--正式测试暴雨触发-->
      <div class="radio-group" style="display: flex; width: 90%; justify-content: space-around; margin: 15px 0;">
        <label style="display: flex; align-items: center; cursor: pointer;">
          <input type="radio" v-model="rainType" value="Z" style="margin-right: 5px;">
          <span>正式</span>
        </label>
        <label style="display: flex; align-items: center; cursor: pointer;">
          <input type="radio" v-model="rainType" value="T" style="margin-right: 5px;">
          <span>测试</span>
        </label>
      </div>
      <div class="button-group">
        <button @click="confirmRainPoint"
                :disabled="entries.length === 0 || entries.every((entry) => !entry.rainfall)"
                style="width: 80px">确认添加
        </button>
        <button @click="cancelRainPoint" style="width: 80px">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref, reactive, computed, watch, onMounted} from 'vue'
import layers from "@/cesium/layers.js"
import timeTransfer from "@/cesium/timeTransfer.js"
import {rainSlideTrigger, saveRain} from "@/api/system/rainModel.js"
import basicLayers from "@/cesium/basicLayers.js"
import * as Cesium from 'cesium'
import {useSimulationPointStore} from "@/store/earthquake/simulation_points.js"
import {getRain} from '@/api/system/aroundanalysis.js'
import {rainTrigger} from "@/api/earthquake/feign.js";

// Props
const props = defineProps({
  selectedPositionLonAndLat: {
    type: Object,
    required: true
  },
  PanelPosition: {
    type: Object,
    required: true
  }
})

// Emits
const emit = defineEmits([
  'update:update-rain-info',
  'update:handleWeather',
  'update:loading-model',
  'update:show-info-panel',
  'update:matched-huapo-entities'
])

// Reactive data
const positionEntity = ref({x: 580, y: 20})
const districts = ref([
  {name: "新城区", code: "610102", longitude: 108.95711992089143, latitude: 34.302601231374936},
  {name: "碑林区", code: "610103", longitude: 108.95711992089143, latitude: 34.25257505041645},
  {name: "莲湖区", code: "610104", longitude: 108.9039622067026, latitude: 34.27250198183504},
  {name: "雁塔区", code: "610113", longitude: 108.93317173586165, latitude: 34.21577280957614},
  {name: "灞桥区", code: "610111", longitude: 109.12523366264605, latitude: 34.302601231374936},
  {name: "未央区", code: "610112", longitude: 108.91858149817126, latitude: 34.34314806899305},
  {name: "阎良区", code: "610114", longitude: 109.29616718893581, latitude: 34.66841441751671},
  {name: "临潼区", code: "610115", longitude: 109.28695751276935, latitude: 34.479725714836256},
  {name: "长安区", code: "610116", longitude: 108.9364817091645, latitude: 34.069790246211475},
  {name: "高陵区", code: "610117", longitude: 109.06326392615283, latitude: 34.50082619715896},
  {name: "鄠邑区", code: "610118", longitude: 108.5221255023836, latitude: 34.0132825050398},
  {name: "蓝田县", code: "610122", longitude: 109.45508618489026, latitude: 34.08207085488606},
  {name: "周至县", code: "610124", longitude: 108.1020792556726, latitude: 33.974619753671824}
])
const entries = ref([])
const adminArea = ref('')
const positionArry = ref([])
const rainfallArry = ref([])
const longitudeArray = ref([])
const latitudeArray = ref([])
// const durationArry = ref([])
const rainType = ref('T')
const matchedHiddenHighlightEntities = ref([])
let area = reactive({
  '灞桥区': {
    longitude: 109.12523366264605,
    latitude: 34.302601231374936
  },
  '碑林区': {
    longitude: 108.95711992089143,
    latitude: 34.25257505041645
  },
  '长安区': {
    longitude: 108.9364817091645,
    latitude: 34.069790246211475
  },
  '高陵区': {
    longitude: 109.06326392615283,
    latitude: 34.50082619715896
  },
  '鄠邑区': {
    longitude: 108.5221255023836,
    latitude: 34.0132825050398
  },
  '蓝田县': {
    longitude: 109.45508618489026,
    latitude: 34.08207085488606
  },
  '莲湖区': {
    longitude: 108.9039622067026,
    latitude: 34.27250198183504
  },
  '临潼区': {
    longitude: 109.28695751276935,
    latitude: 34.479725714836256
  },
  '未央区': {
    longitude: 108.91858149817126,
    latitude: 34.34314806899305
  },
  '阎良区': {
    longitude: 109.29616718893581,
    latitude: 34.66841441751671
  },
  '雁塔区': {
    longitude: 108.93317173586165,
    latitude: 34.21577280957614
  },
  '周至县': {
    longitude: 108.1020792556726,
    latitude: 33.974619753671824
  }
})


// Computed
const styleObject = computed(() => {
  return {
    position: "absolute",
    left: `${positionEntity.value.x}px`,
    top: `${positionEntity.value.y}px`
  }
})

// Watchers
watch(
    () => props.selectedPositionLonAndLat,
    (newVal) => {
      if (newVal) {
        updateEntryDistrict(newVal)
      }
    },
    {immediate: true}
)

// Methods
function updateEntryDistrict(position) {
  adminArea.value = layers.getAdministrationByPoint(position.longitude, position.latitude)
  const district = districts.value.find((d) => d.name === adminArea.value?.name)
  if (district) {
    const index = entries.value.findIndex(item => item.code === district.code)
    if (index > -1) {
      entries.value[index].name = district.name
    }
  }
}

const confirmRainPoint = async () => {
  emit('update:handle-step-status', 2)
  // console.log(entries.value,111);
  // 找到降雨量最大的区域
  let maxRainfallEntry = entries.value.reduce((max, current) => {
    return (current.rainfall > max.rainfall) ? current : max;
  }, entries.value[0]);

  // console.log('降雨量最大的区域:', maxRainfallEntry.name, '降雨量:', maxRainfallEntry.rainfall);

  // 获取对应区域的经纬度坐标
  let targetArea = area[maxRainfallEntry.name];

  let destination = Cesium.Cartesian3.fromDegrees(
      targetArea.longitude,
      targetArea.latitude,
      50000 // 高度设置为50000米，可根据需要调整
  );

  window.viewer.camera.setView({
    destination: destination,
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: 0.0
    }
  });
  // console.log("确认添加数据：", entries.value)
  emit('update:update-rain-info', entries.value)
  if (!props.selectedPositionLonAndLat) return
  let {longitude, latitude} = props.selectedPositionLonAndLat

  emit('update:handleWeather')

  // 过滤并收集有效数据（降雨量>0的才存储）
  positionArry.value = []
  rainfallArry.value = []
  // durationArry.value = []
  longitudeArray.value = []
  latitudeArray.value = []
  entries.value.forEach(item => {
    if (item.rainfall > 0) { // 降雨量为0不存入数组

      console.log(item, "这里会是是是是是是是是是")

      positionArry.value.push(item.name)
      rainfallArry.value.push(item.rainfall)
      longitudeArray.value.push(item.longitude)
      latitudeArray.value.push(item.latitude)
      // durationArry.value.push(item.duration)
    }
  })

  let requestData = {
    "rainfall": rainfallArry.value.join(","),
    // "duration": durationArry.value.join(","),
    "longitude": longitude,
    "latitude": latitude,
    "position": positionArry.value.join(","),
    "disasterName": timeTransfer.timestampToTimeChina(new Date) + adminArea.value.name + "暴雨",
    "occurrenceTime": timeTransfer.timestampToTimeWithT(new Date),
    "rainType": rainType.value
  }
  // console.log(requestData, "requestData saveRain")

  let res = await saveRain(requestData)
  console.log(res, "saveRain")
  // 处理触发数据，选择降雨量最大的一条数据进行专题图产出
  let thematicRequests = {
    "rainfall": rainfallArry.value.join(","),
    "duration": "12",
    "longitude": longitudeArray.value.join(","),
    "latitude": latitudeArray.value.join(","),
    "position": positionArry.value.join(","),
    "occurrenceTime": timeTransfer.timestampToTimeWithT(new Date),
    "rainType": rainType.value
  }
  // 取出多个区县数据的一条进行专题图产出
  let thematicdatas = processData(thematicRequests);
  // 触发专题图模型
  await rainTrigger(thematicdatas)

  emit("passRainId", res.data.rainDisasterId)
  if (adminArea.value) {
    let entity = {
      position: adminArea.value.name,
      longitude: longitude,
      latitude: latitude,
      id: "test_rain",
      trigger: "暴雨",
      rainfall: rainfallArry.value[0] || 0,
      // duration: durationArry.value[0] || 0,
      occurrenceTime: new Date(),
      disasterName: timeTransfer.timestampToTimeChina(new Date()) + "西安市暴雨"
    }
    basicLayers.addCenterPoint(entity)
    emit('update:loading-model', true)
    await processAllDistricts()
    emit('update:loading-model', false)
    emit('update:show-info-panel', false)

  } else {
    console.log("未找到标记点所在的行政区划")
  }
}

const processAllDistricts = async () => {
  let allMatchedHuapoData = []
  let allPointSet = new Set()
  for (let i = 0; i < positionArry.value.length; i++) {
    const adminCoordinates = layers.getAdminCoordinatesByName(positionArry.value[i])
    let allPointsInside = layers.findAllHiddenDisasterPointsInAffectedArea(adminCoordinates)
    let {matchedHuapoData, pointSet} = getHiddenDisasterPointswithCausingFactors(
        allPointsInside,
        i,
        rainfallArry.value
    )
    allMatchedHuapoData.push(...matchedHuapoData)
    Array.from(pointSet).forEach(key => allPointSet.add(key))
  }
  console.log(allPointSet, 123)
  console.log("所有区县汇总数据：", allMatchedHuapoData, allPointSet)
  let matchedHuapoEntities = await caculateRainSlideTrigger(allMatchedHuapoData, allPointSet)
  emit('update:matched-huapo-entities', matchedHuapoEntities)
  matchedHiddenHighlightEntities.value = matchedHuapoEntities
  console.log(matchedHuapoEntities, "matchedHuapoEntities这是匹配的所有点")
  layers.flashHiddenDisasterPoints(matchedHuapoEntities)
}

const cancelRainPoint = () => {
  emit('update:show-info-panel', false)
  emit('update:handle-step-status', 0)
  emit('update:handle-rain-cancel')
  // 重置所有输入值
  entries.value.forEach(entry => {
    entry.rainfall = 0
    // entry.duration = 0
  })
}

const getHiddenDisasterPointswithCausingFactors = (landslidePointsInside, index, rainfallArry) => {
  // console.log(landslidePointsInside, "getHiddenDisasterPointswithCausingFactors")
  let matchedHuapoData = []
  let pointSet = new Set()
  if (landslidePointsInside.length > 0) {
    landslidePointsInside.forEach(point => {
      let lon = point[0]
      let lat = point[1]
      pointSet.add(`${lon},${lat}`)
    })
    useSimulationPointStore().simulationPoints.forEach((item) => {
      let lon = item.geologicalDisasterHideDTO.lon
      let lat = item.geologicalDisasterHideDTO.lat
      let key = `${lon},${lat}`
      if (pointSet.has(key)) {
        matchedHuapoData.push(item)
      }
    })

    // console.log(matchedHuapoData, pointSet, "matchedHuapoData,pointSet")
    matchedHuapoData.forEach(huapoItem => {
      if (Array.isArray(huapoItem.factorVoList)) {
        huapoItem.factorVoList.forEach(factor => {
          if (factor.attributeName === "降雨量") {
            factor.factorValue = rainfallArry[index]
          }
        })
      }
    })
  }
  return {matchedHuapoData, pointSet}
}

const caculateRainSlideTrigger = async (matchedHuapoData, pointSet) => {
  // console.log(matchedHuapoData, "汇总后的matchedHuapoData")
  let requestData = {
    data: []
  }
  matchedHuapoData.forEach(item => {
    let entityId = ''
    if (item.geologicalDisasterHideDTO.disasterType === "风险区域") {
      entityId = "风险区域" + item.geologicalDisasterHideDTO.unitCode
    } else if (item.geologicalDisasterHideDTO.disasterType === "滑坡") {
      entityId = "滑坡隐患点" + item.geologicalDisasterHideDTO.id
    } else if (item.geologicalDisasterHideDTO.disasterType === "泥石流") {
      entityId = "泥石流隐患点" + item.geologicalDisasterHideDTO.id
    } else if (item.geologicalDisasterHideDTO.disasterType === "内涝") {
      entityId = "内涝隐患点" + item.geologicalDisasterHideDTO.id
    } else if (item.geologicalDisasterHideDTO.disasterType === "山洪") {
      entityId = "山洪隐患点" + item.geologicalDisasterHideDTO.id
    }

    let factors = Array.isArray(item.factorVoList) ? item.factorVoList : item.factorVoList ? [item.factorVoList] : []
    let itemFormat = {
      entityId: entityId,
      probability: [],
      level: [],
      disaster: [],
      disasterType: item.geologicalDisasterHideDTO.disasterType,
      factors: factors,
      lon: item.geologicalDisasterHideDTO.lon,
      lat: item.geologicalDisasterHideDTO.lat,
      geologicalDisasterHideDTO: item.geologicalDisasterHideDTO,
    }

    requestData.data.push(itemFormat)
  })
  // console.log("一次性发送的请求数据：", requestData)
  try {
    let matchedHuapoEntities = []
    const res = await rainSlideTrigger(requestData)
    console.log(res.data, "rainSlideTrigger返回结果")
    let formatAnalyzedData = res.data || []

    formatAnalyzedData.forEach(item => {
      matchedHuapoEntities.push(item)
    })

    return matchedHuapoEntities
  } catch (error) {
    console.error("Error in rainSlideTrigger:", error)
    return []
  }
}

// 处理逻辑
function processData(data) {
  // 1. 拆分所有数组字段
  const rainfallArr = data.rainfall.split(",").map(Number);
  const latitudeArr = data.latitude.split(",");
  const longitudeArr = data.longitude.split(",");
  const positionArr = data.position.split(",");

  // 2. 容错：检查数组长度是否一致
  const lengths = [rainfallArr, latitudeArr, longitudeArr, positionArr].map(arr => arr.length);
  if (!lengths.every(len => len === lengths[0])) {
    throw new Error("经纬度、位置和降雨量数组长度不匹配");
  }

  // 3. 找到降雨量最大值及对应索引
  const maxRainfall = Math.max(...rainfallArr);
  const maxIndex = rainfallArr.indexOf(maxRainfall);

  // 4. 提取对应值并转换经纬度为双精度（number类型）
  return {
    disasterName: data.disasterName,
    rainfall: maxRainfall,
    // 核心：使用Number()转换为双精度浮点数
    latitude: Number(latitudeArr[maxIndex]),
    longitude: Number(longitudeArr[maxIndex]),
    position: positionArr[maxIndex],
    occurrenceTime: data.occurrenceTime,
    rainType: data.rainType
  };
}

// Lifecycle
onMounted(() => {
  entries.value = districts.value.map(district => {
    return {
      name: district.name,
      code: district.code,
      rainfall: 0,
      duration: 0,
      longitude: district.longitude,
      latitude: district.latitude
    }
  })
  getRain().then(res => {
    console.log(res.data.features)
    // 初始化所有区县
    let data = res.data.features
    entries.value.forEach(item => {
      // console.log(item)
      let pos = data.find(i => {
        // console.log(i.properties.adminCode,item.code)
        return i.properties.adminCode === item.code
      })
      if (pos && pos.properties.rainPre12Hours !== 0) {
        item.rainfall = pos.properties.rainPre12Hours.toFixed(2)
      }
      // console.log(pos)
    })
  })

})
</script>

<style scoped>
.rain-info-panel {
  position: absolute;
  background-color: rgba(40, 40, 40, 0.8);
  color: white;
  padding: 0;
  border-radius: 6px;
  width: auto;
  max-height: 80vh;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
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
  align-items: center;
}

/* 标红样式增强 */
.red-highlight {
  color: red !important;
}

.red-highlight input {
  color: red !important;
  border: 1px solid red !important;
}

.form-label {
  font-weight: 500;
  flex-shrink: 0;
  display: inline-block;
  margin-right: 2px;
  margin-left: 10px;
  white-space: nowrap;
}

.district-label {
  width: 37px;
}

.district-name {
  margin: 0 10px;
  min-width: 50px;
  display: inline-block;
}

/*.duration-label {
  width: 70px;
}
*/
.panel-content input {
  width: 60px;
  padding: 6px 8px;
  border: none;
  border-radius: 4px;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  height: 25px;
  box-sizing: border-box;
  margin-left: 5px;
}

.panel-content select {
  height: 25px;
}

.panel-content span {
  width: auto;
  text-align: left;
  display: inline-block;
  height: 30px;
  line-height: 30px;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  justify-content: center;
  padding: 10px;
}

.panel-content button {
  padding: 6px 12px;
  background-color: #386641;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  height: 32px;
  line-height: normal;
}

.panel-content button:last-child {
  background-color: #bc4749;
}

.panel-content button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
</style>
