const Base = require('./base.js');

class Admin extends Base {
    /**
     * @returns {Promise<boolean>}
     */
    async _init() {
        super._init();

        if(!this._isInstall()) {
            this.$redirect('install');
            return false;
        }

        if(!this._isLogin()) {
            this.$redirect('login/index');
            return false;
        }
    }
}

module.exports = Admin;