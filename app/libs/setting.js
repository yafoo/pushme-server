const {Context, loader} = require('jj.js');
const path = require('path');

/**
 * 系统设置管理类
 * @extends Context
 */
class Setting extends Context
{
    /**
     * 获取所有push_key，逗号拼接
     * @returns {string} push_key字符串
     */
    get_push_key() {
        return this.$config.setting ? this.$config.setting.push_keys.join(',') : '';
    }

    /**
     * 保存系统设置到配置文件
     * @param {Object} [data={}] - 要更新的设置项
     * @param {string} [data.push_key] - 推送key（逗号分隔）
     * @param {string} [data.user] - 用户名
     * @param {string} [data.password] - 密码
     * @param {string} [data.tls] - TLS模式
     * @param {string} [data.panel_tls] - 面板TLS模式
     * @param {string} [data.status] - 服务状态
     * @returns {Promise<void>}
     */
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
        /**
         * 解析push_key为JS数组字面量格式
         * @param {string} push_key
         * @returns {string}
         */
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
        loader.clearPathCache();
    }
}

module.exports = Setting;
