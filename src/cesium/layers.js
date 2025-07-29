import * as Cesium from "cesium";
import lineData from "@/assets/西安断层数据.json";

import DebrisFlow from "@/assets/西安泥石流灾害点.json";
import debrisFlowIcon from "@/assets/images/DebrisFlow.png";
import landslide from '@/assets/landslide/landslide.json'
import landslideIcon from "@/assets/images/landslide.png";
import landslide_surface01 from "@/assets/images/landslide_surface01.jpg";
import riskArea from "@/assets/images/riskArea.png";
import DangerAreaData from '@/assets/static/disaster/xian_risk.json'
import {useSimulationPointStore} from "@/store/earthquake/simulation_points.js";
import {parsePointString} from "@/cesium/geomTransfer"
import timeTransfer from "@/cesium/timeTransfer.js";
import BaQiaoArea from "@/assets/static/area/BaQiao.json";
import BeiLin from "@/assets/static/area/BeiLin.json";
import ChangAn from "@/assets/static/area/ChangAn.json";
import GaoLing from "@/assets/static/area/GaoLing.json";
import HuYi from "@/assets/static/area/HuYi.json";
import LanTIan from "@/assets/static/area/LanTIan.json";
import LianHu from "@/assets/static/area/LianHu.json";
import LinTong from "@/assets/static/area/LinTong.json";
import WeiYang from "@/assets/static/area/WeiYang.json";
import XinCheng from "@/assets/static/area/XinCheng.json";
import YanLiang from "@/assets/static/area/YanLiang.json";
import YanTa from "@/assets/static/area/YanTa.json";
import ZhouZhi from "@/assets/static/area/ZhouZhi.json";
import {getGeologicalDisasterHideByLandSlideList} from "@/api/system/disasterHide.js";
import {rainSlideTrigger} from "@/api/system/rainModel.js";
// let flashInterval = null;
// let haloCollection = null;
// key: 'hazard' | 'landslide' | 'dangerArea'
const haloCollections = new Map();
const haloIntervals = new Map();
let layers = {
    //画烈度圈
    DrawEllipse(log, lat, magnitude) {
        let longitude = Number(log)
        let latitude = Number(lat)
        this.removeIsoseismalCircle()
        let rotation = this.calculateRotation(longitude, latitude, magnitude)
        Cesium.Cartesian3.fromDegrees(longitude, latitude)
        this.DrawCircle({x: longitude, y: latitude}, rotation, magnitude);
    },
    calculateRotation(longitude, latitude) {
        let min_line = this.pointToLineDistance_getMinLine({longitude, latitude}, lineData)
        // console.log(min_line,"==================")
        let first_point = min_line.coordinates[0]
        let last_point = min_line.coordinates[min_line.coordinates.length - 1]
        // 计算角度，将角度转换为弧度
        const radLat1 = Cesium.Math.toRadians(first_point[1]);
        const radLon1 = Cesium.Math.toRadians(first_point[0]);
        const radLat2 = Cesium.Math.toRadians(last_point[1]);
        const radLon2 = Cesium.Math.toRadians(last_point[0]);

        // 计算经纬度差
        const dLon = radLon2 - radLon1;

        // 计算方位角
        const y = Math.sin(dLon) * Math.cos(radLat2);
        const x = Math.cos(radLat1) * Math.sin(radLat2) - Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(dLon);

        // 计算角度并转换为0-360度范围
        let bearing = Cesium.Math.toDegrees(Math.atan2(y, x));
        bearing = (bearing + 360) % 360;

        let rotation = Cesium.Math.toRadians(bearing - 90);
        return rotation;
    },
    pointToLineDistance_getMinLine(position, lineData) {
        /**
         * point:线外点 longitude latitude height
         * linePoint1, linePoint2：线的两个端点   longitude latitude height
         * return  距离（m）  point ：笛卡尔
         */
        let point = null;
        let min_line_distance = 1000000000;
        let min_line = null
        let des;

        let line_data = []

        //坐标系转换
        // let ellipsoid = window.viewer.scene.globe.ellipsoid;
        // let cartographic = ellipsoid.cartesianToCartographic(point);
        // let latitude = Cesium.Math.toDegrees(cartographic.latitude);
        // let longitude = Cesium.Math.toDegrees(cartographic.longitude);
        // let height = cartographic.height;
        point = {x: position.longitude, y: position.latitude}

        //计算点到线的距离
        const distancePointToLine = (point, linePoint1, linePoint2) => {
            let p = Cesium.Cartesian3.fromDegrees(point.x, point.y)
            let a = Cesium.Cartesian3.fromDegrees(linePoint1[0], linePoint1[1])
            let b = Cesium.Cartesian3.fromDegrees(linePoint2[0], linePoint2[1])

            //向量ab
            let ab = new Cesium.Cartesian3()
            Cesium.Cartesian3.subtract(b, a, ab)

            //向量ap
            let ap = new Cesium.Cartesian3()
            Cesium.Cartesian3.subtract(p, a, ap)

            //向量ap在ab上的投影
            let abNormalized = new Cesium.Cartesian3()
            Cesium.Cartesian3.normalize(ab, abNormalized)
            let apProjectionMagnitude = Cesium.Cartesian3.dot(ap, abNormalized)
            let apProjection = Cesium.Cartesian3.multiplyByScalar(abNormalized, apProjectionMagnitude, new Cesium.Cartesian3())

            //ap在zb投影的垂足坐标
            let footPoint = new Cesium.Cartesian3()
            Cesium.Cartesian3.add(a, apProjection, footPoint)

            let distanceToA = Cesium.Cartesian3.distance(footPoint, a)
            let distanceToB = Cesium.Cartesian3.distance(footPoint, b)

            let distanceAB = Cesium.Cartesian3.distance(a, b)

            // 浮点数的精度有限，可能会存在微小的误差  因此认为距离差小于0.1 的在ab上
            if (Math.abs(distanceToA + distanceToB - distanceAB) < 0.1) {
                // console.log("footPoint在ab上")
                let distance = Cesium.Cartesian3.distance(footPoint, p)
                return {point: footPoint, distance: distance}
            } else {
                // console.log("footPoint在ab延长线上")
                if (distanceToA < distanceToB) {
                    //a距离footPoint最近 返回端点a
                    let distance = Cesium.Cartesian3.distance(a, p)
                    return {point: a, distance: distance}
                } else {
                    //b距离footPoint最近 返回端点b
                    let distance = Cesium.Cartesian3.distance(b, p)
                    return {point: b, distance: distance}
                }
            }
        }

        // 断裂带数据导入
        lineData.features.forEach(line => {
            line_data.push(line.geometry)
        })

        line_data.forEach(lonlat => {
            let min = 100000000000
            for (let i = 0; i < lonlat.coordinates.length - 1; i++) {
                let linePoint1 = lonlat.coordinates[i]
                let linePoint2 = lonlat.coordinates[i + 1]
                des = distancePointToLine(point, linePoint1, linePoint2).distance
                if (des <= min) {
                    min = des;
                }
            }
            if (min < min_line_distance) {
                min_line_distance = min
                //把距离最近的断裂带数组传递给min_line
                min_line = lonlat
            }
        })
        return min_line
    },
    DrawCircle(point, rotation, magnitude) {

        // 地震源位置
        let position = point;
        // 根据断裂带计算的角度
        // let strikeDirection = bearing;

        // 根据震级计算椭圆参数
        const ellipseParams = this.calculateEllipseParams(magnitude);
        // 先添加遮罩层，确保它在最底层
        // const rotation = Cesium.Math.toRadians(strikeDirection - 90);
        // 循环创建多个同心椭圆，长轴方向与断裂带走向一致
        ellipseParams.forEach(params => {
            let short = Math.min(params.semiMinorAxis, params.semiMajorAxis)
            let long = Math.max(params.semiMajorAxis, params.semiMinorAxis)
            let ellipse = new Cesium.Entity({
                position: Cesium.Cartesian3.fromDegrees(position.x, position.y), name: "地震影响区域", ellipse: {
                    // semiMinorAxis: params.semiMinorAxis,
                    // semiMajorAxis: params.semiMajorAxis,
                    semiMinorAxis: short,
                    semiMajorAxis: long,
                    material: Cesium.Color.fromCssColorString(params.color).withAlpha(0.3),
                    height: 0,
                    outline: true,
                    outlineColor: Cesium.Color.RED,
                    outlineWidth: 3,
                    rotation: rotation, // 设置椭圆旋转角度
                }
            });
            window.viewer.entities.add(ellipse);

            // 2. 计算文字位置：沿长轴方向往外再推 1.2 倍半径
            //    这里选椭圆“正上”方向（rotation=0 时即正北）
            const angleRad = Cesium.Math.toRadians(rotation); // 椭圆长轴方向
            // 长轴端点在地球表面上的位移（近似）
            const offsetMeters = params.semiMajorAxis * 0.5; // 1.1 倍半径
            const offsetLon = (offsetMeters / 111320) * Math.sin(angleRad);
            const offsetLat = (offsetMeters / 111320) * Math.cos(angleRad);
            // 3. 文字实体
            viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(position.x + offsetLon, position.y + offsetLat),
                name: "地震影响区域标签",
                label: {
                    text: params.leveltext,                     // 你动态替换为 params.intensity
                    font: '16px sans-serif',
                    backgroundColor: Cesium.Color.WHITE.withAlpha(0.5),
                    showBackground: true,
                    fillColor: Cesium.Color.BLACK,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,

                }
            });
        });
    },
    calculateEllipseParams(magnitude) {


        // // 自定义的烈度圈等级与颜色渲染
        let intensityLabel = [{
            level: "Ⅵ (六度)", color: "#ff6600"
        }, {
            level: "Ⅶ (七度)", color: "#ff3300"
        }, {
            level: "Ⅷ (八度)", color: "#ff0000"
        }, {
            level: "Ⅸ (九度)", color: "#aa0000"
        }, {
            level: "Ⅹ (十度)", color: "#660000"
        }, {
            level: "Ⅺ (十一度)", color: "#330000"
        }, {
            level: "Ⅻ (十二度)", color: "#330000"
        }];


        // let sum = Math.floor(Number(magnitude) + 2);


        const IaWhenAIsZero = (M) => {
            return 1.3003 * M + 0.3889
        };

        const IbWhenBIsZero = (M) => {
            return 1.3003 * M + 0.3844;
        }
        const calculateRa = (M, Ia) => {
            const a = (Math.pow(10, (4.0293 + 1.3003 * M - Ia) / 3.6404) - 10);
            // console.log(a, "=============================")
            return a;
        }

        const calculateRb = (M, Ib) => {
            const b = (Math.pow(10, (2.3816 + 1.3003 * M - Ib) / 2.8573) - 5);
            // console.log(b, "=============================")

            return b;
        }
        let sum = Math.floor(Math.min(Number(IaWhenAIsZero(magnitude)), Number(IbWhenBIsZero(magnitude))));
        let intensityLevels = [];
        for (let i = sum; i >= 6; i--) {
            intensityLevels.push({ia: i, ib: i});
        }
        let plphas = [0.1, 0.1, 0.1, 0.1, 0.1]
        let i = 0
        // 存储计算出的椭圆参数
        const params = intensityLevels.map(level => {

            // 使用提供的公式计算长短轴
            //单位米
            let semiMinorAxis = calculateRa(magnitude, level.ia) * 1000;

            let semiMajorAxis = calculateRb(magnitude, level.ib) * 1000;

            // 根据烈度级别设置透明度
            // let alpha = 0.8 - (level.ia - 5) * 0.3;
            let alpha = plphas[i]
            i++
            // 计算 extrusion height，使较大的椭圆有更高的 extrusion
            // let extrudedHeight = semiMajorAxis * 0.15;
            return {
                semiMinorAxis,
                semiMajorAxis,
                intensity: level.ia,
                leveltext: intensityLabel[level.ia - 6].level,
                color: intensityLabel[level.ia - 6].color, // extrudedHeight,
                alpha,
            };
        })
        return params;
    },
    createGradientTexture(width, height) {
        let canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        let ctx = canvas.getContext('2d');

        // 创建径向渐变
        let gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2);

        // 设置渐变颜色 - 从中心的红色到边缘的透明
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0.2)');
        gradient.addColorStop(0.7, 'rgba(255, 0, 0, 0.05)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

        // 填充渐变
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        return canvas;
    },
    removeIsoseismalCircle() {
        let toRemove = window.viewer.entities.values.filter(e => e.name === '地震影响区域');
        if (toRemove) {
            // 2. 逐个删除
            toRemove.forEach(entity => {
                window.viewer.entities.remove(entity);
            });
        }
        let toRemoveLabel = window.viewer.entities.values.filter(e => e.name === '地震影响区域标签');
        if (toRemoveLabel) {
            // 2. 逐个删除
            toRemoveLabel.forEach(entity => {
                window.viewer.entities.remove(entity);
            });
        }


    },
    //画烈度圈 end

    //暴雨
    getAdministrationByPoint(longitude, latitude) {
        let point = [longitude, latitude];
        let administrationData = [BaQiaoArea, BeiLin, ChangAn, GaoLing, HuYi, LanTIan, LianHu, LinTong, WeiYang, XinCheng, YanLiang, YanTa, ZhouZhi]

        for (let admin of administrationData) {
            // 每个行政区划的features数组
            for (let feature of admin.features) {
                let geometry = feature.geometry;
                let coordinates = geometry.coordinates;
                let ifInPloygon = this.pointInPolygon(point, coordinates)
                // 判断点是否在当前行政区划范围内
                if (ifInPloygon) {
                    return {
                        name: feature.properties.name,
                        geometry: geometry
                    };
                }
            }
        }
        return null;
    },
    pointInPolygon(point, polygonCoords) {
        let [x, y] = point;
        let inside = false;

        // 处理多边形坐标的多层嵌套（行政区划坐标可能是[[[lon,lat],...]]结构）
        let flattenCoords = (coords) => {
            if (coords.length > 0 && typeof coords[0][0] === 'number') {
                return [coords]; // 单层坐标
            } else if (coords.length > 0 && Array.isArray(coords[0][0])) {
                return flattenCoords(coords[0]); // 多层嵌套取最内层
            }
            return [];
        };

        let polygon = flattenCoords(polygonCoords);

        // 遍历多边形的每条边
        for (let i = 0, j = polygon[0].length - 1; i < polygon[0].length; j = i++) {
            let [xi, yi] = polygon[0][i];
            let [xj, yj] = polygon[0][j];

            // 检查点是否在边的垂直范围内
            let intersect = ((yi > y) !== (yj > y))
                // 计算射线与边的交点x坐标
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

            if (intersect) inside = !inside;
        }

        return inside;
    },
    async findDisasterPointsFlash(adminCoordinates) {

        let landslidePointsInside = this.findHiddenDisasterPointsInAdminCoordinates("滑坡隐患点", adminCoordinates)
        let mudslidePointsInside = this.findHiddenDisasterPointsInAdminCoordinates("泥石流隐患点", adminCoordinates)
        let riskVillageInside = this.findHiddenDisasterPointsInAdminCoordinates("风险区域", adminCoordinates)
        // 检查所有滑坡点

        let allPointsInside = [
            ...landslidePointsInside,
            // ...debrisFlowPointsInside
        ];

        // let { pointSet, matchedHuapoData } = await this.getGeologicalDisasterHide(landslidePointsInside);
        this.getGeologicalDisasterHide(landslidePointsInside);
        // this.replaceLandslidePoints(landslidePointsInside,matchedHuapoData,pointSet)
        // await this.replaceMudslidePoints(mudslidePointsInside)
        // await this.replaceRiskVillage(riskVillageInside)


    },
    //找一个区域里的隐患点
    findHiddenDisasterPointsInAdminCoordinates(type, adminCoordinates) {
        let pointsInside = []
        let points = window.viewer.entities.values.filter(
            e => e.name === type
        );
        console.log(points, adminCoordinates, "points")
        points.forEach(item => {
            let point = [item.properties.longitude, item.properties.latitude]
            if (layers.pointInPolygon(point, adminCoordinates)) {
                pointsInside.push(point);
            }
        });
        return pointsInside;
    },
    async getGeologicalDisasterHide(landslidePointsInside) {
        if (landslidePointsInside.length > 0) {
            // 创建经纬度字符串集合用于快速匹配
            let pointSet = new Set();
            landslidePointsInside.forEach(point => {
                // 使用固定精度的字符串表示经纬度
                let lon = point[0];
                let lat = point[1];
                pointSet.add(`${lon},${lat}`);
            });
            // 筛选匹配的滑坡点数据
            let matchedHuapoData = []

            //获取滑坡和致灾因子 所有
            let res = await getGeologicalDisasterHideByLandSlideList()
            // console.log(res, "hides")
            let hides = res.data
            // console.log(hides, "hides")
            hides.forEach(item => {
                let lon = item.geologicalDisasterHideDTO.lon;
                let lat = item.geologicalDisasterHideDTO.lat;
                let key = `${lon},${lat}`;
                if (pointSet.has(key)) {
                    matchedHuapoData.push(item.factorVoList);
                }
            });
            //降雨量值放到致灾因子里面去
            for (var i = 0; i < matchedHuapoData.length; i++) {
                for (var j = 0; j < matchedHuapoData[i].length; j++) {
                    if (matchedHuapoData[i][j].attributeName === "降雨量") {
                        matchedHuapoData[i][j].factorValue = this.rainfall
                    }
                }
            }
            console.log(matchedHuapoData, "matchedHuapoData")
            rainSlideTrigger(matchedHuapoData).then(res => {
                // let res1 = await rainSlideTrigger(matchedHuapoData)
                // console.log(res1, "formatAnalyzedData")
                let formatAnalyzedData = res.data
                console.log(formatAnalyzedData, "formatAnalyzedData")
                // this.formatAnalyzedData = res.data;
                let landslideEntities = window.viewer.entities.values.filter(
                    e => e.name === "滑坡隐患点"
                );
                // entity.properties.data._value.factorVoList

                console.log(landslideEntities, "landslideEntities")
                // 格式化
                formatAnalyzedData.forEach(item => {
                    let disasterNAME = item.geologicalDisasterHideDTO.disasterName || '未知灾害点';
                    let lon = item.geologicalDisasterHideDTO.lon;
                    let lat = item.geologicalDisasterHideDTO.lat;
                    let key = `${lon},${lat}`;
                    if (pointSet.has(key)) {
                        // 处理factorVoList，将多条因子记录融合为一条
                        item.factorVoList = item.factorVoList.reduce((merged, factorItem) => {
                            const {
                                hideId,
                                attributeId,
                                valueId,
                                attributeName,
                                factorValue,
                                unit,
                                attributeNameAlias
                            } = factorItem;

                            // 初始化合并对象（首次循环时）
                            if (Object.keys(merged).length === 0) {
                                merged.hideId = hideId;
                                merged.attributeIds = [];
                                merged.valueIds = [];
                                // 保留经纬度信息用于匹配
                                merged.lon = lon;
                                merged.lat = lat;
                            }
                            // 收集所有attributeId和valueId
                            merged.attributeIds.push(attributeId);
                            merged.valueIds.push(valueId);
                            // 以属性别名为键，存储因子值和单位
                            merged[attributeNameAlias] = {
                                attributeName: attributeName,
                                factorValue: factorValue,
                                unit: unit
                            };
                            return merged;
                        }, {});
                        // 将返回的隐患点替换加入到当前地图展示的全部隐患点中，只替换匹配部分
                        landslideEntities.forEach(entity => {
                            // 修改为降雨量
                            if (entity.properties.data._value.factorVoList.hideId === item.factorVoList.hideId) {
                                item.factorVoList.rainfall.factorValue = this.rainfall
                                // 删除原有的
                                window.viewer.entities.remove(entity);


                                // 添加最新的
                                // let newentity = window.viewer.entities.add({
                                //     position: Cesium.Cartesian3.fromDegrees(lon, lat, 5),
                                //     // 点
                                //     point: {
                                //         color: Cesium.Color.RED, // 点位颜色
                                //         outlineColor: Cesium.Color.BLACK,
                                //         outlineWidth: 0,
                                //         pixelSize: 0 // 像素点大小
                                //     },
                                //     billboard: {
                                //         // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
                                //         image: landslideIcon,
                                //         width: 100, // 图片宽度,单位px
                                //         height: 100, // 图片高度，单位px
                                //         eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
                                //         color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
                                //         scale: 0.8, // 缩放比例
                                //         heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
                                //         scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
                                //         depthTest: false, // 禁止深度测试
                                //         disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
                                //         show: true
                                //     },
                                //     // 文字
                                //     // label: {
                                //     //     text: `${disasterNAME}`,
                                //     //     font: '15pt Source Han Sans CN',
                                //     //     fillColor: Cesium.Color.WHITE,
                                //     //     backgroundColor: Cesium.Color.AQUA,
                                //     //     showBackground: false,
                                //     //     outline: true,
                                //     //     outlineColor: Cesium.Color.BLACK,
                                //     //     outlineWidth: 10,
                                //     //     scale: 1.0,
                                //     //     style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                                //     //     verticalOrigin: Cesium.VerticalOrigin.CENTER,
                                //     //     horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                                //     //     pixelOffset: new Cesium.Cartesian2(-70, -35),
                                //     //     distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 40000),
                                //     //     show: true
                                //     // },
                                //     // 添加灾害类型信息，用于弹窗显示
                                //     // description: this.createDisasterDescription(item, '滑坡'),
                                //     // // 保存原始样式，用于闪烁恢复
                                //     // originalColor: Cesium.Color.RED,
                                //     // originalPixelSize: 15,
                                //     // // 标记灾害类型
                                //     // disasterType: 'landslide',
                                //     // disasterData: item,
                                // });
                                // useSimulationPointStore().simulationPoints.push(hiddenDangerPoint);
                                // this.landslideEntities.push(newentity);
                                matchedHuapoEntities.push(item)
                            }
                            console.log(matchedHuapoEntities, "matchedHuapoEntities")
                            basicLayers.addHiddenDangerPoints('泥石流隐患点', matchedHuapoEntities, debrisFlowIcon);
                        })
                    }
                });
                // console.log("添加的点...", this.landslideEntities)
                // if (allPointsInside.length > 0) {
                //     console.log(matchedHuapoEntities, "这是匹配的实体")
                //     this.flashDisasterPoints(allPointsInside,matchedHuapoEntities);
                this.flashDisasterPoints(matchedHuapoEntities);
                // }
                // this.stopLoading()
                // })
            })
            // return {
            //     pointSet: Array.from(pointSet), // 将 Set 转换为数组以便返回
            //     matchedHuapoData: matchedHuapoData
            // };
        }
        // return { pointSet: [], matchedHuapoData: [] };
    },
    //隐患点替换降雨致灾因子
    //     async replaceLandslidePoints(landslidePointsInside,matchedHuapoData,pointSet) {
    //         let matchedHuapoEntities = []
    //         if (landslidePointsInside.length > 0) {
    //         // rainSlideTrigger(matchedHuapoData).then(res => {
    //         //     console.log(res, "rainSlideTrigger")
    //         // })
    //         // 触发暴雨分析
    //             rainSlideTrigger(matchedHuapoData).then(res => {
    //         // let res1 = await rainSlideTrigger(matchedHuapoData)
    //         // console.log(res1, "formatAnalyzedData")
    //         let formatAnalyzedData = res.data
    //         console.log(formatAnalyzedData, "formatAnalyzedData")
    //         // this.formatAnalyzedData = res.data;
    //         let landslideEntities = window.viewer.entities.values.filter(
    //             e => e.name === "滑坡隐患点"
    //         );
    //         // entity.properties.data._value.factorVoList
    //
    //         console.log(landslideEntities, "landslideEntities")
    //         // 格式化
    //         formatAnalyzedData.forEach(item => {
    //             let disasterNAME = item.geologicalDisasterHideDTO.disasterName || '未知灾害点';
    //             let lon = item.geologicalDisasterHideDTO.lon;
    //             let lat = item.geologicalDisasterHideDTO.lat;
    //             let key = `${lon},${lat}`;
    //             if (pointSet.has(key)) {
    //                 // 处理factorVoList，将多条因子记录融合为一条
    //                 item.factorVoList = item.factorVoList.reduce((merged, factorItem) => {
    //                     const {
    //                         hideId,
    //                         attributeId,
    //                         valueId,
    //                         attributeName,
    //                         factorValue,
    //                         unit,
    //                         attributeNameAlias
    //                     } = factorItem;
    //
    //                     // 初始化合并对象（首次循环时）
    //                     if (Object.keys(merged).length === 0) {
    //                         merged.hideId = hideId;
    //                         merged.attributeIds = [];
    //                         merged.valueIds = [];
    //                         // 保留经纬度信息用于匹配
    //                         merged.lon = lon;
    //                         merged.lat = lat;
    //                     }
    //                     // 收集所有attributeId和valueId
    //                     merged.attributeIds.push(attributeId);
    //                     merged.valueIds.push(valueId);
    //                     // 以属性别名为键，存储因子值和单位
    //                     merged[attributeNameAlias] = {
    //                         attributeName: attributeName,
    //                         factorValue: factorValue,
    //                         unit: unit
    //                     };
    //                     return merged;
    //                 }, {});
    //                 // 将返回的隐患点替换加入到当前地图展示的全部隐患点中，只替换匹配部分
    //                 landslideEntities.forEach(entity => {
    //                     // 修改为降雨量
    //                     if (entity.properties.data._value.factorVoList.hideId === item.factorVoList.hideId) {
    //                         item.factorVoList.rainfall.factorValue = this.rainfall
    //                         // 删除原有的
    //                         window.viewer.entities.remove(entity);
    //
    //
    //                         // 添加最新的
    //                         // let newentity = window.viewer.entities.add({
    //                         //     position: Cesium.Cartesian3.fromDegrees(lon, lat, 5),
    //                         //     // 点
    //                         //     point: {
    //                         //         color: Cesium.Color.RED, // 点位颜色
    //                         //         outlineColor: Cesium.Color.BLACK,
    //                         //         outlineWidth: 0,
    //                         //         pixelSize: 0 // 像素点大小
    //                         //     },
    //                         //     billboard: {
    //                         //         // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
    //                         //         image: landslideIcon,
    //                         //         width: 100, // 图片宽度,单位px
    //                         //         height: 100, // 图片高度，单位px
    //                         //         eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
    //                         //         color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
    //                         //         scale: 0.8, // 缩放比例
    //                         //         heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
    //                         //         scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
    //                         //         depthTest: false, // 禁止深度测试
    //                         //         disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
    //                         //         show: true
    //                         //     },
    //                         //     // 文字
    //                         //     // label: {
    //                         //     //     text: `${disasterNAME}`,
    //                         //     //     font: '15pt Source Han Sans CN',
    //                         //     //     fillColor: Cesium.Color.WHITE,
    //                         //     //     backgroundColor: Cesium.Color.AQUA,
    //                         //     //     showBackground: false,
    //                         //     //     outline: true,
    //                         //     //     outlineColor: Cesium.Color.BLACK,
    //                         //     //     outlineWidth: 10,
    //                         //     //     scale: 1.0,
    //                         //     //     style: Cesium.LabelStyle.FILL_AND_OUTLINE,
    //                         //     //     verticalOrigin: Cesium.VerticalOrigin.CENTER,
    //                         //     //     horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
    //                         //     //     pixelOffset: new Cesium.Cartesian2(-70, -35),
    //                         //     //     distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 40000),
    //                         //     //     show: true
    //                         //     // },
    //                         //     // 添加灾害类型信息，用于弹窗显示
    //                         //     // description: this.createDisasterDescription(item, '滑坡'),
    //                         //     // // 保存原始样式，用于闪烁恢复
    //                         //     // originalColor: Cesium.Color.RED,
    //                         //     // originalPixelSize: 15,
    //                         //     // // 标记灾害类型
    //                         //     // disasterType: 'landslide',
    //                         //     // disasterData: item,
    //                         // });
    //                         // useSimulationPointStore().simulationPoints.push(hiddenDangerPoint);
    //                         // this.landslideEntities.push(newentity);
    //                         matchedHuapoEntities.push(item)
    //                     }
    //                     console.log(matchedHuapoEntities, "matchedHuapoEntities")
    //                     basicLayers.addHiddenDangerPoints('泥石流隐患点', matchedHuapoEntities, debrisFlowIcon);
    //                 })
    //             }
    //         });
    //         // console.log("添加的点...", this.landslideEntities)
    //         // if (allPointsInside.length > 0) {
    //         //     console.log(matchedHuapoEntities, "这是匹配的实体")
    //         //     this.flashDisasterPoints(allPointsInside,matchedHuapoEntities);
    //         this.flashDisasterPoints(matchedHuapoEntities);
    //         // }
    //         // this.stopLoading()
    //         // })
    //         })
    //     }
    // },
    // this.replaceMudslidePoints(mudslidePointsInside)
    // this.replaceRiskVillage(riskVillageInside)
    flashDisasterPoints(entities) {
        console.log("传输过来的匹配实体是：", entities);

        // 若界面已关闭，直接返回
        if (this.isClosed) return;

        // 停止之前的闪烁动画
        if (this.flashInterval) {
            if (typeof this.flashInterval === 'number') {
                clearInterval(this.flashInterval);
            } else {
                cancelAnimationFrame(this.flashInterval);
            }
            this.flashInterval = null;
        }

        // 清除已有的光晕集合
        if (this.haloCollection) {
            this.haloCollection.removeAll();
            this.viewer.scene.primitives.remove(this.haloCollection);
        }

        // 如果没有需要处理的实体，直接返回
        if (!entities || entities.length === 0) return;

        // 创建光晕点集合
        this.haloCollection = new Cesium.PointPrimitiveCollection();
        this.viewer.scene.primitives.add(this.haloCollection);

        // 存储需要闪烁的实体及其对应的光晕配置
        const flashConfigs = [];

        // 处理每个实体
        entities.forEach(entity => {
            try {
                // 从实体数据中获取经纬度
                const lon = entity.geologicalDisasterHideDTO.lon;
                const lat = entity.geologicalDisasterHideDTO.lat;
                const level = entity.predict?.level || '低'; // 默认低风险

                // 将经纬度转换为Cesium可用的坐标
                const position = Cesium.Cartesian3.fromDegrees(lon, lat);

                // 根据风险等级确定颜色和是否闪烁
                let color, shouldFlash;
                switch (level) {
                    case '高':
                        color = Cesium.Color.RED;
                        shouldFlash = true;
                        break;
                    case '中':
                        color = Cesium.Color.YELLOW;
                        shouldFlash = true;
                        break;
                    case '低':
                    default:
                        color = Cesium.Color.GREEN.withAlpha(0.5); // 低风险不闪烁，用半透明绿色标识
                        shouldFlash = false;
                        break;
                }

                // 创建光晕点
                const halo = this.haloCollection.add({
                    position: position,
                    pixelSize: 15,
                    color: color,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 1,
                    show: true,
                    // 自定义材质用于光晕效果
                    material: new Cesium.Material({
                        fabric: {
                            type: 'Halo',
                            uniforms: {
                                color: color,
                                glowPower: 0.5,
                                innerRadius: 0.5,
                                outerRadius: 1.0
                            },
                            source: `
              uniform vec4 color;
              uniform float glowPower;
              uniform float innerRadius;
              uniform float outerRadius;

              czm_material czm_getMaterial(czm_materialInput materialInput) {
                czm_material material = czm_getDefaultMaterial(materialInput);
                vec2 st = materialInput.st;
                float dist = distance(st, vec2(0.5, 0.5));
                float alpha = smoothstep(outerRadius, innerRadius, dist);
                alpha = pow(alpha, glowPower);
                material.diffuse = color.rgb;
                material.alpha = alpha * color.a;
                return material;
              }
            `
                        }
                    })
                });

                // 只对需要闪烁的实体进行动画配置
                if (shouldFlash) {
                    flashConfigs.push({
                        halo: halo,
                        baseColor: color,
                        baseSize: 15
                    });
                }
            } catch (error) {
                console.error("处理实体时出错:", error, "实体数据:", entity);
            }
        });

        // 如果没有需要闪烁的实体，直接返回
        if (flashConfigs.length === 0) return;

        // 动画控制变量
        let animationTime = 0;
        const animationDuration = 2000; // 动画周期，毫秒

        // 启动动画循环
        this.flashInterval = setInterval(() => {
            animationTime = (animationTime + 50) % animationDuration;
            const normalizedTime = animationTime / animationDuration;

            // 更新所有需要闪烁的光晕点
            flashConfigs.forEach(config => {
                const {halo, baseColor, baseSize} = config;

                // 计算光晕大小（从原始大小到3倍）
                const sizeFactor = 1.0 + Math.sin(normalizedTime * Math.PI * 2) * 2;
                halo.pixelSize = baseSize * sizeFactor;

                // 计算光晕透明度（大小最大时透明度最低）
                const alphaFactor = 1.0 - (sizeFactor - 1.0) / 2.0;
                halo.color = new Cesium.Color(
                    baseColor.red,
                    baseColor.green,
                    baseColor.blue,
                    alphaFactor * 0.8
                );
            });
        }, 50);
    },
