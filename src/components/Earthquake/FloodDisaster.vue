<template>
  <table class="disaster-info-table">
    <tbody>
    <tr>
      <td class="label">灾害点名称</td>
      <td>{{ info.geologicalDisasterHideDTO.disasterName }}</td>
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

<script setup name="FloodDisaster">
defineProps(['info'])
</script>

<style scoped>
</style>
