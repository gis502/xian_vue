import * as Cesium from 'cesium'

let timeTransfer = {
    // cesium时钟时间格式化函数
    CesiumTimeFormatter(datetime) {
        var julianDT = new Cesium.JulianDate();
        Cesium.JulianDate.addHours(datetime, 8, julianDT);
        var gregorianDT = Cesium.JulianDate.toGregorianDate(julianDT);
        let hour = gregorianDT.hour + "";
        let minute = gregorianDT.minute + "";
        let second = gregorianDT.second + "";
        return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:${second.padStart(2, "0")}`;
    },
// cesium时钟日期格式化函数
    CesiumDateFormatter(datetime) {
        var julianDT = new Cesium.JulianDate();
        Cesium.JulianDate.addHours(datetime, 8, julianDT);
        var gregorianDT = Cesium.JulianDate.toGregorianDate(julianDT);
        let month = gregorianDT.month + "";
        let day = gregorianDT.day + "";
        return `${gregorianDT.year}年${month.padStart(2, "0")}月${day.padStart(2, "0")}日`;
    },
// cesium时间轴格式化函数
    CesiumDateTimeFormatter(datetime) {
        var julianDT = new Cesium.JulianDate();
        Cesium.JulianDate.addHours(datetime, 8, julianDT);
        let gregorianDT = Cesium.JulianDate.toGregorianDate(julianDT);
        let year = gregorianDT.year + "";
        let month = gregorianDT.month + "";
        let day = gregorianDT.day + "";
        let hour = gregorianDT.hour + "";
        let minute = gregorianDT.minute + "";
        let seconds = gregorianDT.second + "";
        return `${year}年${month.padStart(2, "0")}月${day.padStart(2, "0")}日 ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:${seconds.padStart(2, "0")}`;
    },
    timestampToTime(timestamp) {
        let DateObj = new Date(timestamp)
        let year = DateObj.getFullYear()
        let month = DateObj.getMonth() + 1
        let day = DateObj.getDate()
        let hh = DateObj.getHours()
        let mm = DateObj.getMinutes()
        let ss = DateObj.getSeconds()
        month = month > 9 ? month : '0' + month
        day = day > 9 ? day : '0' + day
        hh = hh > 9 ? hh : '0' + hh
        mm = mm > 9 ? mm : '0' + mm
        ss = ss > 9 ? ss : '0' + ss
        // return `${year}年${month}月${day}日${hh}时${mm}分${ss}秒`
        return `${year}-${month}-${day} ${hh}:${mm}:${ss}`
    },
    timestampToTimeWithT(timestamp) {
        let DateObj = new Date(timestamp)
        let year = DateObj.getFullYear()
        let month = DateObj.getMonth() + 1
        let day = DateObj.getDate()
        let hh = DateObj.getHours()
        let mm = DateObj.getMinutes()
        let ss = DateObj.getSeconds()
        month = month > 9 ? month : '0' + month
        day = day > 9 ? day : '0' + day
        hh = hh > 9 ? hh : '0' + hh
        mm = mm > 9 ? mm : '0' + mm
        ss = ss > 9 ? ss : '0' + ss
        // return `${year}年${month}月${day}日${hh}时${mm}分${ss}秒`
        return `${year}-${month}-${day}T${hh}:${mm}:${ss}`
    },
    timestampToTimeChina(timestamp) {
        let DateObj = new Date(timestamp);
        let year = DateObj.getFullYear();
        let month = DateObj.getMonth() + 1;
        let day = DateObj.getDate();
        let hh = DateObj.getHours();
        let mm = DateObj.getMinutes();
        let ss = DateObj.getSeconds();
        month = month > 9 ? month : '0' + month;
        day = day > 9 ? day : '0' + day;
        hh = hh > 9 ? hh : '0' + hh;
        mm = mm > 9 ? mm : '0' + mm;
        ss = ss > 9 ? ss : '0' + ss;
        return `${year}年${month}月${day}日 ${hh}:${mm}:${ss}`;
    }
}
export default timeTransfer;
