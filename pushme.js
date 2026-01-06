const {Logger, utils} = require('jj.js');
const fs = require('fs');
const path = require('path');

class PushMe {
    constructor(port = 3100) {
        this._ontime = 0;
        this._connectionCount = 0;
        this._port = port;
        this._certsDir = path.join(__dirname, 'config', 'certs');
        this._keyPath = path.join(this._certsDir, 'private.key');
        this._certPath = path.join(this._certsDir, 'cert.crt');
        this._initSetting();
        if(this._setting.status === 'start') {
            this.start();
        } else {
            Logger.system('PushMe server 未开启');
        }
    }

    _initSetting() {
        const setting_path = path.join(__dirname, 'config', 'setting.js');
        if(fs.existsSync(setting_path)) {
            this._setting = require(setting_path);
        } else {
            this._setting = {};
        }
    }

    get tlsOptions() {
        return {
            key: fs.readFileSync(this._keyPath),
            cert: fs.readFileSync(this._certPath),
            requestCert: false,
            rejectUnauthorized: false,
        };
    }

    _setupServers() {
        // PushMe aedes
        this.aedes = createAedes();

        // PushMe WebSocket
        this.httpServer = require('http').createServer((req, res) => {
            let status = 404;
            let headers = {'Content-Type': 'text/plain'};
            let body = 'Not Found';
            if(~req.url.indexOf('/certs/cert.crt')) {
                status = 200;
                body = fs.existsSync(this._certPath) ? fs.readFileSync(this._certPath) : '请先在服务端生成自签名证书';
            } else if(~req.url.indexOf('/certs/download')) {
                status = 200;
                body = fs.existsSync(this._certPath) ? fs.readFileSync(this._certPath) : '';
                headers = {
                    'Content-Type': 'application/x-x509-ca-cert',
                    'Content-Disposition': 'attachment; filename="cert.crt"',
                    'Content-Length': body.length,
                    'Cache-Control': 'no-cache'
                };
            }
            res.writeHead(status, headers);
            res.end(body);
            Logger.debug(req.url, body);
        });
        this.wsServer = require('websocket-stream').createServer({ server: this.httpServer }, this.aedes.handle);

        // PushMe Server
        if(this._setting.tls && this._setting.tls != 'none' && fs.existsSync(this._keyPath) && fs.existsSync(this._certPath)) {
            this.tcpServer = require('tls').createServer(this.tlsOptions, this._handleConnection.bind(this));
        } else {
            this.tcpServer = require('net').createServer(this._handleConnection.bind(this));
        }
    }

    _handleConnection(socket) {
        this._connectionCount++;
        Logger.debug('New connection. Total:', this._connectionCount);

        socket.setTimeout(1000);
        let isProtocolDetected = false;
        let initialBuffer = Buffer.alloc(0);

        const onData = chunk => {
            if (isProtocolDetected) return;

            initialBuffer = Buffer.concat([initialBuffer, chunk]);
            if(initialBuffer.length < 8) return;

            isProtocolDetected = true
            socket.setTimeout(0); // 清除超时
            socket.removeListener('data', onData);
            socket.removeListener('timeout', onTimeout);
            socket.removeListener('error', onError);

            // 快速协议检测
            const protocol = this._detectProtocol(initialBuffer);
            socket.unshift(initialBuffer)
            if (protocol == 'mqtt') {
                Logger.debug('TCP connection detected');
                this.aedes.handle(socket);
            } else if(protocol == 'websocket') {
                Logger.debug('WebSocket connection detected');
                this.httpServer.emit('connection', socket);
            } else if(protocol == 'http') {
                Logger.debug('HTTP connection detected');
                this.httpServer.emit('connection', socket);
            } else {
                Logger.debug(`${protocol} connection detected`);
                socket.destroy();
            }
        };

        const onTimeout = () => {
            if (!isProtocolDetected) {
                Logger.debug('Protocol detection timeout');
                socket.destroy();
            }
        };

        const onError = err => {
            Logger.log('server', 'Socket error:', err.message);
            socket.destroy();
        };

        socket.on('data', onData);
        socket.on('timeout', onTimeout);
        socket.on('error', onError);
        socket.once('close', () => {
            this._connectionCount--;
            Logger.debug('Connection closed. Total:', this._connectionCount);
        });
    }

