const app = {
    app_debug: false, // 调试模式
    static_dir: {
        static_dir: './public', //静态文件目录，相对于应用根目录，为空或false时，关闭静态访问
        options: {
            maxage: 10 * 24 * 60 * 60 * 1000, //静态文件缓存时间，单位毫秒
        }
    },
    koa_body: { multipart: true } // koa-body配置参数，为''、null、false时，关闭koa-body
}

module.exports = app;