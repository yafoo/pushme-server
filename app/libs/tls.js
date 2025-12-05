const {Context} = require('jj.js');
const fs = require('fs');
const path = require('path');

class Tls extends Context
{
    constructor(ctx) {
        super(ctx);
        this.certsDir = path.join(this.$config.app.base_dir, './config/certs');
        this.keyPath = path.join(this.certsDir, 'private.key');
        this.certPath = path.join(this.certsDir, 'cert.crt');
    }

    existsKey() {
        return fs.existsSync(this.keyPath);
    }

    existsCert() {
        return fs.existsSync(this.certPath);
    }

    async create(opts = {}) {
        const attrs = [
            { name: 'commonName', value: '128.1.128.55' }, // 常用名（域名）
            { name: 'countryName', value: opts.country || 'CN' },       // 国家代码（2字母）
            { name: 'organizationName', value: 'PushMe' }, // 组织名称
        ];
        // 扩展选项 - 包含 SAN (Subject Alternative Names)
        const extensions = [
            {
                name: 'subjectAltName',
                altNames: [
                    // DNS 名称
                    // { type: 2, value: 'localhost' },

                    // IP 地址 (IPv4)
                    { type: 7, ip: '127.0.0.1' },
                    { type: 7, ip: '128.1.128.55' },

                    // IP 地址 (IPv6)
                    // { type: 7, ip: '::1' },
                    // { type: 7, ip: 'fe80::1' }
                ]
            },
            // 添加密钥用法扩展
            {
                name: 'keyUsage',
                digitalSignature: true,
                keyEncipherment: true,
                serverAuth: true
            },
            // 添加增强密钥用法
            // {
            //     name: 'extKeyUsage',
            //     serverAuth: true,
            //     clientAuth: true
            // }
        ];
        const options = {
            algorithm: 'sha256',
            days: opts.days || 365 * 10,
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
            return {state: 0, msg: e.message};
        }
    }

    async _generate(attrs = [], options = {}) {
        return new Promise((resolve, reject) => {
            require('selfsigned').generate(attrs, options, function(err, pems) {
                if(err) {
                    reject(err);
                } else {
                    resolve(pems);
                }
            });
        });
    }

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