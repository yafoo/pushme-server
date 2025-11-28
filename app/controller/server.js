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
        this.$success('证书生成成功！');
    }
}

module.exports = Server;