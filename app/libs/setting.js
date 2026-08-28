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
     * @param {Object} data - 要更新的设置项
     * @returns {Promise<void>}
     */
    async save(data) {
        const config = getConfig();
        const updates = /** @type {Record<string, any>} */ ({});
        
        // Convert data to entries to avoid TypeScript indexing issues
        const dataObj = /** @type {any} */ (data || {});
        const entries = Object.entries(dataObj);
        
        for(const [key, value] of entries) {
            if(key === 'push_key' && typeof value === 'string') {
                // 处理push_key：逗号分隔字符串 → 数组
                updates.push_keys = value.replace(/ /g, '').split(',').filter(k => k);
            } else if(['user', 'password', 'tls', 'panel_tls', 'status', 'server_port', 'panel_port'].includes(key)) {
                // 直接映射的字段
                updates[key] = value;
            }
        }

        config.update(updates);
    }
}

module.exports = Setting;
