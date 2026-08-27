const {Controller, utils} = require('jj.js');
const {getConfig} = require('../../lib/config.js');
const md5 = utils.md5;

/**
 * 控制器基类
 * @description 提供版本信息、安装检测、登录检测、MD5加密等公共方法
 */
class Base extends Controller
{
    /** 初始化公共模板变量 */
    _init() {
        const pkg = require('../../package.json');
        /** @type {string} 当前版本号 */
        this.version = pkg.version;
        this.$assign('version', 'v' + pkg.version);
        this.$assign('is_install', this._isInstall());
        this.$assign('is_login', this._isLogin());
    }

    /**
     * 检测系统是否已安装
     * @returns {boolean} 是否已安装
     */
    _isInstall() {
        const config = getConfig();
        return !!(config.user && config.password);
    }

    /**
     * 检测用户是否已登录
     * @returns {boolean} 是否已登录
     */
    _isLogin() {
        const config = getConfig();
        return this._isInstall() && this._md5(this.$cookie.get('user')) == config.user;
    }

    /**
     * 多层MD5加密（加盐）
     * @param {string} str - 原始字符串
     * @param {string} [salt='pushme'] - 盐值
     * @returns {string} 加密后的MD5字符串
     */
    _md5(str, salt='pushme') {
        return md5(salt + md5(salt + md5(str + salt) + salt));
    }
}

module.exports = Base;
