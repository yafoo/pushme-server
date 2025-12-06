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
        const domains = opts.domains.split("\n").filter(item => item.trim() !== '');
        const attrs = [
            { name: 'commonName', value: domains[0] }, // 常用名（域名）
            { name: 'countryName', value: opts.country || 'CN' },       // 国家代码（2字母）
            { name: 'organizationName', value: 'PushMe' }, // 组织名称
        ];
        // 扩展选项 - 包含 SAN (Subject Alternative Names)
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