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
        });
    }

    async start() {
        this.$success('服务已启动！');
    }

    async stop() {
        this.$success('服务已关闭！');
    }

    async restart() {
        this.$success('服务已重启！');
    }

    async tlsCreate() {
        const days = 3650;
        const domain = this.ctx.request.hostname;
        const res = await this.$libs.server.tlsCreate({domain, days});
        if(res.state) {
            this.$success('证书生成成功！');
        } else {
            this.$error(res.msg);
        }
    }
}

module.exports = Server;