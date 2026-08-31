const {Context, Logger} = require('jj.js');
const {getConfig} = require('../../lib/config.js');

/**
 * @typedef {Object} PushKeyItem
 * @property {string} key - 推送key
 * @property {string} [temp_key] - 临时key
 * @property {string} [note] - 备注
 */

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
     * 获取所有push_key列表（含备注）
     * @returns {PushKeyItem[]} push_key列表
     */
    get_push_keys() {
        const config = getConfig();
        return config.pushKeysWithNotes;
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
            if(key === 'push_keys' && Array.isArray(value)) {
                // 处理push_keys：数组格式 [{key, temp_key, note}]
                updates.push_keys = value.map(item => {
                    if(typeof item === 'string') {
                        return { key: item, temp_key: '', note: '' }; // 兼容旧格式
                    }
                    if(item && item.key) {
                        return {
                            key: item.key,
                            temp_key: item.temp_key || '',
                            note: item.note || ''
                        };
                    }
                    return null;
                }).filter(item => item !== null);
            } else if(key === 'push_key' && typeof value === 'string') {
                // 处理push_key：逗号分隔字符串 → 数组（向后兼容）
                updates.push_keys = value.replace(/ /g, '').split(',').filter(k => k).map(k => ({ key: k, temp_key: '', note: '' }));
            } else if(['user', 'password', 'tls', 'panel_tls', 'status', 'server_port', 'panel_port'].includes(key)) {
                // 直接映射的字段
                updates[key] = value;
            }
        }

        config.update(updates);
        Logger.system('config updated:', updates);
    }
}

module.exports = Setting;
