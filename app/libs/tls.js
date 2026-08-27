const {Context} = require('jj.js');
const fs = require('fs');
const path = require('path');

/**
 * @typedef {Object} CertResult
 * @property {number} state - 状态码：1-成功，0-失败
 * @property {string} msg - 结果消息
 */

/**
 * @typedef {Object} CertCreateOptions
 * @property {string} domains - 域名列表（换行分隔）
 * @property {string} [country='CN'] - 国家代码（2字母）
 * @property {number} [days=3650] - 证书有效天数
 * @property {number} [size=2048] - 密钥长度
 */

/**
 * TLS证书管理类
 * @extends Context
 */
class Tls extends Context
{
    /**
     * @param {import('jj.js/types').KoaCtx} ctx - Koa上下文
     */
    constructor(ctx) {
        super(ctx);
        /** @type {string} 证书目录 */
        this.certsDir = path.join(this.$config.app.base_dir, './config/certs');
        /** @type {string} 私钥文件路径 */
        this.keyPath = path.join(this.certsDir, 'private.key');
        /** @type {string} 证书文件路径 */
        this.certPath = path.join(this.certsDir, 'cert.crt');
    }

    /**
     * 检查私钥文件是否存在
     * @returns {boolean}
     */
    existsKey() {
        return fs.existsSync(this.keyPath);
    }

    /**
     * 检查证书文件是否存在
     * @returns {boolean}
     */
    existsCert() {
        return fs.existsSync(this.certPath);
    }

    /**
     * 生成自签名SSL证书
     * @param {CertCreateOptions} opts - 证书配置选项
     * @returns {Promise<CertResult>} 生成结果
     */
    async create(opts) {
        const domains = opts.domains.split("\n").filter(item => item.trim() !== '');
        /** @type {Array<{name: string, value?: string}>} */
        const attrs = [
            { name: 'commonName', value: domains[0] }, // 常用名（域名）
            { name: 'countryName', value: opts.country || 'CN' },       // 国家代码（2字母）
            { name: 'organizationName', value: 'PushMe' }, // 组织名称
        ];
        // 扩展选项 - 包含 SAN (Subject Alternative Names)
        /** @type {Array<Object>} */
        const altNames = [];
        const net = require('net');
        domains.forEach(domain => {
            if (net.isIP(domain)) {
                altNames.push({
                    type: 7, // IP
                    ip: domain
                });
            } else {
                altNames.push({
                    type: 2, // DNS
                    value: domain
                });
            }
        });
        /** @type {Array<Object>} */
        const extensions = [
            {
                name: 'subjectAltName',
                altNames
            },
            {
                name: 'keyUsage',
                digitalSignature: true,
                keyEncipherment: true,
                serverAuth: true
            },
        ];
        const days = opts.days || 365 * 10;
        const notBeforeDate = new Date();
        const notAfterDate = new Date();
        notAfterDate.setDate(notAfterDate.getDate() + days);
        /** @type {Object} */
        const options = {
            algorithm: 'sha256',
            notBeforeDate,
            notAfterDate,
            keySize: opts.size || 2048,
            extensions: extensions,  // 扩展
        };

        try {
            const pems = await this._generate(attrs, options);
            if (!fs.existsSync(this.certsDir)) {
                fs.mkdirSync(this.certsDir, { recursive: true });
            }
            // 保存私钥
            fs.writeFileSync(this.keyPath, pems.private);
            // 保存证书
            fs.writeFileSync(this.certPath, pems.cert);
            return {state: 1, msg: '证书生成成功'};
        } catch (e) {
            const errorMsg = e instanceof Error ? e.message : String(e);
            return {state: 0, msg:  errorMsg};
        }
    }

    /**
     * 调用selfsigned生成证书
     * @param {Array<{name: string, value?: string}>} [attrs=[]] - 证书属性
     * @param {Object} [options={}] - 生成选项
     * @returns {Promise<{private: string, cert: string}>} PEM格式私钥和证书
     */
    async _generate(attrs = [], options = {}) {
        return require('selfsigned').generate(attrs, options);
    }

    /**
     * 获取证书文件内容
     * @returns {Promise<string>} 证书PEM内容，不存在返回空字符串
     */
    async getCertContent() {
        if (!this.existsCert()) {
            return '';
        }
        try {
            const buffer = fs.readFileSync(this.certPath, 'utf8');
            return buffer.toString();
        } catch (e) {
            return '';
        }
    }
}

module.exports = Tls;
