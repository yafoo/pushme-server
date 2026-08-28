const Admin = require('./admin.js');
const {getConfig} = require('../../lib/config.js');

/**
 * 服务管理控制器
 * @description 管理服务启停、证书生成、系统重启
 * @extends Admin
 */
class Server extends Admin
{
    /**
     * 获取服务运行状态
     * @returns {Promise<void>}
     */
    async status() {
        this.$success({
            memory: process.memoryUsage().heapUsed,
            uptime: process.uptime(),
            process: process.pid,
            node: process.version,
            platform: process.platform,
            message_count: this.ctx.pushme.messageCount,
            pushme_status: this.ctx.pushme.status,
            client_count: this.ctx.pushme.clientCount,
            connection_count: this.ctx.pushme.connectionCount,
            pushme_uptime: this.ctx.pushme.uptime,
            server_port: this.ctx.pushme.serverPort,
            panel_port: this.ctx.pushme.panelPort,
        });
    }

    /**
     * 启动PushMe服务
     * @returns {Promise<void>}
     */
    async start() {
        await this.$libs.setting.save({status: 'start'});
        this.ctx.pushme.start();
        this.$success('服务已启动！');
    }

    /**
     * 停止PushMe服务
     * @returns {Promise<void>}
     */
    async stop() {
        await this.$libs.setting.save({status: 'stop'});
        await this.ctx.pushme.stop();
        this.$success('服务已关闭！');
    }

    /**
     * 重启PushMe服务
     * @returns {Promise<void>}
     */
    async restart() {
        const result = await this.ctx.pushme.restart();
        if(result === '重启成功') {
            this.$success('服务已重启！');
        } else {
            this.$error(result);
        }
    }

    /**
     * 生成TLS自签名证书
     * @returns {Promise<void>}
     */
    async tlsCreate() {
        const config = getConfig();
        /** @type {number} 证书有效天数（10年） */
        const days = 3650;
        /** @type {string} 域名列表（换行分隔） */
        const domains = this.$request.query('domains', '');
        const res = await this.$libs.tls.create({domains, days});
        if(res.state) {
            if(config.panelTls != 'none') {
                setTimeout(() => {
                    this.ctx.app.emit('systemRestart');
                }, 3000);
            } else if(config.tls != 'none') {
                await this.ctx.pushme.restart();
            }
            this.$success('证书生成成功！');
        } else {
            this.$error(res.msg);
        }
    }

    /**
     * 获取证书内容
     * @returns {Promise<void>}
     */
    async getCert() {
        const content = await this.$libs.tls.getCertContent();
        if(content) {
            this.$success(content);
        } else {
            this.$error('获取失败！');
        }
    }

    /**
     * 系统级重启（进程级）
     * @returns {Promise<void>}
     */
    async systemRestart() {
        setTimeout(() => {
            this.ctx.app.emit('systemRestart');
        }, 3000);
        this.$success('操作成功！');
    }
}

module.exports = Server;
