<!-- 滑坡信息组件 -->
<template>
  <table class="disaster-info-table">
    <tbody>
      <tr>
        <td class="label">野外编号</td>
        <td>{{ info["野外编号"] }}</td>
      </tr>
      <tr>
        <td class="label">灾害点名称</td>
        <td>{{ info["灾害点名称"] }}</td>
      </tr>
      <tr>
        <td class="label">规模等级</td>
        <td>{{ info["规模等级"] }}</td>
      </tr>
      <tr>
        <td class="label">险情等级</td>
        <td>{{ info["险情等级"] }}</td>
      </tr>
      <tr>
        <td class="label">受灾面积</td>
        <td>{{ parseFloat(info["面积"]).toFixed( 2 ) }}平方米</td>
      </tr>
      <tr>
        <td class="label">地理位置</td>
        <td>{{ info["地理位置"] }}</td>
      </tr>
      <tr>
        <td class="label">经度</td>
        <td>东经{{ info["lon"] }}</td>
      </tr>
      <tr>
        <td class="label">纬度</td>
        <td>北纬{{ info["lat"] }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup name="DisasterInformation">
defineProps(['info'])
</script>

<style scoped></style>
