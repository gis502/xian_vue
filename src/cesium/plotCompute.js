import * as Cesium from 'cesium'


let plotCompute = {
    //---面的相关计算---
    // 获取大多边形的中心点
    getPolygonCenter(positions) {
        let x = 0, y = 0, z = 0;
        positions.forEach(pos => {
            x += pos.x;
            y += pos.y;
            z += pos.z;
        });
        const center = new Cesium.Cartesian3(x / positions.length, y / positions.length, z / positions.length);
        return center;
    },
    // 生成小矩形并确保其在大多边形内
    createContainedRectangle(center, width, height, angle, polygonPositions) {
        let scaleFactor = 1.0;
        let maxAttempts = 100;
        let adjustmentAngle = 0;
        let isContained = false;

        // 将大多边形点转换为经纬度坐标
        const polyPoints = polygonPositions.map(pos => {
            const cartographic = Cesium.Cartographic.fromCartesian(pos);
            return [cartographic.longitude, cartographic.latitude];
        });

        let smallRectanglePositions = this.createRotatedRectangle(center, width * scaleFactor, height * scaleFactor, angle);

        // 使用新的 isPointInPolygon 方法检查矩形是否在大多边形内
        while (maxAttempts > 0 && !isContained) {
            const rectangleCartographics = smallRectanglePositions.map(pos => {
                const cartographic = Cesium.Cartographic.fromCartesian(pos);
                return {lon: cartographic.longitude, lat: cartographic.latitude};
            });

            isContained = rectangleCartographics.every(pt => this.isPointInPolygon(polyPoints, pt));
            if (!isContained) {
                scaleFactor *= 0.9;
                adjustmentAngle += 2;
                smallRectanglePositions = this.createRotatedRectangle(center, width * scaleFactor, height * scaleFactor, angle + adjustmentAngle);
            }
            maxAttempts--;
        }
        return smallRectanglePositions;
    },
    // 动态生成比大多边形稍小的旋转矩形
    createRotatedRectangle(center, width, height, angle) {
        // 根据 scaleFactor 缩小宽高
        const halfWidth = (width / 2);
        const halfHeight = (height / 2);
        const angleRad = Cesium.Math.toRadians(angle);

        // 计算旋转矩阵
        const cosAngle = Math.cos(angleRad);
        const sinAngle = Math.sin(angleRad);

        function rotateOffset(offsetX, offsetY) {
            const rotatedX = offsetX * cosAngle - offsetY * sinAngle;
            const rotatedY = offsetX * sinAngle + offsetY * cosAngle;

            return Cesium.Cartesian3.fromRadians(
                centerCartographic.longitude + rotatedX / (Cesium.Ellipsoid.WGS84.maximumRadius * Math.PI),
                centerCartographic.latitude + rotatedY / (Cesium.Ellipsoid.WGS84.maximumRadius * Math.PI)
            );
        }

        const centerCartographic = Cesium.Cartographic.fromCartesian(center);

        // 生成缩小的小矩形的四个角点
        const nw = rotateOffset(-halfWidth, halfHeight);
        const ne = rotateOffset(halfWidth, halfHeight);
        const se = rotateOffset(halfWidth, -halfHeight);
        const sw = rotateOffset(-halfWidth, -halfHeight);

        return [nw, ne, se, sw];
    },
    /*判断点是否在多边形内部*/
    isPointInPolygon(polyPoints, pt) {
        let c = false;
        for (let i = 0, l = polyPoints.length, j = l - 1; i < l; j = i, i++) {
            let spi = polyPoints[i];
            let spj = polyPoints[j];
            if (
                ((spi[1] > pt.lat) !== (spj[1] > pt.lat)) &&
                (pt.lon < (spj[0] - spi[0]) * (pt.lat - spi[1]) / (spj[1] - spi[1]) + spi[0])
            ) {
                c = !c;
            }
        }
        return c;
    },

    //---箭头相关计算---
    cartesianToLatlng (cartesian) {
        // var latlng = this.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
        var latlng = window.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
        var lat = Cesium.Math.toDegrees(latlng.latitude);
        var lng = Cesium.Math.toDegrees(latlng.longitude);
        return [lng, lat];
    }

}
export default plotCompute;