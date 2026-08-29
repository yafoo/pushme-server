const logBuffer = require('../lib/log_buffer.js');

module.exports = {
    log_level: ['system', 'error'],
    // @ts-ignore
    log_handle: function(level, ...args) {
        // 格式化时间
        const time = new Date().toISOString().replace('T', ' ').slice(0, 19);
        // console 输出
        console.log(`[${time}] [${level}]`, ...args);
        // 写入缓冲区
        logBuffer.write(level, ...args);
    }
};