//预警点高亮
    getAllHiddeninEllipse(longitude, latitude, magnitude) {
        let allHiddeninEllipse = []
        let rotation = layers.calculateRotation(longitude, latitude, magnitude)
        const params = layers.calculateEllipseParams(magnitude).at(-1);
        useSimulationPointStore().simulationPoints.forEach((item) => {
            // console.log(item, "item useSimulationPointStore")
            if (this.isPointInEllipse(item.geologicalDisasterHideDTO.lon, item.geologicalDisasterHideDTO.lat, longitude, latitude, params.semiMajorAxis, params.semiMinorAxis, rotation)) {
                allHiddeninEllipse.push(item)
            }
        })
        return allHiddeninEllipse
    },
    isPointInEllipse(pointLon, pointLat, centerLon, centerLat, majorAxis, minorAxis, rotation) {
        const center = Cesium.Cartesian3.fromDegrees(Number(centerLon), Number(centerLat));
        const point = Cesium.Cartesian3.fromDegrees(Number(pointLon), Number(pointLat));
        let short = Math.min(majorAxis, minorAxis)
        let long = Math.max(majorAxis, minorAxis)

        // 构建椭圆边界（用于判断）
        const ellipse = new Cesium.EllipseGeometry({
            center: center, semiMajorAxis: long, semiMinorAxis: short, rotation: rotation, // 旋转角度（弧度）
            ellipsoid: Cesium.Ellipsoid.WGS84
        });

        const geometry = Cesium.EllipseGeometry.createGeometry(ellipse);
        const boundingSphere = Cesium.BoundingSphere.fromVertices(geometry.attributes.position.values);

        const distance = Cesium.Cartesian3.distance(point, boundingSphere.center);
        return distance <= boundingSphere.radius;
    }
    , //预警点高亮结束

