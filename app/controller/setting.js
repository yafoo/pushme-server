const Base = require('./base.js');
const path = require('path');

const time = () => Date.now() / 1000;
let retry_time = 0;
let retry_times = 5;

class Setting extends Base
{
    actions = {install: '系统安装', login: '账户登录', index: '系统设置'};
    buttons = {install: '安装', login: '登录', index: '设置'};

    async _init() {
        super._init();
        this.$assign('actions', this.actions);
        this.$assign('buttons', this.buttons);
        this.$assign('cur_nav', 'setting');
    }

    async index() {
        if(!this.$config.setting) {
            return this.$redirect('install');
        }

        if(!this._isLogin()) {
            return this.$redirect('login');
        }

        if(this.$request.isGet()) {
            const push_key = this.$config.setting.push_keys.join(',');
            this.$assign('push_key', push_key);
            this.$assign('action', 'index');
            return this.$fetch();
        }
        
        const push_key = this._parsePushkey(this.$request.query('push_key'));
        const user = this.$config.setting.user;
        const password = this.$config.setting.password;
        await this._writeSettingFile(push_key, user, password);
        this.$success('保存成功！');
    }

    async login() {
        if(this.$request.isGet()) {
            this.$assign('action', 'login');
            return this.$fetch('index');
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
        this.$success('登录成功！', 'index');
    }

    async logout() {
        this.$cookie.delete('user');
        this.$success('退出成功！', 'index');
    }

    async install() {
        if(this.$config.setting) { 
            return this.$redirect('index');
        }

        if(this.$request.isGet()) {
            this.$assign('action', 'install');
            return this.$fetch('index');
        }

        const push_key = this._parsePushkey(this.$request.query('push_key'));
        let user = this.$request.query('user');
        let password = this.$request.query('password');
        if(user == '' || password == '') {
            return this.$error('账号或密码不能为空！');
        }
        user = this._md5(user);
        password = this._md5(password);
        await this._writeSettingFile(push_key, user, password);

        this.$success('安装成功！', 'index');
    }

    _parsePushkey(push_key) {
        push_key = push_key.replace(/ /g, '').replace(/,/g, "', '");
        return `'${push_key}'`;
    }

    async _writeSettingFile(push_key, user, password) {
        const setting_str = `module.exports = {\n    push_keys: [${push_key}],\n    user: '${user}',\n    password: '${password}'\n};`;
        const setting_file = path.join(this.$config.app.base_dir, './config/setting.js');
        await require('fs/promises').writeFile(setting_file, setting_str);
        require.cache[setting_file] && delete(require.cache[setting_file]);
    }
}

module.exports = Setting;