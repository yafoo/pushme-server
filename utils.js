const {getConfig} = require('./lib/config.js');

/**
 * @typedef {Object} PushmeProxyInstance
 * @property {function} start - 启动服务
 * @property {function} stop - 停止服务
 * @property {function} restart - 重启服务
 * @property {function} publish - 发布消息
 * @property {number} messageCount - 消息计数
 * @property {function} messageCountSave - 保存消息计数
 * @property {number} uptime - 运行时长（秒）
 * @property {string} status - 服务状态
 * @property {number} clientCount - 客户端数量
 * @property {number} connectionCount - 连接数量
 * @property {number} serverPort - 服务端口
 * @property {number} panelPort - 面板端口
 * @property {function} systemRestart - 系统重启
 */

/**
 * 系统重启（可能重启失败）
 * @returns {Promise<void>}
 */
const systemRestart = async() => {
    if (process.env.PM2) {
        // @ts-ignore
        process.send({type: 'shutdown'});
    } else {
        process.exit(0);
    }
}

/**
 * 创建PushMe代理对象
 * @param {import('./pushme.js')} pushme - PushMe实例
 * @param {number} server_port - 服务端口
 * @param {number} panel_port - 面板端口
 * @returns {PushmeProxyInstance} PushMe代理对象
 */
function PushmeProxy(pushme, server_port, panel_port) {
    const config = getConfig();
    let message_count = config.messageCount;
    return {
        /** 启动服务 */
        start: () => {
            pushme.start();
        },
        /** 停止服务 */
        stop: async() => {
            await pushme.stop();
        },
        /** 重启服务 */
        restart: async() => {
            await pushme.stop();
            pushme.start();
        },
        /**
         * 发布消息
         * @param {string} topic - 主题
         * @param {string|Object} msg - 消息内容
         * @param {number} [qos] - QoS级别
         * @returns {Promise<string>} 发布结果
         */
        publish: async(topic, msg, qos) => {
            const res = await pushme.publish(topic, msg, qos);
            res == 'success' && message_count++;
            return res;
        },
        /** 消息计数 */
        get messageCount() {
            return message_count;
        },
        /** 保存消息计数到文件 */
        messageCountSave: () => {
            config.messageCount = message_count;
        },
        /** 运行时长（秒） */
        get uptime() {
            return pushme.uptime;
        },
        /** 服务状态 */
        get status() {
            return pushme.status;
        },
        /** 客户端数量 */
        get clientCount() {
            return pushme.clientCount;
        },
        /** 连接数量 */
        get connectionCount() {
            return pushme.connectionCount;
        },
        /** 服务端口 */
        get serverPort() {
            return server_port;
        },
        /** 面板端口 */
        get panelPort() {
            return panel_port;
        },
        /** 系统重启 */
        systemRestart
    }
}

module.exports = {
    systemRestart,
    PushmeProxy,
}
