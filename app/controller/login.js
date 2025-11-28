const Base = require('./base.js');
const time = () => Date.now() / 1000;
let retry_time = 0;
let retry_times = 5;

class Login extends Base 
{
    async _init() {
        super._init();
        this.$assign('cur_nav', 'login');
    }

    async index() {
        if(!this._isInstall()) { 
            return this.$redirect('install');
        }

        if(this._isLogin()) { 
            return this.$success('您已登录！', 'setting/index');
        }

        if(this.$request.isGet()) {
            return this.$fetch();
        }

        if(retry_time > time()) {
            let delay_time = Math.floor(retry_time - time());
            let delay_str = '';
            if(delay_time >= 60) {
                delay_str += Math.floor(delay_time / 60) + '分钟';
                delay_time = delay_time % 60;
            }
            delay_str += Math.floor(delay_time) + '秒';
            return this.$error(`请${delay_str}后再试！`);
        }

        let user = this.$request.query('user');
        let password = this.$request.query('password');
        user = this._md5(user);
        password = this._md5(password);
        if(user != this.$config.setting.user || password != this.$config.setting.password) {
            retry_times--;
            if(retry_times > 0) {
                return this.$error(`账号或密码错误！${retry_times <= 3 ? '还剩' + retry_times + '机会' : ''}`);
            } else {
                retry_times = 5;
                retry_time = time() + 3 * 60;
                return this.$error(`账号或密码错误！请稍后再试`);
            }
        }

        this.$cookie.set('user', this.$request.query('user'));
        this.$success('登录成功！', 'setting/index');
    }

    async logout() {
        this.$cookie.delete('user');
        this.$success('退出成功！', 'index');
    }

    async install() {
        if(this._isInstall()) {
            return this.$success('您已安装！', 'setting/index');
        }

        if(this.$request.isGet()) {
            this.$assign('cur_nav', 'install');
            this.$assign('form', 'install');
            return this.$fetch('index');
        }

        const user = this.$request.query('user');
        const password = this.$request.query('password');
        if(!user || !password) {
            return this.$error('账号或密码不能为空！');
        }
        await this.$libs.setting.save({user: this._md5(user), password: this._md5(password)});

        // 模拟登录
        this.$cookie.set('user', user);
        this.$success('安装成功！', 'setting/index');
    }
}

module.exports = Login;