<!-- 泥石流信息组件 -->
<template>
  <table class="disaster-info-table">
    <tbody>
      <tr>
        <td class="label">灾害点名称</td>
        <td>{{ info.disasterName }}</td>
      </tr>
      <tr>
        <td class="label">野外编号</td>
        <td>{{ info.fieldCode }}</td>
      </tr>
      <tr>
        <td class="label">规模等级</td>
        <td>{{ info.scaleGrade }}</td>
      </tr>
      <tr>
        <td class="label">险情等级</td>
        <td>{{ info.riskGrade }}</td>
      </tr>
      <tr>
        <td class="label">地理位置</td>
        <td>{{ info.position }}</td>
      </tr>
      <tr>
        <td class="label">经度</td>
        <td>{{ info.lon }}</td>
      </tr>
      <tr>
        <td class="label">纬度</td>
        <td>{{ info.lat }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup name="DebrisFlow">
defineProps(["info"]);
</script>

<style scoped></style>
