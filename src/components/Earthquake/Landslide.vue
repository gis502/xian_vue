<!-- 滑坡信息组件 -->
<template>
  <table class="disaster-info-table">
    <tbody>
      <tr>
        <td class="label">野外编号</td>
        <td>{{ info.geologicalDisasterHideDTO.fieldCode }}</td>
      </tr>
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
        <td>东经{{ info.geologicalDisasterHideDTO.lon }}</td>
      </tr>
      <tr>
        <td class="label">纬度</td>
        <td>北纬{{ info.geologicalDisasterHideDTO.lat }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup name="DisasterInformation">
defineProps(["info"]);
</script>

<style scoped></style>
