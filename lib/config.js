const fs = require('fs');
const path = require('path');
const {Logger} = require('jj.js');

/**
 * 当前配置版本号
 * 版本历史：
 * - v1: 初始版本，合并 setting.js 和 data.json，messageCount 改为 message_count
 */
const CONFIG_VERSION = 1;

/**
 * @typedef {Object} AppConfig
 * @property {number} [config_version] - 配置版本号
 * @property {number} [server_port] - PushMe服务端口（MQTT/WebSocket/TCP）
 * @property {number} [panel_port] - Web管理面板端口
 * @property {Array<{key: string, temp_key: string, note: string}>} [push_keys] - 推送key列表（含临时key和备注）
 * @property {string} [user] - 用户名（md5加密后）
 * @property {string} [password] - 密码（md5加密后）
 * @property {'none'|'public'|'self'} [tls] - TLS模式：none-无, public-公共证书, self-自签名
 * @property {'none'|'tls'} [panel_tls] - 面板TLS模式：none-无, tls-启用
 * @property {'start'|'stop'} [status] - 服务状态
 * @property {number} [message_count] - 消息计数
 */

/**
 * 配置管理器
 * @description 统一管理应用配置，提供内存缓存和原子写入
 */
class ConfigManager {
    constructor() {
        /** @type {string} 配置文件路径 */
        this.configPath = path.join(__dirname, '..', 'config', 'data.json');
        /** @type {string} 旧配置文件路径 */
        this.oldSettingPath = path.join(__dirname, '..', 'config', 'setting.js');
        /** @type {string} 旧数据文件路径 */
        this.oldDataPath = path.join(__dirname, '..', 'config', 'data.json');
        /** @type {AppConfig} 内存缓存 */
        this._cache = {};
        /** @type {Set<function>} 配置变更监听器 */
        this._listeners = new Set();
        
        // 初始化：先迁移旧配置，再加载新配置
        this._migrate();
        this._load();
    }

    /**
     * 迁移配置
     * 处理两种情况：
     * 1. 从旧格式迁移（setting.js + 旧 data.json）
     * 2. 版本升级迁移（根据 config_version）
     * @private
     */
    _migrate() {
        const hasOldSetting = fs.existsSync(this.oldSettingPath);
        const hasOldData = fs.existsSync(this.oldDataPath);
        const hasNewConfig = fs.existsSync(this.configPath);
        
        // 情况1：从旧格式迁移（v0 -> v1）
        if (hasOldSetting || (hasOldData && !hasNewConfig)) {
            this._migrateFromLegacy();
            return;
        }
        
        // 情况2：版本升级迁移
        if (hasNewConfig) {
            this._migrateVersion();
        }
    }

    /**
     * 从旧格式迁移到 v1
     * @private
     */
    _migrateFromLegacy() {
        Logger.system('Legacy config detected, migrating to v1...');

        /** @type {AppConfig} */
        const migratedConfig = { config_version: CONFIG_VERSION };

        // 迁移旧的 setting.js
        if (fs.existsSync(this.oldSettingPath)) {
            try {
                delete require.cache[require.resolve(this.oldSettingPath)];
                const oldSetting = require(this.oldSettingPath);
                
                if (oldSetting.push_keys) migratedConfig.push_keys = oldSetting.push_keys;
                if (oldSetting.user) migratedConfig.user = oldSetting.user;
                if (oldSetting.password) migratedConfig.password = oldSetting.password;
                if (oldSetting.tls) migratedConfig.tls = oldSetting.tls;
                if (oldSetting.panel_tls) migratedConfig.panel_tls = oldSetting.panel_tls;
                if (oldSetting.status) migratedConfig.status = oldSetting.status;
                
                Logger.system('Migrated setting.js config');
            } catch (/** @type {any} */ err) {
                Logger.error('Failed to migrate setting.js:', err.message);
            }
        }

        // 迁移旧的 data.json（messageCount -> message_count）
        if (fs.existsSync(this.oldDataPath)) {
            try {
                const oldData = JSON.parse(fs.readFileSync(this.oldDataPath, 'utf8'));
                if (oldData.messageCount !== undefined) {
                    migratedConfig.message_count = oldData.messageCount;
                    Logger.system('Migrated messageCount:', oldData.messageCount);
                }
            } catch (/** @type {any} */ err) {
                Logger.error('Failed to migrate data.json:', err.message);
            }
        }

        // 如果新配置文件已存在，合并配置
        if (fs.existsSync(this.configPath)) {
            try {
                const existingConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
                Object.assign(migratedConfig, existingConfig, migratedConfig);
            } catch (/** @type {any} */ err) {
                Logger.error('Failed to read existing config:', err.message);
            }
        }

        // 保存迁移后的配置
        this._saveConfig(migratedConfig);

        // 备份旧配置文件
        if (fs.existsSync(this.oldSettingPath)) {
            try {
                fs.renameSync(this.oldSettingPath, this.oldSettingPath + '.bak');
                Logger.system('Backed up setting.js to setting.js.bak');
            } catch (/** @type {any} */ err) {
                Logger.error('Failed to backup setting.js:', err.message);
            }
        }

        Logger.system('Config migration to v1 complete');
    }