//真实灾害点
    judgeandaddRealDisasterNewPoint(realDisasterPoints) {
        realDisasterPoints.forEach(item => {
            this.ifaddNewPoint(item)
            this.addBlackBreathCircle(item)
            // this.addRealDisasterLabel(item)
            //找是否有同一类型，同一经纬度
        })
    }
    ,
    ifaddNewPoint(item) {
        let lon = parsePointString(item.geom).longitude
        let lat = parsePointString(item.geom).latitude
        const start = Cesium.JulianDate.fromDate(new Date(item.occurrenceTime));
        const stop = Cesium.JulianDate.addDays(start, 10, new Cesium.JulianDate());
        let matchentity
        if (item.disasterType === "滑坡") {
            matchentity = window.viewer.entities.values.filter(e => e.name === "滑坡隐患点" && Math.abs(e.properties.longitude - lon) < 0.00001 && Math.abs(e.properties.latitude - lat) < 0.00001);
            if (matchentity.length == 0) {
                item.entityId = '灾害点' + item.id;

                console.log(new Date(item.occurrenceTime), item.occurrenceTime, "new Date(item.occurrenceTime),item.occurrenceTime")
                window.viewer.entities.add({
                    name: '新出现灾害点',
                    id: item.entityId,
                    availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
                        start: start, stop: stop,
                    }),]),
                    position: Cesium.Cartesian3.fromDegrees(lon, lat),
                    billboard: {
                        // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
                        image: landslideIcon, width: 50, // 图片宽度,单位px
                        height: 50, // 图片高度，单位px
                        eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
                        color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
                        scale: 0.8, // 缩放比例
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
                        scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1), depthTest: false, // 禁止深度测试
                        disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
                        show: true,
                    },
                    // label: {
                    //     text: "这里11",
                    //     font: '18px sans-serif',
                    //     fillColor: Cesium.Color.BLACK,
                    //     backgroundColor: Cesium.Color.WHITE.withAlpha(0.7),
                    //     style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    //     outlineWidth: 2,
                    //     verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    //     pixelOffset: new Cesium.Cartesian2(0, -16),
                    // },
                    properties: {
                        data: item, longitude: lon, latitude: lat,
                    },
                });

            }
        } else if (item.disasterType === "泥石流") {
            matchentity = window.viewer.entities.values.filter(e => e.name === "泥石流隐患点" && Math.abs(e.properties.longitude - lon) < 0.00001 && Math.abs(e.properties.latitude - lat) < 0.00001);
            if (matchentity.length == 0) {
                item.entityId = '灾害点' + item.id;
                window.viewer.entities.add({
                    name: '新出现灾害点',
                    id: item.entityId,
                    availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
                        start: start, stop: stop,
                    }),]),
                    position: Cesium.Cartesian3.fromDegrees(lon, lat),
                    billboard: {
                        // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
                        image: debrisFlowIcon, width: 50, // 图片宽度,单位px
                        height: 50, // 图片高度，单位px
                        eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
                        color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
                        scale: 0.8, // 缩放比例
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
                        scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1), depthTest: false, // 禁止深度测试
                        disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
                        show: true,
                    },
                    //     label: {
                    //   text: "这里，新的",
                    //   font: '18px sans-serif',
                    //   fillColor: Cesium.Color.BLACK,
                    //   backgroundColor: Cesium.Color.WHITE.withAlpha(0.7),
                    //   style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    //   outlineWidth: 2,
                    //   verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    //   pixelOffset: new Cesium.Cartesian2(0, -16),
                    // },
                    properties: {
                        data: item, longitude: lon, latitude: lat,
                    },
                });

            }
        } else {
            matchentity = window.viewer.entities.values.filter(e => e.name === "风险区域" && Math.abs(e.properties.longitude - lon) < 0.00001 && Math.abs(e.properties.latitude - lat) < 0.00001);
            if (matchentity.length == 0) {
                item.entityId = '灾害点' + item.id;
                window.viewer.entities.add({
                    name: '新出现灾害点',
                    id: item.entityId,
                    availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
                        start: start, stop: stop,
                    }),]),
                    position: Cesium.Cartesian3.fromDegrees(lon, lat),
                    billboard: {
                        // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
                        image: riskArea, width: 50, // 图片宽度,单位px
                        height: 50, // 图片高度，单位px
                        eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
                        color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
                        scale: 0.8, // 缩放比例
                        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
                        scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1), depthTest: false, // 禁止深度测试
                        disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
                        show: true,
                    },
                    properties: {
                        data: item, longitude: lon, latitude: lat,
                    },
                });
            }
        }
    }
    ,
    addBlackBreathCircle(item) {
        let lon = parsePointString(item.geom).longitude
        let lat = parsePointString(item.geom).latitude
        item.entityId = '灾害点呼吸圈_' + item.id;
        let labeltext = timeTransfer.timestampToTimeChina(item.occurrenceTime) + " " + item.disasterName
        const start = Cesium.JulianDate.fromDate(new Date(item.occurrenceTime));
        const stop = Cesium.JulianDate.addDays(start, 10, new Cesium.JulianDate());

        viewer.entities.add({
            name: '灾害点呼吸圈',
            id: item.entityId,
            availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
                start: start, stop: stop
            }),]),
            position: Cesium.Cartesian3.fromDegrees(lon, lat),
            label: {
                text: labeltext,
                font: '16px sans-serif',
                fillColor: Cesium.Color.BLACK,
                backgroundColor: Cesium.Color.WHITE.withAlpha(0.7),
                showBackground: true,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                outlineWidth: 2,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -16),
            },
            point: {
                pixelSize: 30,
                color: Cesium.Color.BLACK.withAlpha(0.5),
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 2,
            },
        });
    }
    ,

}
export default layers;