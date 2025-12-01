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
            status: this.ctx.pushme.status,
            client_count: this.ctx.pushme.clientCount,
            connection_count: this.ctx.pushme.connectionCount,
        });
    }

    async start() {
        await this.$libs.setting.save({status: 'start'});
        this.ctx.pushme.start();
        this.$success('服务已启动！');
    }

    async stop() {
        await this.$libs.setting.save({status: 'start'});
        await this.ctx.pushme.stop();
        this.$success('服务已关闭！');
    }

    async restart() {
        await this.ctx.pushme.restart();
        this.$success('服务已重启！');
    }

    async tlsCreate() {
        const days = 3650;
        const domain = this.ctx.request.hostname;
        const res = await this.$libs.server.tlsCreate({domain, days});
        if(res.state) {
            await this.ctx.pushme.restart();
            this.$success('证书生成成功！');
        } else {
            this.$error(res.msg);
        }
    }

    async systemRestart() {
        if (process.env.PM2) {
            process.send({ type: 'shutdown' });
        } else {
            process.exit(0);
        }
    }
}

module.exports = Server;