    /**
     * 版本升级迁移
     * 后续添加新版本迁移逻辑时，在这里添加对应的 case
     * @private
     */
    _migrateVersion() {
        let config;
        try {
            config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        } catch (/** @type {any} */ err) {
            Logger.error('Failed to read config:', err.message);
            return;
        }

        const currentVersion = config.config_version || 0;
        if (currentVersion >= CONFIG_VERSION) {
            return; // 已是最新版本
        }

        Logger.system(`Config upgrading: v${currentVersion} -> v${CONFIG_VERSION}`);

        // 按版本顺序执行迁移
        // v0 -> v1: 初始版本（已在 _migrateFromLegacy 处理）
        // 示例：v1 -> v2 迁移
        // if (currentVersion < 2) {
        //     config = this._migrateV1toV2(config);
        // }
        // 示例：v2 -> v3 迁移
        // if (currentVersion < 3) {
        //     config = this._migrateV2toV3(config);
        // }

        config.config_version = CONFIG_VERSION;
        this._saveConfig(config);
        Logger.system('Config upgrade complete');
    }

    /**
     * 保存配置到文件
     * @private
     * @param {AppConfig} config - 配置对象
     */
    _saveConfig(config) {
        const tempPath = this.configPath + '.tmp';
        try {
            fs.writeFileSync(tempPath, JSON.stringify(config, null, 2), 'utf8');
            fs.renameSync(tempPath, this.configPath);
        } catch (/** @type {any} */ err) {
            Logger.error('Failed to save config:', err.message);
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
        }
    }

    // ========== 版本迁移方法（示例） ==========
    
    /**
     * v1 -> v2 迁移示例
     * @private
     * @param {AppConfig} config - 旧配置
     * @returns {AppConfig} 新配置
     */
    // _migrateV1toV2(config) {
    //     Logger.system('执行 v1 -> v2 迁移');
    //     // 示例：添加新字段
    //     // config.new_field = 'default_value';
    //     // 示例：重命名字段
    //     // config.new_name = config.old_name;
    //     // delete config.old_name;
    //     return config;
    // }

    /**
     * 从文件加载配置
     * @private
     */
    _load() {
        try {
            if (fs.existsSync(this.configPath)) {
                const content = fs.readFileSync(this.configPath, 'utf8');
                this._cache = JSON.parse(content);
            } else {
                // 全新安装
                this._cache = {config_version: CONFIG_VERSION};
            }
        } catch (/** @type {any} */ err) {
            Logger.error('Config load failed:', err.message);
            this._cache = {};
        }
    }

    /**
     * 保存配置到文件（原子写入）
     * @private
     * @param {AppConfig} config - 配置对象
     */
    _save(config) {
        const tempPath = this.configPath + '.tmp';
        try {
            // 先写入临时文件
            fs.writeFileSync(tempPath, JSON.stringify(config, null, 2), 'utf8');
            // 原子替换
            fs.renameSync(tempPath, this.configPath);
            this._cache = config;
        } catch (/** @type {any} */ err) {
            Logger.error('Config save failed:', err.message);
            // 清理临时文件
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
            throw err;
        }
    }

    /**
     * 获取完整配置对象
     * @returns {AppConfig}
     */
    getAll() {
        return {...this._cache};
    }

    /**
     * 获取单个配置项
     * @template {keyof AppConfig} K
     * @param {K} key - 配置键名
     * @param {AppConfig[K]} [defaultValue] - 默认值
     * @returns {AppConfig[K]}
     */
    get(key, defaultValue) {
        const value = this._cache[key];
        return value !== undefined ? value : defaultValue;
    }

