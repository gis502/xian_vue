
import Cookies from 'js-cookie'
import request from "@/utils/request.js";

export function saveCanvas(formData) {
    const token = Cookies.get('Admin-Token')
    return fetch('/dev-api/downloadReport/saveCanvas', {
        method: 'POST',
        body: formData,
        headers: {
            Authorization: 'Bearer ' + token
        }
    })
}

export function generateRainReport(data){
    return request({
        url: '/downloadReport/generateRainReport',
        method: 'post',
        data
    })
}
