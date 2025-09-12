import request from "@/utils/request";

/**
 * 查询表名
 */
export async function queryTableNames(remark) {
    return request({
      url: "data_management/queryTableName",
      method: "post",
      data: remark
    });
}

/**
 * 查询表数据
 * @param {*} data 
 * @returns 
 */
export async function queryTableInfo(data) {
    return request({
        url: "data_management/queryTableInfo",
        method: "post",
        data: data
    });
}

/**
 * 删除表数据
 * @param {*} data 
 * @returns 
 */
export async function deleteTableData(data) {
    return request({
        url: "data_management/deleteTableInfo",
        method: "delete",
        data: data
    });
}