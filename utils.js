const fs = require('fs');
const path = require('path');

/**
 * @typedef {Object} SettingConfig
 * @property {string[]} [push_keys] - 推送key列表
 * @property {string} [user] - 用户名（md5加密后）
 * @property {string} [password] - 密码（md5加密后）
 * @property {'none'|'public'|'self'} [tls] - TLS模式：none-无, public-公共证书, self-自签名
 * @property {'none'|'tls'} [panel_tls] - 面板TLS模式：none-无, tls-启用
 * @property {'start'|'stop'} [status] - 服务状态
 */

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

// 系统设置
const settingPath = path.join(__dirname, 'config', 'setting.js');

/**
 * 获取系统设置
 * @returns {SettingConfig} 系统配置对象
 */
const getSetting = () => {
    if (!fs.existsSync(settingPath)) {
        return {};
    }
    return require(settingPath);
}

// 消息数量
const dataPath = path.join(__dirname, 'config', 'data.json');

/**
 * 获取消息计数
 * @returns {number} 消息数量
 */
const getMessageCount = () => {
    if (!fs.existsSync(dataPath)) {
        return 0;
    }
    const data = require(dataPath);
    return data.messageCount;
}

/**
 * 保存消息计数
 * @param {number} count - 消息数量
 */
const saveMessageCount = (count) => {
    fs.writeFileSync(dataPath, JSON.stringify({
        messageCount: count,
    }, null, 2));
}

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
    let message_count = getMessageCount();
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
            saveMessageCount(message_count);
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
    getSetting,
    getMessageCount,
    saveMessageCount,
    systemRestart,
    PushmeProxy,
}
