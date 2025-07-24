<template>
<!--  <div class="videoMonitorWin" v-show="visiblePanel" :style="styleObject">-->
<!--    <div v-if="!showStatus">-->
<!--      <div class="header-div">-->
<!--        <span>聚合信息</span>-->
<!--      </div>-->
<!--      <div class="Marking-info-panel">-->
<!--        <el-table :data="tableData" border style="width: 100%">-->
<!--          <el-table-column-->
<!--              prop="type"-->
<!--              label="类型"-->
<!--              width="145">-->
<!--          </el-table-column>-->
<!--          <el-table-column-->
<!--              prop="count"-->
<!--              label="数量"-->
<!--              width="100">-->
<!--          </el-table-column>-->
<!--        </el-table>-->
<!--      </div>-->
<!--    </div>-->
<!--  </div>-->
  <div></div>
</template>

<script>
export default {
  data() {
    return {
      visiblePanel: null,
      positionEntity: {x: 0, y: 0},
      popupPanelData: [],
      showStatus: false,
      data: {},
      tableData: [] // 用于表格展示的数据
    };
  },
  props: ['popupData', 'position', 'visible'],
  watch: {
    visible() {
      this.visiblePanel = this.visible;

    },
    popupData: {
      deep: true,
      handler() {
        this.tableData = this.popupData
      }

    },
    position() {
      this.positionEntity = this.position;
    }
  },
  computed: {
    styleObject() {
      return {
        position: 'absolute',
        left: `${this.positionEntity.x}px`,
        top: `${this.positionEntity.y}px`
      };
    }
  },
  methods: {}
};
</script>

<style scoped>
.videoMonitorWin {
  all: unset; /* 取消继承所有样式 */
  position: absolute;
  width: 306px;
  padding: 2px;
  z-index: 80;
  background-color: rgba(40, 40, 40, 0.7);
  border: 2px solid #18c9dc;
}


.Marking-info-panel {
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  max-width: 100%;
  margin: 10px 10px;
}

.header-div {
  color: white;
  display: flex;
  justify-content: center;
  font-size: 128%;
  align-items: center;
  margin-bottom: 1px;
}



:deep(.el-table td:hover) {
  color: #0c1c50 ;
  box-shadow: 0 0 15px #0c4c7c, inset 0 0 25px #bcd0d9;
  background: transparent;
  transition: all 0.3s;
}


:deep(.el-table th.el-table__cell) {
  background-color:#f9f9f9;
}


:deep(.el-table th) {
  font-size: 0.9rem;
}


:deep(.el-table td) {
  color: #606266;
  background-color: #ffffff;
  text-align: center; /* 水平居中 */
  vertical-align: middle; /* 垂直居中 */
  font-size: 0.8rem;
}


:deep(.el-table th,
.el-table td ){
  padding: 8px;
  text-align: center;
  border: 1px solid #ddd;
  font-weight: 550;
}


@media (max-width: 768px) {
  .videoMonitorWin {
    width: 100%;
    padding: 10px;
  }
}

@media (max-width: 480px) {
  .header-div {
    font-size: 16px;
  }
}
</style>
