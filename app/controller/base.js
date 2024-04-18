const {Controller, utils} = require('jj.js');
const md5 = utils.md5;

class Base extends Controller
{
    _init() {
        const pkg = require('../../package.json');
        this.version = pkg.version;
        this.$assign('version', 'v' + pkg.version);
        this.$assign('is_login', this._isLogin());
    }

    _isLogin() {
        return this.$config.setting && this._md5(this.$cookie.get('user')) == this.$config.setting.user;
    }

    _md5(str, salt='pushme') {
        return md5(salt + md5(salt + md5(str + salt) + salt));
    }
}

module.exports = Base;