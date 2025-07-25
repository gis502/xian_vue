export function parsePointString(pointString) {
    // 使用正则表达式匹配格式 "POINT(x y)"
    const regex = /^POINT\(\s*(-?\d+(\.\d+)?\s+-?\d+(\.\d+)?\s*)\)$/;

    // 检查是否匹配
    const match = pointString.match(regex);
    if (!match) {
        throw new Error("无效的几何字符串格式");
    }

    // 提取坐标部分
    const coordinates = match[1].split(" ").map(Number);

    // console.log(coordinates,"coordinates")
    // 返回经纬度
    return {
        longitude: coordinates[0],
        latitude: coordinates[1]
    };
}