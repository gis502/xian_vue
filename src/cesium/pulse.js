import * as Cesium from 'cesium';

/**
 * 脉冲工具
 */
export class PulseTool {
  /**
   * 构造器
   * @param {Object} viewer - cesium的viewer对象
   * @param {number} [maxRadius=30] - 脉冲最大半径
   * @param {number} [duration=3] - 脉冲持续时间
   */
  constructor(viewer, maxRadius = 30, duration = 3) {
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

    points.forEach((pt, idx) => {
      // 跳过无效数据
      if (!pt?.geologicalDisasterHideDTO || !pt.predict) return;

      const dto = pt.geologicalDisasterHideDTO;
      const key = `${dto.disasterType}_${dto.id}`; // 唯一 key
      const level = pt.predict.level;

      if (level !== '高' && level !== '中') return;

      // 如果已有脉冲 -> 先删除
      if (this._entityPulseMap[key]) {
        this.deletePulseEntity(key);
      }

      // 生成唯一 pulseId
      const pulseId = `PULSE_${key}_${Date.now()}`;
      this.createOptimizedPulseCircle(
          pulseId,
          dto.lon,
          dto.lat,
          this._maxRadius,
          this._duration,
          level === '高' ? Cesium.Color.RED : Cesium.Color.YELLOW
      );

      // 记录映射
      this._entityPulseMap[key] = pulseId;
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
    for (const entityId in this._entityPulseMap) {
      this.deletePulseEntity(entityId);
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
