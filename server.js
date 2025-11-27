const {App, Logger} = require('jj.js');
const PushMe = require('./pushme.js');

// PushMe server
const pushme = new PushMe();
pushme.start();


// PushMe panel
const port = 3010;
const app = new App();

app.use(async(ctx, next) => {
    ctx.publish = async(...args) => {
        await pushme.publish(...args);
    };
    await next();
}).listen(port, err => {
    if(!err) {
        Logger.system('PushMe panel+api is started and listening on port', port);
    } else {
        Logger.error('PushMe panel+api start failed, error:', err);
    }
});