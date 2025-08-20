
export function parsePointString(pointString) {
    if (typeof pointString !== 'string') {
        console.warn('parsePointString 收到非字符串:', pointString);
        return null;          // 或者抛出业务错误
    }

    try {
        const [lon, lat] = pointString
            .replace(/^\w+\(|\)$/g, '')   // 去掉 "POINT(" 和最后的 ")"
            .split(' ');

        return {
            longitude: Number(lon),
            latitude:  Number(lat)
        };
    } catch (e) {
        console.error('坐标字符串解析失败:', pointString, e);
        return null;
    }
}