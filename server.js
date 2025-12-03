const {App, Logger} = require('jj.js');
const PushMe = require('./pushme.js');
const fs = require('fs');
const path = require('path');
const { get } = require('jj.js/lib/cache.js');

// 获取数据
const getMessageCount = () => {
    const dataPath = path.join(__dirname, 'config', 'data.json');
    if (!fs.existsSync(dataPath)) {
        return 0;
    }
    const data = require('./config/data.json');
    return data.messageCount;
}
const saveMessageCount = () => {
    const dataPath = path.join(__dirname, 'config', 'data.json');
    fs.writeFileSync(dataPath, JSON.stringify({
        messageCount: PushmeStatus.messageCount,
    }, null, 2));
}

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

// PushMe panel
const app = new App();
const panel_port = 3010;
app.use(async(ctx, next) => {
    ctx.pushme = PushmeStatus;
    await next();
}).listen(panel_port, err => {
    if(!err) {
        Logger.system('PushMe panel+api is started and listening on port', panel_port);
    } else {
        Logger.error('PushMe panel+api start failed, error:', err);
    }
});