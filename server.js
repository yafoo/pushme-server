const {App, Logger, utils} = require('jj.js');
const Aedes = require('aedes');

// PushMe server
const aedes = Aedes();
aedes.preConnect = function(client, packet, callback) {
    // Logger.log('server', '[preConnect]', packet.clientId);
    if(packet.keepalive == 300 || packet.keepalive == 600) {
        packet.keepalive = 640;
    }
    callback(null, true);
}
aedes.authorizeSubscribe = function(client, sub, callback) {
    // Logger.log('server', '[authorizeSubscribe]', client.id);
    let setting = {};
    try {
        setting = require('./config/setting.js');
    } catch(e) {}
    if(!sub.topic || !setting.push_keys || !setting.push_keys.includes(sub.topic)) {
        Logger.log('server', '[errorTopic]', sub.topic);
        return callback(new Error('errorTopic: ' + sub.topic));
    }
    callback(null, sub);
}

aedes.on('clientReady', function(client) {
    Logger.log('server', '[clientReady]', client.id);
});
aedes.on('clientDisconnect', function(client) {
    Logger.log('server', '[clientDisconnect]', client.id);
});
aedes.on('clientError', function (client, err) {
    Logger.log('server', '[clientError]', client.id, err.message);
});

const server = require('net').createServer(aedes.handle);
const server_port = 3100;
server.listen(server_port, function (err) {
    if(!err) {
        Logger.system('pushme server is started and listening on port', server_port);
    } else {
        Logger.error('pushme server error', err);
    }
});

// publish message
async function publish(topic, msg, qos = 1) {
    if(typeof msg == 'object') {
        if(!msg.date) {
            msg.date = utils.date.format('YYYY-mm-dd HH:ii:ss');
        }
        msg = JSON.stringify(msg);
    }
    return new Promise((resolve, reject) => {
        const packet = {
            topic,
            payload: Buffer.from(msg),
            qos
        };
        aedes.publish(packet, error => {
            const result = error ? 'fail' : 'success';
            Logger.log('server', '[publish]', msg, result);
            resolve(result);
        });
    });
}

// PushMe panel
const app = new App();
app.use(async(ctx, next) => {
    ctx.publish = publish;
    await next();
});
const panel_port = 3010;
const panelServer = app.listen(panel_port, function(err) {
    if(!err) {
        Logger.system('pushme panel is started and listening on port', panel_port);
    } else {
        Logger.error('pushme panel error', err);
    }
});

const ws = require('websocket-stream');
ws.createServer({server: panelServer}, aedes.handle);
Logger.system('websocket is started and listening on port', panel_port);