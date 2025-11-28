const Base = require('./base.js');
const path = require('path');

class Admin extends Base {
    _getPushkey() {
        return this.$config.setting ? this.$config.setting.push_keys.join(',') : '';
    }

    async _writeSettingFile(data = {}) {
        const setting = {
            push_key: this._getPushkey(),
            user: this.$config.setting.user,
            password: this.$config.setting.password,
            tls: 'none',
            ...data
        };
        const _parseKey = (push_key) => {
            push_key = push_key.replace(/'/g, '\\\'').replace(/ /g, '').replace(/,/g, "', '");
            return `'${push_key}'`;
        };
        setting.push_key = _parseKey(setting.push_key);
        const setting_str = `module.exports = {
    push_keys: [${setting.push_key}],
    user: '${setting.user}',
    password: '${setting.password}',
    tls: '${setting.tls}'
};`;
        const setting_file = path.join(this.$config.app.base_dir, './config/setting.js');
        await require('fs/promises').writeFile(setting_file, setting_str);
        require.cache[setting_file] && delete(require.cache[setting_file]);
    }
}

module.exports = Admin;