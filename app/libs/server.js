const {Context} = require('jj.js');
const fs = require('fs');
const path = require('path');

class Server extends Context
{
    async tlsCreate(opts = {}) {
        const attrs = [
            { name: 'commonName', value: opts.domian || 'loacalhost' }, // 常用名（域名）
            { name: 'countryName', value: opts.country || 'CN' },                // 国家代码（2字母）
            { name: 'stateOrProvinceName', value: opts.state || 'H' },     // 州/省
            { name: 'localityName', value: opts.city || 'L' },             // 城市
            { name: 'organizationName', value: 'PushMe' }, // 组织名称
            { name: 'organizationalUnitName', value: 'PushMe' } // 部门
        ];
        const options = {
            algorithm: 'sha256',
            days: opts.days || 365,
            keySize: opts.size || 2048,
            extensions: [
                {
                    name: 'subjectAltName',
                    altNames: [
                        { type: 2, value: opts.domian || 'localhost' },
                        { type: 2, value: opts.domian ? `*.${opts.domian}` : '*.localhost' },
                        { type: 7, value: '127.0.0.1' },
                        { type: 7, value: '::1' }
                    ]
                },
            ]
        };
        try {
            const pems = await this._tlsGenerate(attrs, options);
            const certDir = path.join(this.$config.app.base_dir, './config/certs');
            if (!fs.existsSync(certDir)) {
                fs.mkdirSync(certDir, { recursive: true });
            }
            // 保存私钥
            fs.writeFileSync(path.join(certDir, 'private.key'), pems.private);
            // 保存证书
            fs.writeFileSync(path.join(certDir, 'cert.crt'), pems.cert);
            return {state: 1, msg: '证书生成成功'};
        } catch (e) {
            return {state: 0, msg: e.message};
        }
    }

    async _tlsGenerate(attrs = [], options = {}) {
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
}

module.exports = Server;