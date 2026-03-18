const {App, Logger} = require('jj.js');
const PushMe = require('./pushme.js');
const {getSetting, PushmeProxy} = require('./utils.js');

// 获取配置数据
const setting = getSetting();

// PushMe server
const server_port = 3100;
const pushme = new PushMe(server_port);

// PushMe panel
const panel_port = 3010;
const pushmeProxy = PushmeProxy(pushme, server_port, panel_port);
const app = new App(async(ctx, next) => {
    ctx.pushme = pushmeProxy;
    await next();
});
const listenErr = err => {
    if(!err) {
        Logger.system('PushMe panel+api is started and listening on port', panel_port);
    } else {
        Logger.error('PushMe panel+api start failed, error:', err);
    }
}
if(setting.panel_tls == 'tls') { // 共用服务证书
    require('https').createServer(pushme.tlsOptions, app.callback()).listen(panel_port, listenErr);
} else {
    app.listen(panel_port, listenErr);
}

// 保存数据
process.on('SIGTERM', async () => {
    Logger.system('Process SIGTERM');
    pushmeProxy.messageCountSave();
    process.exit(0);
});
process.on('SIGINT', async () => {
    Logger.system('Process SIGINT');
    pushmeProxy.messageCountSave();
    process.exit(0)
});