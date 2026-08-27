const {Logger, utils} = require('jj.js');
const {getConfig} = require('./lib/config.js');
const fs = require('fs');
const path = require('path');

/**
 * @typedef {import('aedes').Aedes} Aedes
 * @typedef {import('aedes').Client} AedesClient
 * @typedef {import('http').Server} HttpServer
 * @typedef {import('net').Server} TcpServer
 * @typedef {import('net').Socket} TcpSocket
 * @typedef {import('tls').Server} TlsServer
 * @typedef {import('ws').WebSocketServer} WsServer
 */

/**
 * PushMe消息推送服务
 * @description 支持MQTT/WebSocket/TCP多协议，集成Aedes MQTT Broker
 */
class PushMe {
    /**
     * @param {number} [port=3100] - 服务监听端口
     */
    constructor(port = 3100) {
        /** @type {number} 服务启动时间戳 */
        this._ontime = 0;
        /** @type {number} 当前连接数 */
        this._connectionCount = 0;
        /** @type {number} 服务端口 */
        this._port = port;
        /** @type {string} 证书目录 */
        this._certsDir = path.join(__dirname, 'config', 'certs');
        /** @type {string} 私钥文件路径 */
        this._keyPath = path.join(this._certsDir, 'private.key');
        /** @type {string} 证书文件路径 */
        this._certPath = path.join(this._certsDir, 'cert.crt');
        /** @type {import('./lib/config.js').ConfigManager} 配置管理器 */
        this._config = getConfig();
        /** @type {Aedes|null} MQTT Broker实例 */
        this.aedes = null;
        /** @type {HttpServer|null} HTTP服务器（用于证书下载和WebSocket） */
        this.httpServer = null;
        /** @type {WsServer|null} WebSocket服务器 */
        this.wsServer = null;
        /** @type {TcpServer|TlsServer|null} TCP/TLS服务器 */
        this.tcpServer = null;

        if(this._config.status === 'start') {
            this.start();
        } else {
            Logger.system('PushMe server is not started');
        }
    }

    /**
     * TLS配置选项
     * @type {import('node:tls').TlsOptions}
     */
    get tlsOptions() {
        return {
            key: fs.readFileSync(this._keyPath),
            cert: fs.readFileSync(this._certPath),
            requestCert: false,
            rejectUnauthorized: false,
        };
    }

    /** 初始化所有服务器（Aedes、HTTP、WebSocket、TCP） */
    async _setupServers() {
        // PushMe aedes
        this.aedes = await createAedes();

        // PushMe Certs Server
        this.httpServer = require('http').createServer((req, res) => {
            let status = 404;
            /** @type {Record<string, string>} */
            let headers = {'Content-Type': 'text/plain'};
            /** @type {string|Buffer} */
            let body = 'Not Found';
            const url = req.url || '';
            if(~url.indexOf('/certs/cert.crt')) {
                status = 200;
                body = fs.existsSync(this._certPath) ? fs.readFileSync(this._certPath) : '请先在服务端生成自签名证书';
            } else if(~url.indexOf('/certs/download')) {
                status = 200;
                body = fs.existsSync(this._certPath) ? fs.readFileSync(this._certPath) : '';
                headers = {
                    'Content-Type': 'application/x-x509-ca-cert',
                    'Content-Disposition': 'attachment; filename="cert.crt"',
                    'Content-Length': String(body.length),
                    'Cache-Control': 'no-cache'
                };
            }
            res.writeHead(status, headers);
            res.end(body);
            Logger.debug(url, body);
        });

        // PushMe WebSocket Server (ws)
        const WebSocket = require('ws');
        this.wsServer = new WebSocket.WebSocketServer({ server: this.httpServer });
        this.wsServer.on('connection', (websocket, req) => {
            const stream = WebSocket.createWebSocketStream(websocket);
            this.aedes && this.aedes.handle(stream, /** @type {any} */(req));
        });

        // PushMe Server
        if(this._config.tls && this._config.tls != 'none' && fs.existsSync(this._keyPath) && fs.existsSync(this._certPath)) {
            this.tcpServer = /** @type {TcpServer|TlsServer} */ (require('node:tls').createServer(this.tlsOptions, /** @type {any} */ (this._handleConnection.bind(this))));
        } else {
            this.tcpServer = require('net').createServer(this._handleConnection.bind(this));
        }
    }

