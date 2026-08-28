/**
 * PushMe Server 入口文件
 * @description 启动PushMe推送服务和Web管理面板
 */

const {Logger} = require('jj.js');
const PushMeServer = require('./lib/pushme_server.js');
const PushmeProxy = require('./lib/pushme_proxy.js');
const PushmePanel = require('./lib/pushme_panel.js');

// 创建 PushMe 服务实例
const pushmeServer = new PushMeServer();

// 创建 PushMe 代理对象
const pushmeProxy = PushmeProxy(pushmeServer);

// 创建并启动面板服务
const pushmePanel = new PushmePanel(pushmeServer, pushmeProxy);
pushmePanel.start();

// 进程退出时保存消息计数
/**
 * @param {string} type 
 */
async function saveCount(type) {
    Logger.system(`Process ${type}, saving message count...`);
    pushmeProxy.messageCountSave();
    process.exit(0);
}
process.on('SIGTERM', async () => {
    await saveCount('SIGTERM');
});
process.on('SIGINT', async () => {
    await saveCount('SIGINT');
});
