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
    // return request({
    //     url: "data_management/queryTableInfo",
    //     method: "post",
    //     data: data
    // });
    return await {
        tableInfo: [
            {
                id: 1,
                name: '张三',
                age: 18
            },
            {
                id: 2,
                name: '李四',
                age: 20
            }
        ],
        primaryKey: [],
        keyInfo: {
            id: '序号',
            name: '姓名',
            age: ''
        },
        allPage: 100,
        pageNum: data.pageNum,
    };
}

/**
 * 删除表数据
 * @param {*} data 
 * @returns 
 */
export async function deleteTableData(data) {
    console.log(data);
    // return request({
    //     url: "data_management/deleteTableInfo",
    //     method: "post",
    //     data: data
    // });
    return await {
        code: 200,
        message: '删除成功'
    };
}