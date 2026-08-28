const {App, Logger} = require('jj.js');
const {getConfig} = require('./config.js');

/**
 * PushMe 面板服务
 * @description 管理 Web 管理面板和 API 服务
 */
class PushmePanel {
    /**
     * @param {import('./pushme_server.js')} pushmeServer - PushMe服务实例
     * @param {import('./pushme_proxy.js').PushmeProxyInstance} pushmeProxy - PushMe代理对象
     */
    constructor(pushmeServer, pushmeProxy) {
        /** @type {import('./pushme_server.js')} */
        this.pushme = pushmeServer;
        /** @type {import('./pushme_proxy.js').PushmeProxyInstance} */
        this.pushmeProxy = pushmeProxy;
        /** @type {import('./config.js').ConfigManager} */
        this.config = getConfig();
        /** @type {import('jj.js').App} */
        this.app = new App();
        /** @type {import('http').Server|import('https').Server|null} */
        this.server = null;
        
        this._init();
    }
    
    /**
     * 初始化
     * @private
     */
    _init() {
        // 将 pushmeProxy 挂载到 Koa 上下文
        this.app.context.pushme = this.pushmeProxy;
        
        // 监听面板重启事件
        this.app.on('PANEL_RESTART', async () => {
            Logger.system('Panel restart event received');
            await this.restart();
        });
    }
    
    /**
     * 面板启动回调
     * @private
     * @param {Error} [err] - 启动错误
     */
    _onListen(err) {
        if(!err) {
            Logger.system(`PushMe panel+api started, listening on port ${this.config.panelPort}`);
        } else {
            Logger.error('PushMe panel+api failed to start:', err);
        }
    }
    
    /**
     * 启动面板服务
     */
    start() {
        const port = this.config.panelPort;
        if(this.config.panelTls == 'tls') {
            try {
                const tlsOptions = this.pushme.tlsOptions;
                this.server = require('https').createServer(tlsOptions, this.app.callback());
            } catch(err) {
                Logger.error('TLS cert not found, falling back to HTTP:', err.message);
                this.server = this.app.listen(port, this._onListen.bind(this));
                return;
            }
            this.server.listen(port, this._onListen.bind(this));
        } else {
            this.server = this.app.listen(port, this._onListen.bind(this));
        }
    }
    
    /**
     * 重启面板服务（热重启，不退出进程）
     * @returns {Promise<void>}
     */
    async restart() {
        Logger.system('Panel restarting...');
        
        // 关闭旧的服务器
        const server = this.server;
        if(server) {
            await this._closeServer(/** @type {any} */ (server));
            this.server = null;
        }
        
        // 重新加载配置
        this.config.reload();
        
        // 启动新的服务器
        this.start();
        Logger.system('Panel restarted');
    }
    
    /**
     * 关闭服务器
     * @private
     * @param {any} server - 服务器实例
     * @returns {Promise<void>}
     */
    _closeServer(server) {
        return new Promise(/** @type {function(function(): void)} */ ((resolve) => {
            server.close(() => {
                Logger.system('Panel server closed');
                resolve();
            });
        }));
    }
}

module.exports = PushmePanel;
