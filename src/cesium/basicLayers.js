import * as Cesium from 'cesium'
// 引入西安行政区划数据
import BaQiaoArea from '@/assets/static/area/BaQiao.json';
import BeiLin from '@/assets/static/area/BeiLin.json';
import ChangAn from '@/assets/static/area/ChangAn.json';
import GaoLing from '@/assets/static/area/GaoLing.json';
import HuYi from '@/assets/static/area/HuYi.json';
import LanTIan from '@/assets/static/area/LanTIan.json';
import LianHu from '@/assets/static/area/LianHu.json';
import LinTong from '@/assets/static/area/LinTong.json';
import WeiYang from '@/assets/static/area/WeiYang.json';
import XinCheng from '@/assets/static/area/XinCheng.json';
import YanLiang from '@/assets/static/area/YanLiang.json';
import YanTa from '@/assets/static/area/YanTa.json';
import ZhouZhi from '@/assets/static/area/ZhouZhi.json';

import centerstar from "@/assets/icons/TimeLine/黄点点.png";
import lineData from "@/assets/西安断层数据.json";
import DebrisFlow from "@/assets/西安泥石流灾害点.json";
import debrisFlowIcon from "@/assets/images/DebrisFlow.png";
import landslide from '@/assets/landslide/landslide.json'
import landslideIcon from "@/assets/images/landslide.png";
import landslide_surface01 from "@/assets/images/landslide_surface01.jpg";
import riskArea from "@/assets/images/riskArea.png";
import DangerAreaData from '@/assets/static/disaster/xian_risk.json'