    /**
     * 设置单个配置项
     * @param {keyof AppConfig} key - 配置键名
     * @param {any} value - 配置值
     */
    set(key, value) {
        const oldConfig = {...this._cache};
        this._cache[key] = value;
        this._save(this._cache);
        this._notifyChange(key, value, oldConfig[key], oldConfig);
    }

    /**
     * 批量更新配置
     * @param {Partial<AppConfig>} updates - 要更新的配置项
     */
    update(updates) {
        const oldConfig = {...this._cache};
        /** @type {Array<keyof AppConfig>} */
        const changedKeys = [];
        
        for (const [key, value] of Object.entries(updates)) {
            const k = /** @type {keyof AppConfig} */ (key);
            if (this._cache[k] !== value) {
                changedKeys.push(k);
            }
            this._cache[k] = /** @type {any} */ (value);
        }
        
        this._save(this._cache);
        
        // 通知所有变更
        for (const key of changedKeys) {
            this._notifyChange(/** @type {string} */ (key), this._cache[key], oldConfig[key], oldConfig);
        }
    }

    /**
     * 重新加载配置（从文件）
     */
    reload() {
        this._load();
    }

    /**
     * 监听配置变更
     * @param {function(string, any, any, AppConfig): void} listener - 监听器函数 (key, newValue, oldValue, oldConfig)
     * @returns {function} 取消监听函数
     */
    onChange(listener) {
        this._listeners.add(listener);
        return () => this._listeners.delete(listener);
    }

    /**
     * 通知配置变更
     * @private
     * @param {string} key - 变更的键
     * @param {any} newValue - 新值
     * @param {any} oldValue - 旧值
     * @param {AppConfig} oldConfig - 旧配置
     */
    _notifyChange(key, newValue, oldValue, oldConfig) {
        for (const listener of this._listeners) {
            try {
                listener(key, newValue, oldValue, oldConfig);
            } catch (/** @type {any} */ err) {
                Logger.error('Config change listener error:', err.message);
            }
        }
    }

    // ========== 便捷访问器 ==========

    /** @returns {number} PushMe服务端口 */
    get serverPort() {
        return this._cache.server_port || 3100;
    }

    /** @returns {number} Web管理面板端口 */
    get panelPort() {
        return this._cache.panel_port || 3010;
    }

    /** @returns {string[]} 推送key列表（仅key字符串） */
    get pushKeys() {
        const keys = this._cache.push_keys || [];
        return keys.map(item => typeof item === 'string' ? item : (item.key || ''));
    }

    /** @returns {Array<{key: string, temp_key: string, note: string}>} 推送key列表（含临时key和备注） */
    get pushKeysWithNotes() {
        const keys = this._cache.push_keys || [];
        return keys.map(item => {
            if(typeof item === 'string') {
                return { key: item, temp_key: '', note: '' };
            }
            return { key: item.key || '', temp_key: item.temp_key || '', note: item.note || '' };
        });
    }

    /**
     * 根据临时key查找对应的真实key
     * @param {string} tempKey - 临时key
     * @returns {string|null} 真实key，未找到返回null
     */
    findKeyByTempKey(tempKey) {
        const keys = this._cache.push_keys || [];
        for(const item of keys) {
            if(typeof item !== 'string' && item.temp_key === tempKey) {
                return item.key || null;
            }
        }
        return null;
    }

    /** @returns {string} 用户名 */
    get user() {
        return this._cache.user || '';
    }

    /** @returns {string} 密码 */
    get password() {
        return this._cache.password || '';
    }

    /** @returns {'none'|'public'|'self'} TLS模式 */
    get tls() {
        return this._cache.tls || 'none';
    }

    /** @returns {'none'|'tls'} 面板TLS模式 */
    get panelTls() {
        return this._cache.panel_tls || 'none';
    }

    /** @returns {'start'|'stop'} 服务状态 */
    get status() {
        return this._cache.status || 'start';
    }

    /** @returns {number} 消息计数 */
    get messageCount() {
        return this._cache.message_count || 0;
    }

    /** @param {number} value - 消息计数 */
    set messageCount(value) {
        this.set('message_count', value);
    }
}

// 单例模式
/** @type {ConfigManager|null} */
let instance = null;

/**
 * 获取配置管理器实例
 * @returns {ConfigManager}
 */
function getConfig() {
    if (!instance) {
        instance = new ConfigManager();
    }
    return instance;
}

module.exports = {
    ConfigManager,
    getConfig
};
