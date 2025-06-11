const app = {
    app_debug: false, // 调试模式
    static_dir: 'public', // 静态文件目录
    koa_body: {} // koa-body配置参数，为''、null、false时，关闭koa-body
}

module.exports = app;