let basicLayers = {
    addCenterPoint(item) {
        // console.log(item,"addCenterPoint item")
        //点的属性 震中点统用一一个方法
        let img = centerstar
        let labeltext = item.disasterName
        let entity = null
        if (window.viewer && window.viewer.entities) {
            entity = window.viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(
                    parseFloat(item.longitude),
                    parseFloat(item.latitude),
                    parseFloat(0)
                ),
                billboard: {
                    image: img,
                    width: 40,
                    height: 40,
                    eyeOffset: new Cesium.Cartesian3(0, 0, 0),
                    scale: 0.8,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    depthTest: false,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    color: Cesium.Color.WHITE.withAlpha(1),//颜色
                    clampToGround: true,
                },
                label: {
                    text: labeltext,
                    show: true,
                    font: '14px sans-serif',
                    fillColor: Cesium.Color.RED,        //字体颜色
                    backgroundColor: Cesium.Color.WHITE.withAlpha(0.7),
                    showBackground: true,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 2,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(0, -16),
                },
                id: item.id,
                plottype: item.trigger + "中心",
                name: item.trigger + "中心",
                properties: {...item}
            })
        }
        return entity;
    },
    removeCenterPoint(id) {
        const entity = window.viewer.entities.getById(id);
        if (entity) {
            window.viewer.entities.remove(entity)
        }
    },
    addFaultZone() {
        let line_data = []
        lineData.features.forEach(line => {
            // console.log(line.geometry)
            line_data.push(line.geometry)
        })

        line_data.forEach(Lon_Lat => {
            let FaultZone = []
            Lon_Lat.coordinates.forEach(LonLat => {
                LonLat.forEach(point => {
                    FaultZone.push(Number(point))
                })
            })
            window.viewer.entities.add({
                name: "断裂带",
                polyline: {
                    positions: Cesium.Cartesian3.fromDegreesArray(FaultZone),
                    // 宽度
                    width: 2,
                    // 线的颜色
                    material: Cesium.Color.RED,
                    // 线的顺序,仅当`clampToGround`为true并且支持地形上的折线时才有效。
                    zIndex: 10,
                    // 显示在距相机的距离处的属性，多少区间内是可以显示的
                    distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0),
                    // 是否显示
                    show: true,
                },
                // label
            });
        })
    },
    removeFaultZone() {
        let toRemove = window.viewer.entities.values.filter(
            e => e.name === '断裂带'
        );
        if (toRemove) {
            // 2. 逐个删除
            toRemove.forEach(entity => {
                window.viewer.entities.remove(entity);
            });
        }
    },
    loadAdminData() {
        let administrationData = [BaQiaoArea, BeiLin, ChangAn, GaoLing, HuYi, LanTIan, LianHu, LinTong, WeiYang, XinCheng, YanLiang, YanTa, ZhouZhi]

        const colors = [
            new Cesium.Color(255 / 255, 153 / 255, 0 / 255, 0.3),
            new Cesium.Color(255 / 255, 51 / 255, 102 / 255, 0.3),
            new Cesium.Color(0 / 255, 178 / 255, 255 / 255, 0.3),
            new Cesium.Color(102 / 255, 255 / 255, 102 / 255, 0.3),
            new Cesium.Color(204 / 255, 102 / 255, 255 / 255, 0.3),
            new Cesium.Color(255 / 255, 204 / 255, 0 / 255, 0.3),
            new Cesium.Color(0 / 255, 204 / 255, 153 / 255, 0.3),
            new Cesium.Color(255 / 255, 102 / 255, 102 / 255, 0.3),
            new Cesium.Color(102 / 255, 153 / 255, 255 / 255, 0.3),
            new Cesium.Color(255 / 255, 178 / 255, 102 / 255, 0.3),
            new Cesium.Color(153 / 255, 255 / 255, 204 / 255, 0.3),
            new Cesium.Color(255 / 255, 153 / 255, 204 / 255, 0.3),
            new Cesium.Color(190 / 255, 255 / 255, 232 / 255, 0.3)
        ]
        const pickColor = i => colors[i % colors.length]

        /** 2. 为单个 DataSource 设置样式（自动兼容 MultiPolygon -> Polygon） */
            //多个面只在最大的一个面上加标签
            // 放在 loadAdminData 外层，或者 configureAdminStyles 外层
        const labelPrinted = new Map();   // 记录已打印过标签的区县

        function configureAdminStyles(dataSource, color) {
            if (!dataSource) return;
            dataSource.entities.values.forEach(entity => {
                if (!entity.polygon) return;
                const name = entity.properties.name._value || dataSource.name;
                entity.polygon = {
                    hierarchy: entity.polygon.hierarchy,
                    material: color,
                    outline: true,
                    outlineColor: Cesium.Color.BLUE,
                    outlineWidth: 1,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    show: true, // 使用统一的显示控制
                    fill: true,
                    shadow: true,
                    depthFailMaterial: color.withAlpha(0.2)
                };


                // 只在第一次出现的 name 上加 label
                if (!labelPrinted.has(name)) {
                    labelPrinted.set(name, true);

                    if (name !== "新城区") {
                        // 计算多边形的中心点作为标签的位置
                        const positions = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions; // 输入一组坐标
                        const boundingSphere = Cesium.BoundingSphere.fromPoints(positions); // 自动计算中心位置和半径
                        entity.position = boundingSphere.center;
                    } else {
                        let point1 = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions[0];
                        let point2 = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions[parseInt(entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions.length / 6)];
                        let point3 = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions[parseInt(entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions.length / 3)];
                        entity.position = Cesium.BoundingSphere.fromPoints([point1, point2, point3]).center;
                    }
                    entity.label = {
                        text: name,
                        font: '40px',
                        fillColor: Cesium.Color.BLACK,
                        backgroundColor: color.withAlpha(0.7),
                        padding: new Cesium.Cartesian2(5, 5),
                        showBackground: true,
                        verticalOrigin: Cesium.VerticalOrigin.CENTER, // 将垂直原点设置为中心
                        pixelOffset: new Cesium.Cartesian2(0, 0), // 像素偏移量设置为0
                        // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 移除此行，因为position已经确定了高度
                        show: true // 使用统一的显示控制
                    };
                }
            });
        }

        // 3. 统一异步加载
        const tasks = administrationData.map((geojson, idx) =>
            Cesium.GeoJsonDataSource.load(geojson, {
                enableFeatureStyles: false,
                clampToGround: true,
                suppressPointLabels: true
            }).then(ds => {
                ds.name = `区县-${geojson.features?.[0]?.properties?.name || idx}`
                const color = pickColor(idx)
                configureAdminStyles(ds, color)
                window.viewer.dataSources.add(ds)
                return ds
            }).catch(err =>
                console.error(`加载 ${geojson.features?.[0]?.properties?.name || idx} 失败:`, err)
            )
        )
        Promise.all(tasks).then(() => console.log('所有区县加载完成'))
    },
    removeAdminData() {
        // 遍历当前所有数据源
        const toRemove = window.viewer.dataSources._dataSources.filter(
            ds => ds.name && ds.name.startsWith('区县-')
        )
        toRemove.forEach(ds => window.viewer.dataSources.remove(ds, true))
    },

    AddHazardSource() {
        let HazardPoint = []
        //添加隐患点
        DebrisFlow.features.forEach(hazard_source => {
            HazardPoint.push(hazard_source)
        })
        HazardPoint.forEach(hazard_point => {
            let lon = hazard_point.geometry.coordinates[0]
            let lat = hazard_point.geometry.coordinates[1]
            window.viewer.entities.add({
                name: "泥石流隐患点",
                position: Cesium.Cartesian3.fromDegrees(lon, lat),
                billboard: {
                    // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
                    image: debrisFlowIcon,
                    width: 50, // 图片宽度,单位px
                    height: 50, // 图片高度，单位px
                    eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
                    color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
                    scale: 0.8, // 缩放比例
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
                    scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
                    depthTest: false, // 禁止深度测试
                    disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
                    show: true
                },
                properties: {
                    data: hazard_point
                }
            });
        })
    },
    removeHazardSource() {
        let toRemove = window.viewer.entities.values.filter(
            e => e.name === '泥石流隐患点'
        );
        if (toRemove) {
            // 2. 逐个删除
            toRemove.forEach(entity => {
                window.viewer.entities.remove(entity);
            });
        }
    },

    loadLandSlide() {
        for (let i = 0; i < landslide.length; i++) {
            let lon = landslide[i].lon
            let lat = landslide[i].lat
            // console.log("111111")
            // console.log(parseFloat(lon),parseFloat(lat),weinan.longitude,weinan.latitude,EllipseAxis.a,EllipseAxis.b)
            // console.log(isPointInEllipse(parseFloat(lon),parseFloat(lat),weinan.longitude,weinan.latitude,EllipseAxis.a,EllipseAxis.b),"isPointInEllipse(parseFloat(lon),parseFloat(lat),weinan.longitude,weinan.latitude,EllipseAxis.a,EllipseAxis.b)")
            // if(isPointInEllipse(parseFloat(lon),parseFloat(lat),weinan.longitude,weinan.latitude,EllipseAxis.a,EllipseAxis.b,rotation)){
            //     // console.log("2222222222222")
            //     window.viewer.entities.add({
            //         name:"",
            //         // fromDegrees（经度，纬度，高度，椭球，结果）从以度为单位的经度和纬度值返回Cartesian3位置
            //         position: Cesium.Cartesian3.fromDegrees(parseFloat(lon), parseFloat(lat)),
            //         billboard: {
            //             image: landslideIcon,
            //             width: 50, // 图片宽度,单位px
            //             height: 50, // 图片高度，单位px
            //             eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
            //             color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
            //             scale: 0.8, // 缩放比例
            //             heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
            //             scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
            //             depthTest: false, // 禁止深度测试
            //             disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
            //             zIndex:99999999,
            //         },
            //         properties: {
            //             data:landslide[i]
            //         },
            //         // userData: {
            //         //   type: 'LandSlide',
            //         //   info: pointInfo,
            //         //   originalPosition: { lon, lat } // 保存原始经纬度
            //         // }
            //     })
            //     // 创建光晕实体
            //     const haloEntity = window.viewer.entities.add({
            //         position: Cesium.Cartesian3.fromDegrees(parseFloat(lon), parseFloat(lat)),
            //         point: {
            //             pixelSize: 40, // 增大光晕大小，使其更明显
            //             color: Cesium.Color.RED.withAlpha(0.4), // 提高透明度，使其更明显
            //             outlineColor: Cesium.Color.RED.withAlpha(1.0), // 完全不透明的边框
            //             outlineWidth: 1, // 适中的边框宽度
            //             heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            //             disableDepthTestDistance: Number.POSITIVE_INFINITY // 确保不被地形遮挡
            //         }
            //     });
            //     addPulseAnimation(haloEntity,Cesium.Color.RED)
            //     // 添加脉冲动画效果
            //
            //     // 根据点路线绘制多边形影响范围，如果没有点路线则绘制圆形
            //     if (landslide[i].点路线 && landslide[i].点路线.length > 0) {
            //         const routePoints = [];
            //         const polylinePositions = []; // 用于存储折线点的数组
            //         const bufferWidth = 20; // 缓冲区宽度（米），您可以根据需要调整此值
            //
            //         // 收集并验证所有有效的路线点
            //         for (let j = 0; j < landslide[i].点路线.length; j++) {
            //             const currentPointData = landslide[i].点路线[j];
            //             // if (!Array.isArray(currentPointData) || currentPointData.length === 0 || !Array.isArray(currentPointData[0]) || currentPointData[0].length < 2) {
            //             //   console.warn(`无效的点数据结构，索引 ${i}，点路线索引 ${j}:`, currentPointData);
            //             //   continue;
            //             // }
            //
            //             const point = currentPointData[0];
            //             const lon = parseFloat(point[0]);
            //             const lat = parseFloat(point[1]);
            //
            //             if (!isNaN(lon) && !isNaN(lat) && lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90) {
            //
            //                 routePoints.push(Cesium.Cartesian3.fromDegrees(lon, lat)); // 存储为Cesium.Cartesian3对象
            //                 polylinePositions.push(lon, lat); // 添加到折线点数组
            //             } else {
            //                 console.warn(`无效的坐标值，索引 ${i}，点路线索引 ${j}: lon=${point[0]}, lat=${point[1]}`);
            //             }
            //         }
            //
            //         // console.log(polylinePositions)
            //         // 绘制原始点路线
            //         if (polylinePositions.length >= 4) { // 至少需要两个点（4个坐标值）才能绘制线
            //             window.viewer.entities.add({
            //                 polyline: {
            //                     positions: Cesium.Cartesian3.fromDegreesArray(polylinePositions),
            //                     width: 20, // 线条宽度
            //                     material: new Cesium.PolylineArrowMaterialProperty(Cesium.Color.YELLOW), // 使用箭头材质
            //                     clampToGround: true // 贴地显示
            //                 },
            //                 properties: {
            //                     data: landslide[i],
            //                     type: 'landslide_route'
            //                 }
            //             });
            //         }
            //
            //         // 绘制影响范围多边形（缓冲区）
            //         if (routePoints.length >= 1) { // 至少一个点才能考虑扇形或圆形
            //             // 将 generateSmoothBuffer 函数定义移动到此处，作为 loadLandSlide 的内部函数
            //             const generateSmoothBuffer = (routePoints, bufferWidth) => { // 移除 fanAngle 参数
            //                 const interpolatedPoints = [];
            //                 const segmentInterpolationCount = 50; // 每段插值点数
            //
            //                 // 如果只有一个点，直接生成圆形（360度扇形）
            //                 if (routePoints.length === 1) {
            //                     const centerPoint = routePoints[0];
            //                     const radius = bufferWidth;
            //                     const positions = [];
            //                     const numSegments = 60; // 扇形分段数
            //
            //                     for (let k = 0; k <= numSegments; k++) {
            //                         const angle = (k / numSegments) * 360; // 0到360度
            //                         const radian = Cesium.Math.toRadians(angle);
            //
            //                         // 计算扇形边界点，使用更精确的地理坐标计算
            //                         const cartographic = Cesium.Cartographic.fromCartesian(centerPoint);
            //                         const longitude = cartographic.longitude + (radius / Cesium.Ellipsoid.WGS84.maximumRadius) * Math.sin(radian);
            //                         const latitude = cartographic.latitude + (radius / Cesium.Ellipsoid.WGS84.maximumRadius) * Math.cos(radian);
            //                         positions.push(Cesium.Cartesian3.fromRadians(longitude, latitude));
            //                     }
            //                     return new Cesium.PolygonHierarchy(positions);
            //                 }
            //
            //                 // 处理多点路线的平滑缓冲区
            //                 const leftPoints = [];
            //                 const rightPoints = [];
            //
            //                 // 遍历所有线段，生成平滑缓冲区
            //                 for (let j = 0; j < routePoints.length - 1; j++) { // 遍历到倒数第二个点
            //                     const start = routePoints[j];
            //                     const end = routePoints[j + 1];
            //
            //                     interpolatedPoints.push(start);
            //
            //                     for (let k = 1; k < segmentInterpolationCount; k++) {
            //                         const ratio = k / segmentInterpolationCount;
            //                         const interpolated = Cesium.Cartesian3.lerp(
            //                             start,
            //                             end,
            //                             ratio,
            //                             new Cesium.Cartesian3()
            //                         );
            //                         interpolatedPoints.push(interpolated);
            //                     }
            //                 }
            //                 // 添加最后一个原始点
            //                 interpolatedPoints.push(routePoints[routePoints.length - 1]);
            //
            //                 // 计算平滑的缓冲区边界点
            //                 for (let j = 0; j < interpolatedPoints.length; j++) {
            //                     const prev = j > 0 ? interpolatedPoints[j - 1] : interpolatedPoints[j];
            //                     const next = j < interpolatedPoints.length - 1 ? interpolatedPoints[j + 1] : interpolatedPoints[j];
            //
            //                     const forwardVec = Cesium.Cartesian3.subtract(next, prev, new Cesium.Cartesian3());
            //                     Cesium.Cartesian3.normalize(forwardVec, forwardVec);
            //
            //                     const normal = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(interpolatedPoints[j], new Cesium.Cartesian3());
            //                     const perpendicular = Cesium.Cartesian3.normalize(Cesium.Cartesian3.cross(normal, forwardVec, new Cesium.Cartesian3()), new Cesium.Cartesian3());
            //
            //                     const scaledPerpendicular = Cesium.Cartesian3.multiplyByScalar(
            //                         perpendicular,
            //                         bufferWidth,
            //                         new Cesium.Cartesian3()
            //                     );
            //
            //                     const leftPoint = Cesium.Cartesian3.add(
            //                         interpolatedPoints[j],
            //                         scaledPerpendicular,
            //                         new Cesium.Cartesian3()
            //                     );
            //                     const rightPoint = Cesium.Cartesian3.subtract(
            //                         interpolatedPoints[j],
            //                         scaledPerpendicular,
            //                         new Cesium.Cartesian3()
            //                     );
            //
            //                     leftPoints.push(leftPoint);
            //                     rightPoints.push(rightPoint);
            //                 }
            //
            //                 // 组合成闭合多边形：左侧点 + 右侧点（反向）
            //                 const polygonPositions = [...leftPoints, ...rightPoints.reverse()];
            //
            //                 return new Cesium.PolygonHierarchy(polygonPositions);
            //             };
            //
            //             // 调用新的平滑缓冲区生成方法
            //             const polygonHierarchy = generateSmoothBuffer(routePoints, bufferWidth);
            //
            //             // 如果成功创建了多边形顶点，则添加实体
            //             if (polygonHierarchy.positions.length > 0) {
            //                 window.viewer.entities.add({
            //                     polygon: {
            //                         hierarchy: polygonHierarchy,
            //                         // material: Cesium.Color.BLUE.withAlpha(0.3),
            //                         material:new Cesium.ImageMaterialProperty({
            //                             image: landslide_surface01,
            //                             color: Cesium.Color.WHITE,
            //                             repeat: new Cesium.Cartesian2(4, 4),
            //                         }),
            //                         outline: true,
            //                         outlineColor: Cesium.Color.BLUE,
            //                         heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            //                     },
            //                     properties: {
            //                         data: landslide[i],
            //                         type: 'influence_range_polygon'
            //                     }
            //                 });
            //             }
            //
            //             // 如果是多点路线，单独为最后一个点绘制圆形缓冲区
            //             if (routePoints.length > 1) {
            //                 const lastPoint = routePoints[routePoints.length - 1];
            //                 const lastPointBufferRadius = bufferWidth; // 可以根据需要调整这个半径
            //
            //                 window.viewer.entities.add({
            //                     position: lastPoint,
            //                     ellipse: {
            //                         semiMinorAxis: lastPointBufferRadius,
            //                         semiMajorAxis: lastPointBufferRadius,
            //                         material: new Cesium.ImageMaterialProperty({
            //                             image: landslide_surface01,
            //                             color: Cesium.Color.WHITE,
            //                             repeat: new Cesium.Cartesian2(4, 4),
            //                         }),
            //                         outline: true,
            //                         outlineColor: Cesium.Color.BLUE,
            //                         heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            //                     },
            //                     properties: {
            //                         data: landslide[i],
            //                         type: 'last_point_circular_buffer'
            //                     }
            //                 });
            //             }
            //
            //         } else {
            //             console.warn(`点路线点数不足，无法创建影响范围多边形，索引 ${i}`);
            //         }
            //     } else {
            //         // ... existing code ...
            //     }
            // }
            // else{
            window.viewer.entities.add({
                name: "滑坡隐患点",
                // fromDegrees（经度，纬度，高度，椭球，结果）从以度为单位的经度和纬度值返回Cartesian3位置
                position: Cesium.Cartesian3.fromDegrees(parseFloat(lon), parseFloat(lat)),
                billboard: {
                    image: landslideIcon,
                    width: 50, // 图片宽度,单位px
                    height: 50, // 图片高度，单位px
                    eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
                    color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
                    scale: 0.8, // 缩放比例
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
                    scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
                    depthTest: false, // 禁止深度测试
                    disableDepthTestDistance: Number.POSITIVE_INFINITY // 不进行深度测试
                },
                properties: {
                    data: landslide[i]
                }
            })
        }
    },
    removeLandSlide() {
        let toRemove = window.viewer.entities.values.filter(
            e => e.name === '滑坡隐患点'
        );
        if (toRemove) {
            // 2. 逐个删除
            toRemove.forEach(entity => {
                window.viewer.entities.remove(entity);
            });
        }
    },

    AddDangerAreaDataSource() {
        let DangerAreaDataArr = []
        DangerAreaData.features.forEach(DangerAreaData_source => {
            DangerAreaDataArr.push(DangerAreaData_source)
        })
        DangerAreaDataArr.forEach(DangerAreaData_point => {
            let lon = DangerAreaData_point.geometry.coordinates[0]
            let lat = DangerAreaData_point.geometry.coordinates[1]
            window.viewer.entities.add({
                name: "风险区域",
                position: Cesium.Cartesian3.fromDegrees(lon, lat),
                billboard: {
                    image: riskArea,
                    width: 50,
                    height: 50,
                    eyeOffset: new Cesium.Cartesian3(0, 0, 0),
                    color: Cesium.Color.WHITE.withAlpha(1),
                    scale: 0.8,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
                    depthTest: false,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    show: true
                },
                properties: {
                    data: DangerAreaData_point
                }
            });
        })
    },
    removeDangerAreaDataSource() {
        let toRemove = window.viewer.entities.values.filter(
            e => e.name === '风险区域'
        );
        if (toRemove) {
            // 2. 逐个删除
            toRemove.forEach(entity => {
                window.viewer.entities.remove(entity);
            });
        }
    },


}
export default basicLayers;