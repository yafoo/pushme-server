const {App, Logger} = require('jj.js');
const PushMe = require('./pushme.js');
const fs = require('fs');
const path = require('path');

// 获取消息发送数量
const dataPath = path.join(__dirname, 'config', 'data.json');
const getMessageCount = () => {
    if (!fs.existsSync(dataPath)) {
        return 0;
    }
    const data = require('./config/data.json');
    return data.messageCount;
}
const saveMessageCount = () => {
    fs.writeFileSync(dataPath, JSON.stringify({
        messageCount: PushmeStatus.messageCount,
    }, null, 2));
}
// 获取配置数据
const setting = (() => {
    const settingPath = path.join(__dirname, 'config', 'setting.js');
    if (!fs.existsSync(settingPath)) {
        return {};
    }
    return require(settingPath);
})();

// PushMe server
const server_port = 3100;
const pushme = new PushMe(server_port);
const PushmeStatus = {
    _messageCount: getMessageCount(),
    get messageCount() {
        return PushmeStatus._messageCount;
    },
    publish: async(...args) => {
        const res = await pushme.publish(...args);
        res == 'success' && PushmeStatus._messageCount++;
        return res;
    },
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
    appRestart: async() => {
        if (process.env.PM2) {
            process.send({type: 'shutdown'});
        } else {
            process.exit(0);
        }
    }
}

// PushMe panel
const panel_port = 3010;
const app = new App(async(ctx, next) => {
    ctx.pushme = PushmeStatus;
    await next();
});
const listenErr = err => {
    if(!err) {
        Logger.system('PushMe panel+api is started and listening on port', panel_port);
    } else {
        Logger.error('PushMe panel+api start failed, error:', err);
    }
}
if(setting.panel_tls != 'tls') {
    app.listen(panel_port, listenErr);
} else {
    const tlsOptions = {
        key: fs.readFileSync(pushme._keyPath),
        cert: fs.readFileSync(pushme._certPath),
        requestCert: false,
        rejectUnauthorized: false,
    };
    const tlsApp = require('https').createServer(tlsOptions, app.callback());
    tlsApp.listen(panel_port, listenErr);
}

// 保存数据
process.on('SIGTERM', async () => {
    Logger.system('Process SIGTERM')
    saveMessageCount();
    process.exit(0);
});
process.on('SIGINT', async () => {
    Logger.system('Process SIGINT')
    saveMessageCount();
    process.exit(0)
});