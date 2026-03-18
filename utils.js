const fs = require('fs');
const path = require('path');

// 系统设置
const settingPath = path.join(__dirname, 'config', 'setting.js');
const getSetting = () => {
    if (!fs.existsSync(settingPath)) {
        return {};
    }
    return require(settingPath);
}

// 消息数量
const dataPath = path.join(__dirname, 'config', 'data.json');
const getMessageCount = () => {
    if (!fs.existsSync(dataPath)) {
        return 0;
    }
    const data = require(dataPath);
    return data.messageCount;
}
const saveMessageCount = (count) => {
    fs.writeFileSync(dataPath, JSON.stringify({
        messageCount: count,
    }, null, 2));
}

// 系统重启，可能重启失败
const systemRestart = async() => {
    if (process.env.PM2) {
        process.send({type: 'shutdown'});
    } else {
        process.exit(0);
    }
}

// PushMe代理
function PushmeProxy(pushme, server_port, panel_port) {
    let message_count = getMessageCount();
    return {
        start: () => {
            pushme.start();
        },
        stop: async() => {
            await pushme.stop();
        },
        restart: async() => {
            await pushme.stop();
            pushme.start();
        },
        publish: async(...args) => {
            const res = await pushme.publish(...args);
            res == 'success' && message_count++;
            return res;
        },
        get messageCount() {
            return message_count;
        },
        messageCountSave: () => {
            saveMessageCount(message_count);
        },
        get uptime() {
            return pushme.uptime;
        },
        get status() {
            return pushme.status;
        },
        get clientCount() {
            return pushme.clientCount;
        },
        get connectionCount() {
            return pushme.connectionCount;
        },
        get serverPort() {
            return server_port;
        },
        get panelPort() {
            return panel_port;
        },
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