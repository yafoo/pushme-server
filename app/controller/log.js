const Admin = require('./admin.js');
const logBuffer = require('../../lib/log_buffer.js');

/**
 * 日志控制器
 * @description 提供SSE实时日志流和历史日志查询
 * @extends Admin
 */
class Log extends Admin
{
    /**
     * SSE实时日志流
     * @description 实时推送新日志，先发送最近100条历史
     * @returns {Promise<'__EXIT__'>}
     */
    async stream() {
        const ctx = this.ctx;
        ctx.set({
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no' // Nginx 禁用缓冲
        });
        ctx.status = 200;
        ctx.respond = false; // 阻止 Koa 写入响应

        /** @param {{time: number, level: string, msg: string}} line */
        const listener = (line) => {
            ctx.res.write(`data: ${JSON.stringify(line)}\n\n`);
        };

        // 先发送最近100条历史日志
        logBuffer.getRecent(100).forEach(line => {
            ctx.res.write(`data: ${JSON.stringify(line)}\n\n`);
        });

        // 注册实时监听
        logBuffer.subscribe(listener);
        ctx.req.on('close', () => {
            logBuffer.unsubscribe(listener);
        });

        return '__EXIT__';
    }

    /**
     * 获取历史日志（JSON接口）
     */
    async history() {
        /** @type {number} 条数，默认100 */
        const count = parseInt(this.$request.query('count', '100'));
        this.$success(logBuffer.getRecent(count));
    }

    /**
     * 清空日志缓冲区
     */
    async clear() {
        logBuffer.clear();
        this.$success('日志已清空');
    }
}

module.exports = Log;
