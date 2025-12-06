const Admin = require('./admin.js');

class Server extends Admin
{
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

    async start() {
        await this.$libs.setting.save({status: 'start'});
        this.ctx.pushme.start();
        this.$success('服务已启动！');
    }

    async stop() {
        await this.$libs.setting.save({status: 'stop'});
        await this.ctx.pushme.stop();
        this.$success('服务已关闭！');
    }

    async restart() {
        await this.ctx.pushme.restart();
        this.$success('服务已重启！');
    }

    async tlsCreate() {
        const days = 3650;
        const domains = this.$request.query('domains', '');
        const res = await this.$libs.tls.create({domains, days});
        if(res.state) {
            if(this.$config.setting.panel_tls != 'none') {
                setTimeout(async () => {
                    await this.ctx.pushme.appRestart();
                }, 3000);
            } else if(this.$config.setting.tls != 'none') {
                await this.ctx.pushme.restart();
            }
            this.$success('证书生成成功！');
        } else {
            this.$error(res.msg);
        }
    }

    async getCert() {
        const content = await this.$libs.tls.getCertContent();
        if(content) {
            this.$success(content);
        } else {
            this.$error('获取失败！');
        }
    }

    async systemRestart() {
        setTimeout(async () => {
            await this.ctx.pushme.appRestart();
        }, 3000);
        this.$success('操作成功！');
    }
}

module.exports = Server;