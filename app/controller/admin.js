const Base = require('./base.js');
const path = require('path');

class Admin extends Base {
    _getPushkey() {
        return this.$config.setting ? this.$config.setting.push_keys.join(',') : '';
    }

    _parsePushkey(push_key) {
        push_key = push_key.replace(/ /g, '').replace(/,/g, "', '");
        return `'${push_key}'`;
    }

    async _writeSettingFile(data = {}) {
        const setting = {
            push_key: '',
            user: '',
            password: '',
            ...data
        };
        if(setting.push_key !== '') {
            setting.push_key = this._parsePushkey(data.push_key);
        } else {
            setting.push_key = this._getPushkey();
        }
        if(!setting.user) {
            setting.user = this.$config.setting.user;
        }
        if(!setting.password) {
            setting.password = this.$config.setting.password;
        }
        const setting_str = `module.exports = {\n    push_keys: [${setting.push_key}],\n    user: '${setting.user}',\n    password: '${setting.password}'\n};`;
        const setting_file = path.join(this.$config.app.base_dir, './config/setting.js');
        await require('fs/promises').writeFile(setting_file, setting_str);
        require.cache[setting_file] && delete(require.cache[setting_file]);
    }
}

module.exports = Admin;