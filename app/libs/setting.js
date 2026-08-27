const {Context} = require('jj.js');
const {getConfig} = require('../../lib/config.js');

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
        const config = getConfig();
        return config.pushKeys.join(',');
    }

    /**
     * 保存系统设置
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
        const config = getConfig();
        /** @type {Record<string, any>} */
        const updates = {};

        // 处理push_key：逗号分隔字符串 → 数组
        if(data.push_key !== undefined) {
            updates.push_keys = data.push_key.replace(/ /g, '').split(',').filter(k => k);
        }
        // 直接映射的字段
        for(const key of ['user', 'password', 'tls', 'panel_tls', 'status']) {
            if(data[key] !== undefined) {
                updates[key] = data[key];
            }
        }

        config.update(updates);
    }
}

module.exports = Setting;
