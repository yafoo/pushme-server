/**
 * PushMe Server 入口文件
 * @description 启动PushMe推送服务和Web管理面板
 */

const {App, Logger} = require('jj.js');
const PushMe = require('./pushme.js');
const {PushmeProxy} = require('./utils.js');
const {getConfig} = require('./lib/config.js');

const config = getConfig();

/** @type {number} PushMe服务端口（MQTT/WebSocket/TCP） */
const server_port = 3100;
/** @type {import('./pushme.js')} PushMe服务实例 */
const pushme = new PushMe(server_port);

/** @type {number} Web管理面板端口 */
const panel_port = 3010;
/** @type {import('./utils.js').PushmeProxyInstance} PushMe代理对象 */
const pushmeProxy = PushmeProxy(pushme, server_port, panel_port);

/**
 * @type {import('jj.js').App} jj.js应用实例
 * @description 注入pushme代理到Koa上下文
 */
const app = new App(async(ctx, next) => {
    ctx.pushme = pushmeProxy;
    await next();
});

/**
 * 面板启动回调
 * @param {Error} [err] - 启动错误
 */
const listenErr = err => {
    if(!err) {
        Logger.system('PushMe panel+api is started and listening on port', panel_port);
    } else {
        Logger.error('PushMe panel+api start failed, error:', err);
    }
}

// 根据配置选择HTTP或HTTPS启动面板
if(config.panelTls == 'tls') { // 共用服务证书
    require('https').createServer(pushme.tlsOptions, app.callback()).listen(panel_port, listenErr);
} else {
    app.listen(panel_port, listenErr);
}

// 进程退出时保存消息计数
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
