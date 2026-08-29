/**
 * 日志环形缓冲区
 * @description 内存存储最近日志，支持 SSE 实时推送
 */
class LogBuffer {
    /**
     * @param {number} [maxSize=1000] - 缓冲区最大条数
     */
    constructor(maxSize = 1000) {
        /** @type {Array<{time: number, level: string, msg: string}>} */
        this.buffer = [];
        /** @type {number} */
        this.maxSize = maxSize;
        /** @type {Array<Function>} SSE 订阅者列表 */
        this.listeners = [];
    }

    /**
     * 写入日志
     * @param {string} level - 日志级别
     * @param {...any} args - 日志内容
     */
    write(level, ...args) {
        const line = {
            time: Date.now(),
            level,
            msg: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
        };
        this.buffer.push(line);
        if (this.buffer.length > this.maxSize) {
            this.buffer.shift();
        }
        // 通知 SSE 订阅者
        this.listeners.forEach(fn => fn(line));
    }

    /**
     * 获取最近 N 条日志
     * @param {number} [n=100] - 条数
     * @returns {Array<{time: number, level: string, msg: string}>}
     */
    getRecent(n = 100) {
        return this.buffer.slice(-n);
    }

    /**
     * 清空缓冲区
     */
    clear() {
        this.buffer = [];
    }

    /**
     * 订阅日志流
     * @param {Function} fn - 回调函数
     */
    subscribe(fn) {
        this.listeners.push(fn);
    }

    /**
     * 取消订阅
     * @param {Function} fn - 回调函数
     */
    unsubscribe(fn) {
        this.listeners = this.listeners.filter(f => f !== fn);
    }
}

// 导出单例
module.exports = new LogBuffer();
