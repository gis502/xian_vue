
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


/**
 * 任意 WKT → 二维坐标数组（全部打平）
 * 支持：POINT / LINESTRING / POLYGON / MULTIPOINT / MULTILINESTRING / MULTIPOLYGON
 * @param wkt 例如 MULTIPOINT((x y),(x y))
 * @returns [[lng, lat], ...]
 */
export function geomToCoordinates(wkt) {
    if (!wkt) return [];

    wkt = wkt.trim();

    // 1. POINT
    if (/^POINT\s*\(/i.test(wkt)) {
        const m = wkt.match(/POINT\s*\(\s*([^\s()]+)\s+([^\s()]+)\s*\)/i);
        return m ? [[Number(m[1]), Number(m[2])]] : [];
    }

    // 2. 其它：统一提取所有括号里的坐标块
    const coordBlocks = [];
    const regex = /\(\s*([^()]+)\s*\)/g;
    let match;
    while ((match = regex.exec(wkt)) !== null) {
        coordBlocks.push(match[1]);
    }
    if (!coordBlocks.length) return [];

    // 3. 把所有块拆成点
    const result = [];
    coordBlocks.forEach(block => {
        block.split(',').forEach(pt => {
            const [lng, lat] = pt.trim().split(/\s+/);
            if (lng && lat) result.push([Number(lng), Number(lat)]);
        });
    });
    return result;
}