    /**
     * 处理新TCP连接，自动检测协议并分发
     * @param {TcpSocket} socket - TCP连接套接字
     */
    _handleConnection(socket) {
        this._connectionCount++;
        Logger.debug('New connection. Total:', this._connectionCount);

        socket.setTimeout(1000);
        let isProtocolDetected = false;
        let initialBuffer = Buffer.alloc(0);

        /** @param {Buffer} chunk */
        const onData = chunk => {
            if (isProtocolDetected) return;

            initialBuffer = Buffer.concat(/** @type {any} */ ([initialBuffer, chunk]));
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
                this.aedes && this.aedes.handle(socket);
            } else if(protocol == 'websocket') {
                Logger.debug('WebSocket connection detected');
                this.httpServer && this.httpServer.emit('connection', socket);
            } else if(protocol == 'http') {
                Logger.debug('HTTP connection detected');
                this.httpServer && this.httpServer.emit('connection', socket);
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

        /** @param {Error} err */
        const onError = err => {
            Logger.system('Socket error:', err.message);
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

    /**
     * 检测连接协议类型
     * @param {Buffer} buffer - 初始数据缓冲
     * @returns {'mqtt'|'websocket'|'http'|'unknown'|'need_more_data'} 检测到的协议
     */
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

    /** 启动服务 */
    async start() {
        await this._setupServers();
        this.tcpServer && this.tcpServer.listen(this._port, /** @param {Error} [err] */ (err) => {
            if(!err) {
                this._ontime = Date.now();
                Logger.system('PushMe server is started and listening on port', this._port);
            } else {
                Logger.system('PushMe server start failed, error:', err);
            }
        });
    }

    /**
     * 停止服务
     * @returns {Promise<string>} 操作结果
     */
    async stop() {
        if(!this.tcpServer) {
            return '服务未启动';
        }

        try {
            // 保存消息计数
            const {getConfig} = require('./lib/config.js');
            const config = getConfig();
            // 注意：这里不能直接访问 pushmeProxy，需要通过事件或回调
            // 暂时保留原有逻辑，消息计数由外部保存

            await new Promise((resolve, reject) => {
                this.tcpServer && this.tcpServer.close(err => {
                    if(!err) {
                        Logger.system('PushMe tcp server is stopped');
                        resolve(undefined);
                    } else {
                        Logger.system('PushMe tcp server stop failed, error:', err);
                        reject(err);
                    }
                });
                !this.tcpServer && resolve(undefined);
            });

            this.wsServer && this.wsServer.close();

            await new Promise((resolve, reject) => {
                this.httpServer && this.httpServer.listening && this.httpServer.close(err => {
                    if(!err) {
                        Logger.system('PushMe http server is stopped');
                        resolve(undefined);
                    } else {
                        Logger.system('PushMe http server stop failed, error:', err);
                        reject(err);
                    }
                });
                (!this.httpServer || !this.httpServer.listening) && resolve(undefined);
            });

            this.aedes && await closeAedes(this.aedes);
            
            this.tcpServer = null;
            this.wsServer = null;
            this.httpServer = null;
            this.aedes = null;
            this._connectionCount = 0;

            Logger.system('PushMe server is stopped');
            return '关闭成功';
        } catch(/** @type {any} */ err) {
            Logger.system('PushMe stop failed, error:', err);
            return err.message;
        }
    }

    /**
     * 优雅重启服务（不中断进程）
     * @returns {Promise<string>} 操作结果
     */
    async restart() {
        Logger.system('PushMe server restarting...');
        const stopResult = await this.stop();
        if(stopResult !== '关闭成功' && stopResult !== '服务未启动') {
            return '重启失败: ' + stopResult;
        }
        await this.start();
        return '重启成功';
    }

    /**
     * 服务运行时长
     * @type {number} 运行秒数
     */
    get uptime() {
        return this.status == 'start' ? (Date.now() - this._ontime) / 1000 : 0;
    }

    /**
     * 服务状态
     * @type {'start'|'stop'}
     */
    get status() {
        return this.tcpServer ? 'start' : 'stop';
    }

    /**
     * 当前连接数
     * @type {number}
     */
    get connectionCount() {
        return this._connectionCount;
    }

    /**
     * 已连接的MQTT客户端数
     * @type {number}
     */
    get clientCount() {
        return this.aedes ? this.aedes.connectedClients : 0;
    }

    /**
     * 发布消息到MQTT Broker
     * @param {string} topic - 消息主题
     * @param {string|Object} msg - 消息内容，对象会自动序列化
     * @param {number} [qos=1] - QoS级别（0|1|2）
     * @returns {Promise<string>} 发布结果
     */
    async publish(topic, msg, qos = 1) {
        /** @type {string} */
        let payload;
        if(typeof msg == 'object') {
            /** @type {Record<string, any>} */
            const obj = msg;
            if(!obj.date) {
                obj.date = utils.date.format('YYYY-mm-dd HH:ii:ss');
            }
            payload = JSON.stringify(obj);
        } else {
            payload = msg;
        }
        return new Promise((resolve, reject) => {
            const packet = /** @type {any} */ ({
                cmd: 'publish',
                topic,
                payload: Buffer.from(payload),
                qos,
                dup: false,
                retain: false
            });
            this.aedes && this.aedes.publish(packet, error => {
                const result = error ? error.message : 'success';
                Logger.system('[publish]', msg, result);
                resolve(result);
            });
        });
    }
}

/**
 * 创建并配置Aedes MQTT Broker
 * @returns {Promise<Aedes>} 配置好的Aedes实例
 */
async function createAedes() {
    const { Aedes } = require('aedes');
    /** @type {Aedes} */
    const aedes = await Aedes.createBroker();

    /**
     * 连接前拦截，调整keepalive值
     * @param {AedesClient} client
     * @param {any} packet - 连接报文
     * @param {Function} callback
     */
    aedes.preConnect = function(client, packet, callback) {
        Logger.debug('[preConnect]', packet.clientId);
        if(packet.keepalive == 300 || packet.keepalive == 600) {
            packet.keepalive = 640;
        }
        callback(null, true);
    }

    /**
     * 订阅授权，只允许已配置的push_key主题
     * @param {AedesClient} client
     * @param {Object} sub - 订阅对象
     * @param {string} sub.topic - 订阅主题
     * @param {Function} callback
     */
    aedes.authorizeSubscribe = function(client, sub, callback) {
        Logger.debug('[authorizeSubscribe]', client.id);
        const config = getConfig();
        if(!sub.topic || !config.pushKeys.includes(sub.topic)) {
            return callback(new Error('errorTopic: ' + sub.topic));
        }
        callback(null, sub);
    }

    aedes.on('client', function(client) {
        Logger.system('[client]', client.id)
    })
    aedes.on('clientReady', function(client) {
        Logger.system('[clientReady]', client.id);
    });
    aedes.on('clientDisconnect', function(client) {
        Logger.system('[clientDisconnect]', client.id);
    });
    /**
     * @param {AedesClient} client
     * @param {Error} err
     */
    aedes.on('clientError', function (client, err) {
        Logger.system('[clientError]', client.id, err.message);
    });

    return aedes;
}

/**
 * 关闭Aedes MQTT Broker
 * @param {Aedes} aedes - Aedes实例
 * @returns {Promise<void>}
 */
function closeAedes(aedes) {
    return new Promise((resolve, reject) => {
        aedes.close(/** @param {Error} [err] */ (err) => {
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
