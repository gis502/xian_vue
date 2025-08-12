import * as Cesium from 'cesium';

/**
 * 脉冲工具
 */
export class PulseTool {
  /**
   * 构造器
   * @param {Object} viewer - cesium的viewer对象
   * @param {number} [maxRadius=30] - 脉冲最大半径
   * @param {number} [duration=5] - 脉冲持续时间
   */
  constructor(viewer, maxRadius = 30, duration = 5) {
    this._viewer = viewer;
    // 存储实体与脉冲对应关系
    this._entityPulseMap = {};
    // 变量
    this._maxRadius = maxRadius;
    this._duration = duration;
    // 圆背景图，用于呈现脉冲
    this._circle = this.createCircleImage(this._maxRadius);
  }

  /**
   * 绘制脉冲
   * @param {array} points - 绘制点的合集
   */
  createPause(points) {
    if (!Array.isArray(points)) return;

    // 建立disasterType与disaster数组元素的映射关系
    const disasterTypeMap = {
      "滑坡": "landslide",
      "泥石流": "debris_flow",
      "山洪": "torrential_flood",
      "内涝": "water_logging",
      "堰塞湖": "barrier_lake"
    };

    points.forEach((pt) => {
      // 跳过无效数据（检查必要字段是否存在）
      if (!pt?.disasterType || !Array.isArray(pt.disaster) ||
          !Array.isArray(pt.level) || !Array.isArray(pt.probability)) {
        return;
      }

      // 获取当前disasterType对应的disaster数组元素
      const disasterKey = disasterTypeMap[pt.disasterType];
      if (!disasterKey) {
        console.warn(`未找到与disasterType "${pt.disasterType}" 匹配的映射`);
        return;
      }

      // 找到对应的索引（disaster、level、probability数组顺序一一对应）
      const index = pt.disaster.indexOf(disasterKey);
      if (index === -1 || index >= pt.level.length || index >= pt.probability.length) {
        console.warn(`在disaster数组中未找到 "${disasterKey}" 或索引超出范围`);
        return;
      }

      // 获取对应的等级和概率
      const level = pt.level[index];
      const probability = pt.probability[index];
      // 只处理等级为"高"或"中"的情况
      if (level !== '高' && level !== '中') return;

      // 生成唯一key（结合entityId和灾害类型确保唯一性）
      const key = `${pt.disasterType}_${pt.entityId}_${disasterKey}`;

      // 如果已有脉冲 -> 先删除
      if (this._entityPulseMap[key]) {
        this.deletePulseEntity(key);
      }

      // 生成唯一 pulseId，可包含概率信息
      const pulseId = `PULSE_${key}_${Date.now()}_prob${probability}`;

      // 创建脉冲圆圈，根据等级设置颜色
      this.createOptimizedPulseCircle(
          pulseId,
          pt.lon,  // 假设经纬度字段为lon和lat
          pt.lat,
          this._maxRadius,
          this._duration,
          level === '高' ? Cesium.Color.RED : Cesium.Color.YELLOW
      );

      // 记录映射关系，可同时存储概率信息
      this._entityPulseMap[key] = {
        pulseId,
        probability,
        level
      };
    });
  }
  /**
   * 创建脉冲实体
   * @param {string} pulseId - 脉冲实体id
   * @param {number} lon - 经度
   * @param {number} lat - 纬度
   * @param {number} maxRadius - 最大半径/px
   * @param {number} duration - 持续时间/s
   * @param {Object} color - 颜色
   * @returns
   */
  createOptimizedPulseCircle(pulseId, lon, lat, maxRadius, duration, color) {
    console.log("createOptimizedPulseCirclecreateOptimizedPulseCircle")
    const startTime = Cesium.JulianDate.now();

    const entity = window.viewer.entities.add({
      name: '隐患点呼吸圈',
      properties: {
        longitude:lon,
        latitude:lat,
      },
      id: pulseId,
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      billboard: {
        image: this._circle,
        width: new Cesium.CallbackProperty((time) => {
          const elapsed =
            Cesium.JulianDate.secondsDifference(time, startTime) % duration;
          const progress = elapsed / duration;
          return maxRadius * 2 * Math.abs(Math.sin(progress * Math.PI));
        }, false),
        height: new Cesium.CallbackProperty((time) => {
          const elapsed =
            Cesium.JulianDate.secondsDifference(time, startTime) % duration;
          const progress = elapsed / duration;
          return maxRadius * 2 * Math.abs(Math.sin(progress * Math.PI));
        }, false),
        color: new Cesium.CallbackProperty((time) => {
          const elapsed =
            Cesium.JulianDate.secondsDifference(time, startTime) % duration;
          const progress = elapsed / duration;
          const alpha = 0.7 * (1 - progress);
          return color.withAlpha(alpha);
        }, false),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      },
    });

    return entity;
  }

  /**
   * 生成图形贴图函数
   * @returns
   */
  createCircleImage(maxRadius) {
    // 创建一个虚拟的canvas
    const canvas = document.createElement('canvas');
    canvas.width = maxRadius * 2;
    canvas.height = maxRadius * 2;
    const context = canvas.getContext('2d');

    // 清空canvas，确保背景透明
    context.clearRect(0, 0, maxRadius, maxRadius);

    // 开始绘制圆
    context.beginPath();
    // 绘制圆，arc参数说明：x,y,半径,起始角度,结束角度,顺时针/逆时针
    // 绘制圆从canvas中心开始绘制，所以x,y坐标都为maxRadius
    // 半径为maxRadius
    context.arc(maxRadius, maxRadius, maxRadius, 0, Math.PI * 2, false);

    // 闭合路径
    context.closePath();

    // 填充颜色，透明
    context.fillStyle = 'rgba(255,255,255,0.7)';
    context.fill();
    return canvas.toDataURL('image/png');
  }

  /**
   * 移除所有脉冲
   */
  removePulseEntity() {
    let toRemove = window.viewer.entities.values.filter(
        e => e.name === '隐患点呼吸圈'
    );
    if (toRemove) {
      // 2. 逐个删除
      toRemove.forEach(entity => {
        window.viewer.entities.remove(entity);
      });
    }
  }

  /**
   * 删除脉冲
   * @param {string} entityId - 实体id
   */
  deletePulseEntity(entityId) {
    const pulseId = this._entityPulseMap[entityId];
    // 删除脉冲实体
    const entity = this._viewer.entities.getById(pulseId);
    if (entity) {
      this._viewer.entities.remove(entity);
    }
    // 删除实体对应脉冲
    delete this._entityPulseMap[entityId];
  }
}
