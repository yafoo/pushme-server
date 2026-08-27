const Base = require('./base.js');
const {getConfig} = require('../../lib/config.js');

/**
 * 获取当前Unix时间戳（秒）
 * @returns {number}
 */
const time = () => Date.now() / 1000;

/** @type {number} 下次可重试时间戳 */
let retry_time = 0;
/** @type {number} 剩余重试次数 */
let retry_times = 5;

/**
 * 登录控制器
 * @description 处理登录、登出、系统安装
 * @extends Base
 */
class Login extends Base 
{
    /** 初始化，设置当前导航 */
    async _init() {
        super._init();
        this.$assign('cur_nav', 'login');
    }

    /**
     * 登录页面/登录提交
     * @description GET显示登录页面，POST处理登录请求，含错误重试限制
     * @returns {Promise<import('jj.js/types').EXIT|void>}
     */
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

        const config = getConfig();
        let user = this.$request.query('user');
        let password = this.$request.query('password');
        user = this._md5(user);
        password = this._md5(password);
        if(user != config.user || password != config.password) {
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

    /**
     * 退出登录
     * @returns {Promise<void>}
     */
    async logout() {
        this.$cookie.delete('user');
        this.$success('退出成功！', 'index');
    }

    /**
     * 系统安装
     * @description GET显示安装页面，POST处理安装请求（创建管理员账号）
     * @returns {Promise<import('jj.js/types').EXIT|void>}
     */
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
        // 启动服务
        await this.ctx.pushme.restart();

        // 模拟登录
        this.$cookie.set('user', user);
        this.$success('安装成功！', 'setting/index');
    }
}

module.exports = Login;