    _detectProtocol(buffer) {
        if (buffer.length < 8) {
            return 'need_more_data'; // 数据不足，等待更多
        }

        // 检查 MQTT: 前6字节包含 "MQTT" 字符串
        if (buffer[0] === 0x10 && buffer.length >= 8) {
            const protocolName = buffer.toString('utf8', 4, 8);
            if (protocolName === 'MQTT') {
                return 'mqtt';
            }
        }

        // 检查 WebSocket: 包含完整的握手特征
        const dataStr = buffer.toString('utf8');
        if (dataStr.startsWith('GET') && dataStr.includes('Upgrade: websocket')) {
            return 'websocket';
        }

        // 检查普通 HTTP (不是 WebSocket)
        const methods = ['GET ', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'];
        if (methods.some(method => dataStr.startsWith(method))) {
            return 'http';
        }

        return 'unknown';
    }

    start() {
        this._initSetting();
        this._setupServers();
        this.tcpServer.listen(this._port, err => {
            if(!err) {
                this._ontime = Date.now();
                Logger.system('PushMe server is started and listening on port', this._port);
            } else {
                Logger.system('PushMe server start failed, error:', err);
            }
        });
    }

    async stop() {
        if(!this.tcpServer) {
            return '服务未启动';
        }

        try {
            await new Promise((resolve, reject) => {
                this.tcpServer && this.tcpServer.close(err => {
                    if(!err) {
                        Logger.system('PushMe tcp server is stopped');
                        resolve();
                    } else {
                        Logger.system('PushMe tcp server stop failed, error:', err);
                        reject(err);
                    }
                });
                !this.tcpServer && resolve();
            });

            await new Promise((resolve, reject) => {
                this.wsServer && this.wsServer.close(err => {
                    if(!err) {
                        Logger.system('PushMe websocket server is stopped');
                        resolve();
                    } else {
                        Logger.system('PushMe websocket server stop failed, error:', err);
                        reject(err);
                    }
                });
                !this.wsServer && resolve();
            });

            await new Promise((resolve, reject) => {
                this.httpServer && this.httpServer.listening && this.httpServer.close(err => {
                    if(!err) {
                        Logger.system('PushMe http server is stopped');
                        resolve();
                    } else {
                        Logger.system('PushMe http server stop failed, error:', err);
                        reject(err);
                    }
                });
                (!this.httpServer || !this.httpServer.listening) && resolve();
            });

            this.aedes && await closeAedes(this.aedes);
            
            this.tcpServer = null;
            this.wsServer = null;
            this.httpServer = null;
            this.aedes = null;
            this._connectionCount = 0;
            return '关闭成功';
        } catch(err) {
            Logger.system('PushMe stop failed, error:', err);
            return err.message;
        }
    }

    get uptime() {
        return this.status == 'start' ? (Date.now() - this._ontime) / 1000 : 0;
    }

    get status() {
        return this.tcpServer ? 'start' : 'stop';
    }

    get connectionCount() {
        return this._connectionCount;
    }

    get clientCount() {
        return this.aedes ? Object.keys(this.aedes.clients).length : 0;
    }

    /**
     * publish message
     * @returns {Promise}
     */
    async publish(topic, msg, qos = 1) {
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
            this.aedes.publish(packet, error => {
                const result = error ? error.message : 'success';
                Logger.log('server', '[publish]', msg, result);
                resolve(result);
            });
        });
    }
}

/**
 * @typedef {typeof import('aedes').default.prototype} aedes
 */
/**
 * 重置参数
 * @returns {aedes}
 */
function createAedes() {
    /**
     * @type {aedes}
     */
    const aedes = require('aedes')();

    aedes.preConnect = function(client, packet, callback) {
        Logger.debug('[preConnect]', packet.clientId);
        if(packet.keepalive == 300 || packet.keepalive == 600) {
            packet.keepalive = 640;
        }
        callback(null, true);
    }
    aedes.authorizeSubscribe = function(client, sub, callback) {
        Logger.debug('[authorizeSubscribe]', client.id);
        let setting = {};
        try {
            setting = require('./config/setting.js');
        } catch(e) {}
        if(!sub.topic || !setting.push_keys || !setting.push_keys.includes(sub.topic)) {
            Logger.debug('[errorTopic]', sub.topic);
            return callback(new Error('errorTopic: ' + sub.topic));
        }
        callback(null, sub);
    }

    aedes.on('client', function(client) {
        Logger.log('server', '[client]', client.id)
    })
    aedes.on('clientReady', function(client) {
        Logger.log('server', '[clientReady]', client.id);
    });
    aedes.on('clientDisconnect', function(client) {
        Logger.log('server', '[clientDisconnect]', client.id);
    });
    aedes.on('clientError', function (client, err) {
        Logger.log('server', '[clientError]', client.id, err.message);
    });

    return aedes;
}
/**
 * 重置参数
 * @param {aedes} aedes
 */
function closeAedes(aedes) {
    return new Promise((resolve, reject) => {
        aedes.close((err) => {
            if (err) {
                Logger.system('PushMe aedes server stop failed, error:', err);
                reject(err)
            } else {
                Logger.system('PushMe aedes server is stopped');
                resolve()
            }
        });
    })
}

module.exports = PushMe;