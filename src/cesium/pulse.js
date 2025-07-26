import * as Cesium from "cesium";

/**
 * 脉冲工具
 */
export const pulseUtils = {
  /**
   * 创建脉冲
   * @param {Array} points - 后端返回的数据
   * @param {Object} store - 存储对象
   * @param {Object} viewer - 视图
   */
  createPause: (points, store, viewer) => {
    for (let i = 0; i < points.length; i++) {
      // 检测脉冲是否已经存在，如果存在，则清除脉冲
      if (
        store.entityCorrespondenceRelationship.hasOwnProperty(
          points[i].entityId
        )
      ) {
        // 删除脉冲对象
        pulseUtils.deletePulseEntity(
          store.entityCorrespondenceRelationship[points[i].entityId],
          store,
          viewer
        );

        // 删除对应关系
        store.removeentityCorrespondenceRelationship(points[i].entityId);
      }
      // 没有预测值，直接返回
      if (!points[i].predict) continue;

      // 处理预测值
      if (
        points[i].predict.level === "高" ||
        points[i].predict.level === "中"
      ) {
        const entityId = `PULSE_${Math.floor(Math.random() * 10000000)}`;

        // 创建脉冲
        const haloEntity = viewer.entities.add({
          id: entityId,
          position: Cesium.Cartesian3.fromDegrees(
            points[i].geologicalDisasterHideDTO.lon,
            points[i].geologicalDisasterHideDTO.lat
          ),
          point: {
            pixelSize: 40, // 增大光晕大小，使其更明显
            color: Cesium.Color.RED.withAlpha(0.4), // 提高透明度，使其更明显
            outlineColor: Cesium.Color.RED.withAlpha(1.0), // 完全不透明的边框
            outlineWidth: 1, // 适中的边框宽度
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY, // 确保不被地形遮挡
          },
        });

        // 根据等级确定颜色
        if (points[i].predict.level === "高") {
          pulseUtils.addPulseAnimation(haloEntity, Cesium.Color.RED);
        } else if (points[i].predict.level === "中") {
          pulseUtils.addPulseAnimation(haloEntity, Cesium.Color.YELLOW);
        }

        // 保存脉冲
        store.pulseEntities.push(entityId);

        // 保存实体id与脉冲id对应关系
        store.entityCorrespondenceRelationship[points[i].entityId] = entityId;
      }
    }
  },

  /**
   * 添加脉冲效果
   * @param {*} haloEntity - 创建的实体
   * @param {*} baseColor - 颜色
   */
  addPulseAnimation: (haloEntity, baseColor) => {
    let pulsePhase = 0;
    // 使用定时器创建脉冲效果
    const pulseInterval = setInterval(() => {
      pulsePhase += 0.5; // 稍微加快动画速度
      const alpha = 0.2 + 0.5 * Math.sin(pulsePhase); // 提高透明度范围
      const size = 30 + 20 * Math.sin(pulsePhase); // 增大尺寸变化范围

      haloEntity.point.color = baseColor.withAlpha(alpha);
      haloEntity.point.pixelSize = size;
    }, 300); // 适中的更新频率

    // 存储定时器引用以便清理
    haloEntity.pulseInterval = pulseInterval;
  },

  /**
   * 清空所有脉冲实体
   * @param {Object} store - 存储对象
   * @param {Cesium.Viewer} viewer - Cesium Viewer实例
   */
  removePulseEntity: (store, viewer) => {
    // 删除脉冲实体
    store.pulseEntities.forEach((id) => {
      const entity = viewer.entities.getById(id);
      if (entity) {
        viewer.entities.remove(entity);
      }
      // 清除脉冲实体保存的数据
      store.clearPulseEntities();
    });
  },

  /**
   * 根据id删除脉冲实体
   * @param {String} id
   * @param {Object} store - 存储对象
   * @param {Object} viewer - 视图对象
   */
  deletePulseEntity: (id, store, viewer) => {
    // 删除脉冲实体
    const entity = viewer.entities.getById(id);
    if (entity) {
      viewer.entities.remove(entity);
    }
    // 清除脉冲实体保存的数据
    store.removePulseEntity(id);
  },
};
