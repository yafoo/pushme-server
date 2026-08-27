const Base = require('./base.js');

/**
 * 管理控制器基类
 * @description 提供安装检测和登录验证的权限拦截
 * @extends Base
 */
class Admin extends Base {
    /**
     * 权限验证初始化
     * @returns {Promise<undefined|'__EXIT__'>} 返回__EXIT__表示终止后续执行
     */
    async _init() {
        super._init();

        if(!this._isInstall()) {
            return this.$redirect('login/install');
        }

        if(!this._isLogin()) {
            return this.$redirect('login/index');
        }
    }
}

module.exports = Admin;
