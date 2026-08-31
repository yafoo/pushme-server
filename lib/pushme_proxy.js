const {getConfig} = require('./config.js');

/**
 * @typedef {Object} PushmeProxyInstance
 * @property {function(import('./pushme_panel.js')): void} setPanel - 设置面板引用
 * @property {function} start - 启动服务
 * @property {function} stop - 停止服务
 * @property {function} restart - 重启服务
 * @property {function} publish - 发布消息
 * @property {number} messageCount - 消息计数
 * @property {function} messageCountSave - 保存消息计数
 * @property {number} uptime - 运行时长（秒）
 * @property {number} panelUptime - 面板运行时长（秒）
 * @property {string} status - 服务状态
 * @property {number} clientCount - 客户端数量
 * @property {number} connectionCount - 连接数量
 * @property {number} serverPort - 服务端口
 * @property {number} panelPort - 面板端口
 */

/**
 * 创建PushMe代理对象
 * @param {import('./pushme_server.js')} pushme - PushMe实例
 * @returns {PushmeProxyInstance} PushMe代理对象
 */
function PushmeProxy(pushme) {
    const config = getConfig();
    let message_count = config.messageCount;
    /** @type {import('./pushme_panel.js')|null} */
    let panel = null;

    return {
        /**
         * 设置面板引用（由server.js调用）
         * @param {import('./pushme_panel.js')} panelRef - 面板实例
         */
        setPanel: (panelRef) => {
            panel = panelRef;
        },
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
            return await pushme.restart();
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
        /** 服务运行时长（秒） */
        get uptime() {
            return pushme.uptime;
        },
        /** 面板运行时长（秒） */
        get panelUptime() {
            return panel ? panel.uptime : 0;
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
            return config.serverPort;
        },
        /** 面板端口 */
        get panelPort() {
            return config.panelPort;
        }
    }
}

module.exports = PushmeProxy;
