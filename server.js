const {App, Logger} = require('jj.js');
const PushMe = require('./pushme.js');

// PushMe server
const pushme = new PushMe();
const pushmeProxy = {
    publish: async(...args) => {
        await pushme.publish(...args);
    },
    start: () => {
        pushme.start();
    },
    stop: async() => {
        await pushme.stop();
    },
    restart: async() => {
        await pushme.stop();
        pushme.start();
    },
    get status() {
        return pushme.status;
    },
    get clientCount() {
        return pushme.clientCount;
    },
    get connectionCount() {
        return pushme.connectionCount;
    }
}

// PushMe panel
const port = 3010;
const app = new App();

app.use(async(ctx, next) => {
    ctx.pushme = pushmeProxy;
    await next();
}).listen(port, err => {
    if(!err) {
        Logger.system('PushMe panel+api is started and listening on port', port);
    } else {
        Logger.error('PushMe panel+api start failed, error:', err);
    }
});