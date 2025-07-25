import * as Cesium from "cesium";
import lineData from "@/assets/西安断层数据.json";

let layers = {


    //画烈度圈
    DrawEllipse(longitude, latitude, magnitude, name) {
        this.removeIsoseismalCircle()
        console.log(longitude, latitude, magnitude, name, "longitude,latitude,magnitude,name")
        let min_line = this.pointToLineDistance_getMinLine({longitude, latitude}, lineData)
        // console.log(min_line,"==================")
        let first_point = min_line.coordinates[0]
        let last_point = min_line.coordinates[min_line.coordinates.length - 1]
        //计算角度
        let bearing = this.calculateStrikeDirection(first_point[0], first_point[1], last_point[0], last_point[1])
        console.log(bearing, "==================")
        Cesium.Cartesian3.fromDegrees(longitude, latitude)
        // // 绘制椭圆
        this.DrawCircle({x: longitude, y: latitude}, bearing, magnitude, name);
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
    calculateStrikeDirection(lon1, lat1, lon2, lat2) {
        // 计算角度，将角度转换为弧度
        const radLat1 = Cesium.Math.toRadians(lat1);
        const radLon1 = Cesium.Math.toRadians(lon1);
        const radLat2 = Cesium.Math.toRadians(lat2);
        const radLon2 = Cesium.Math.toRadians(lon2);

        // 计算经纬度差
        const dLon = radLon2 - radLon1;

        // 计算方位角
        const y = Math.sin(dLon) * Math.cos(radLat2);
        const x = Math.cos(radLat1) * Math.sin(radLat2) -
            Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(dLon);

        // 计算角度并转换为0-360度范围
        let bearing = Cesium.Math.toDegrees(Math.atan2(y, x));
        bearing = (bearing + 360) % 360;

        return bearing;
    },
    DrawCircle(point, bearing, magnitude, isoseismalCircleName) {
        // 地震源位置
        let position = point;
        // 根据断裂带计算的角度
        let strikeDirection = bearing;

        // 根据震级计算椭圆参数
        const ellipseParams = this.calculateEllipseParams(magnitude);
        console.log("ellipseParams",ellipseParams)
        // 创建一个更大的半透明遮罩区域
        // const maskParams = {
        //     semiMinorAxis: ellipseParams[0].semiMinorAxis * 1.5,
        //     semiMajorAxis: ellipseParams[0].semiMajorAxis * 1.5,
        //     alpha: 0.1 // 遮罩透明度
        // };

        // 先添加遮罩层，确保它在最底层
        const rotation = Cesium.Math.toRadians(strikeDirection - 90);
        // let mask = new Cesium.Entity({
        //     position: Cesium.Cartesian3.fromDegrees(position.x, position.y),
        //     name: "地震影响区域遮罩",
        //     ellipse: {
        //         semiMinorAxis: maskParams.semiMinorAxis * 50,
        //         semiMajorAxis: maskParams.semiMajorAxis * 70,
        //         material: new Cesium.ImageMaterialProperty({
        //             image: this.createGradientTexture(256, 256),
        //             transparent: true
        //         }),
        //         height: 1, // 稍微高于椭圆，确保显示在上方
        //         rotation: rotation,
        //         zIndex: 998 // 遮罩的z-index低于椭圆
        //     }
        // });
        // window.viewer.entities.add(mask);

        // 循环创建多个同心椭圆，长轴方向与断裂带走向一致
        ellipseParams.forEach(params => {
            let ellipse = new Cesium.Entity({
                position: Cesium.Cartesian3.fromDegrees(position.x, position.y),
                name: "地震影响区域",
                ellipse: {
                    semiMinorAxis: params.semiMinorAxis * 1000,
                    semiMajorAxis: params.semiMajorAxis * 1000,
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
            const offsetMeters = params.semiMajorAxis * 1000 * 0.5; // 1.1 倍半径
            const offsetLon = (offsetMeters / 111320) * Math.sin(angleRad);
            const offsetLat = (offsetMeters / 111320) * Math.cos(angleRad);
            // 3. 文字实体
            viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(
                    position.x + offsetLon,
                    position.y + offsetLat
                ),
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

        // 创建标签实体，确保它显示在最上方
        // let labelEntity = new Cesium.Entity({
        //     position: Cesium.Cartesian3.fromDegrees(position.x, position.y),
        //     name: "地震影响区名称",
        //     label: {
        //         text: isoseismalCircleName,
        //         font: '40px',
        //         fillColor: Cesium.Color.BLACK,
        //         backgroundColor: Cesium.Color.WHITE.withAlpha(0.7),
        //         padding: new Cesium.Cartesian2(5, 5),
        //         showBackground: true,
        //         verticalOrigin: Cesium.VerticalOrigin.CENTER, // 将垂直原点设置为中心
        //         eyeOffset: new Cesium.Cartesian3(100, 500, 0), // 像素偏移量
        //         show: true, // 使用统一的显示控制
        //         zIndex: 100, // 设置为最高z-index，确保显示在最上方
        //         heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        //         depthTest: false, // 禁止深度测试
        //         // scale: 0.8,
        //         scaleByDistance: new Cesium.NearFarScalar(50000, 3, 5e5, 0.4),
        //         // 添加贴地所需的额外属性
        //         disableDepthTestDistance: Number.POSITIVE_INFINITY,
        //         // distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 400000),
        //         pixelOffset:new Cesium.Cartesian2(0,-30)
        //     }
        // });
        // window.viewer.entities.add(labelEntity);
    },
    calculateEllipseParams(magnitude) {
        let sum = Math.floor(Number(magnitude) + 2);
        let intensityLevels = [];
        for (let i = sum; i >= 6; i--) {
            intensityLevels.push({ia:i,ib:i});
        }

        // // 自定义的烈度圈等级与颜色渲染
        let intensityLabel = [
            {
                level: "Ⅵ (六度)",
                color: "#ff6600"
            },
            {
                level: "Ⅶ (七度)",
                color: "#ff3300"
            },
            {
                level: "Ⅷ (八度)",
                color: "#ff0000"
            },
            {
                level: "Ⅸ (九度)",
                color: "#aa0000"
            },
            {
                level: "Ⅹ (十度)",
                color: "#660000"
            },
            {
                level: "Ⅺ (十一度)",
                color: "#330000"
            },
            {
                level: "Ⅻ (十二度)",
                color: "#330000"
            }
        ];

        const calculateRa = (M, Ia) => {
            const a = (Math.pow(10, (4.0293 + 1.3003 * M - Ia) / 3.6404) - 10) ;
            // console.log(a, "=============================")
            return a;
        }

        const calculateRb = (M, Ib) => {
            const b = (Math.pow(10, (2.3816 + 1.3003 * M - Ib) / 2.8573) - 5) ;
            // console.log(b, "=============================")

            return b;
        }

        let plphas = [0.1,0.1, 0.1,0.1, 0.1]
        let i = 0
        // 存储计算出的椭圆参数
        const params = intensityLevels.map(level => {

            // 使用提供的公式计算长短轴
            const semiMajorAxis = calculateRa(magnitude, level.ia);

            const semiMinorAxis = calculateRb(magnitude, level.ib);

            // 根据烈度级别设置透明度
            // const alpha = 0.8 - (level.ia - 5) * 0.3;
            let alpha = plphas[i]
            i++
            // 计算 extrusion height，使较大的椭圆有更高的 extrusion
            // const extrudedHeight = semiMajorAxis * 0.15;

            return {
                semiMinorAxis,
                semiMajorAxis,
                intensity: level.ia,
                leveltext:intensityLabel[ level.ia-6].level,
                color:intensityLabel[ level.ia-6].color,
                // extrudedHeight,
                alpha,
            };
        })
        return params;
    },
    createGradientTexture(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // 创建径向渐变
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, width / 2
        );

        // 设置渐变颜色 - 从中心的红色到边缘的透明
        gradient.addColorStop(0, 'rgba(255, 0, 0, 0.2)');
        gradient.addColorStop(0.7, 'rgba(255, 0, 0, 0.05)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

        // 填充渐变
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        return canvas;
    },
    removeIsoseismalCircle(){
        let toRemove = window.viewer.entities.values.filter(
            e => e.name === '地震影响区域'
        );
        if(toRemove){
            // 2. 逐个删除
            toRemove.forEach(entity => {
                window.viewer.entities.remove(entity);
            });
        }
    }
    //画烈度圈 end
}
export default layers;