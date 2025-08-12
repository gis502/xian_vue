<script>
import {defineComponent} from 'vue'

export default defineComponent({
  name: "WaterDisaster",
  props: {
    info: Object
  },
})

// 危险程度
let dangerLevel = ref("");

// 概率值
let probability = ref(0);

onMounted(() => {
  dangerLevel.value = info.predict.level[0]
  probability.value = info.predict.probability[0]
})
</script>

<!-- 泥石流信息组件 -->
<template>
  <span class="text">危险程度：{{ dangerLevel }}</span>
  <span class="text">产生{{ disasterType }}的概率：{{ probability }}%</span>
  <table class="disaster-info-table">
    <tbody>
    <tr>
      <td class="label">灾害点名称</td>
      <td>{{ info.geologicalDisasterHideDTO.disasterName }}</td>
    </tr>
    <tr>
      <td class="label">规模等级</td>
      <td>{{ info.geologicalDisasterHideDTO.scaleGrade }}</td>
    </tr>
    <tr>
      <td class="label">险情等级</td>
      <td>{{ info.geologicalDisasterHideDTO.riskGrade }}</td>
    </tr>
    <tr>
      <td class="label">地理位置</td>
      <td>{{ info.geologicalDisasterHideDTO.position }}</td>
    </tr>
    <tr>
      <td class="label">经度</td>
      <td>{{ info.geologicalDisasterHideDTO.lon }}</td>
    </tr>
    <tr>
      <td class="label">纬度</td>
      <td>{{ info.geologicalDisasterHideDTO.lat }}</td>
    </tr>
    </tbody>
  </table>
</template>

<style scoped lang="scss">
.text {
  font-size: 20px;
  color: red;
  font-weight: bold;
  margin-bottom: 10px;
  display: block;
  margin-left: 5px;
}
</style>
