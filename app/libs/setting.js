const {Context} = require('jj.js');
const path = require('path');

class Setting extends Context
{
    get_push_key() {
        return this.$config.setting ? this.$config.setting.push_keys.join(',') : '';
    }

    async save(data = {}) {
        const setting = {
            push_key: this.get_push_key(),
            user: this.$config.setting && this.$config.setting.user || '',
            password: this.$config.setting && this.$config.setting.password || '',
            tls: this.$config.setting && this.$config.setting.tls || 'none',
            panel_tls: this.$config.setting && this.$config.setting.panel_tls || 'none',
            status: this.$config.setting && this.$config.setting.status || 'start',
            ...data
        };
        const _parseKey = (push_key) => {
            push_key = push_key.replace(/'/g, '\\\'').replace(/ /g, '').replace(/,/g, "', '");
            return `'${push_key}'`;
        };
        setting.push_key = _parseKey(setting.push_key);
        const setting_str = 
`module.exports = {
    push_keys: [${setting.push_key}],
    user: '${setting.user}',
    password: '${setting.password}',
    tls: '${setting.tls}', // none public self
    panel_tls: '${setting.panel_tls}', // none tls
    status: '${setting.status}', // start stop
};`;
        const setting_file = path.join(this.$config.app.base_dir, './config/setting.js');
        await require('fs/promises').writeFile(setting_file, setting_str);
        require.cache[setting_file] && delete(require.cache[setting_file]);
    }
}

module.exports = Setting;