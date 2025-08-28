<template>
  <div class="button-container">
    <el-button type="primary" @click="drawer = true">
      相似历史灾害匹配
    </el-button>
  </div>

  <el-drawer
      v-model="drawer"
      title="相似历史灾害信息"
      :with-header="true"
      :width="600"
  >
    <div class="drawer-content">
      <el-descriptions
          class="margin-top"
          :column="1"
          border
          v-for="(disaster, index) in disasterList"
          :key="index"
      >
        <template #extra>
        </template>
        <el-descriptions-item>
          <template #label>
            <div class="cell-item">
              <el-icon :style="iconStyle">
                <User />
              </el-icon>
              灾害名称
            </div>
          </template>
          {{ disaster.disasterName }}
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label>
            <div class="cell-item">
              <el-icon :style="iconStyle">
                <Iphone />
              </el-icon>
              发生时间
            </div>
          </template>
          {{ disaster.occurrenceTime }}
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label>
            <div class="cell-item">
              <el-icon :style="iconStyle">
                <Location />
              </el-icon>
              发生地点
            </div>
          </template>
          {{ disaster.position }}
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label>
            <div class="cell-item">
              <el-icon :style="iconStyle">
                <Tickets />
              </el-icon>
              经度
            </div>
          </template>
          {{ disaster.longitude }}
        </el-descriptions-item>
        <el-descriptions-item>
          <template #label>
            <div class="cell-item">
              <el-icon :style="iconStyle">
                <OfficeBuilding />
              </el-icon>
              纬度
            </div>
          </template>
          {{ disaster.latitude }}
        </el-descriptions-item>
      </el-descriptions>

    </div>
  </el-drawer>


</template>

<script setup lang="ts" name="historicalDisasterMatch">
import {ref, computed, defineProps, onMounted} from 'vue'
import {
  Iphone,
  Location,
  OfficeBuilding,
  Tickets,
  User,
} from '@element-plus/icons-vue'

const drawer = ref(false)
const { disasterList } = defineProps(["disasterList"]);

const iconStyle = computed(() => {
  return {
    marginRight: '6px'
  }
})

</script>

<style scoped lang="scss">
.button-container {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

.drawer-content {
  padding: 20px;
}



.el-descriptions {
  margin-top: 20px;
}

.cell-item {
  display: flex;
  align-items: center;
}

.margin-top {
  margin-top: 20px;
}
</style>
