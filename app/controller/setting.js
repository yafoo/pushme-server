const Admin = require('./admin.js');

class Setting extends Admin
{
    async _init() {
        const res = await super._init();
        if(res === false) {
            return false;
        }
        this.$assign('cur_nav', 'setting');
    }

    async index() {
        if(this.$request.isGet()) {
            this.$assign('push_key', this.$libs.setting.get_push_key());
            this.$assign('tls', this.$config.setting.tls || 'none');
            return this.$fetch();
        }

        const form = this.$request.query('form', '');
        if(form == 'push_key') {
            const push_key = this.$request.query('push_key', '');
            await this.$libs.setting.save({push_key});
        } else if(form == 'tls') {
            const tls = this.$request.query('tls', 'none');
            // 验证是否存在
            if(tls != 'none' && (!this.$libs.tls.existsKey() || !this.$libs.tls.existsCert())) {
                return this.$error(tls == 'public' ? '证书不存在' : '请先生成自签名证书');
            }
            await this.$libs.setting.save({tls});
            if(tls != this.$config.setting.tls) {
                await this.ctx.pushme.restart();
            }
        } else if(form == 'user') {
            const user = this.$request.query('user');
            const password = this.$request.query('password');
            if(!user || !password) {
                return this.$error('账号或密码不能为空！');
            }
            await this.$libs.setting.save({user: this._md5(user), password: this._md5(password)});
            // 模拟登录
            this.$cookie.set('user', user);
        }
        
        this.$success('保存成功！');
    }
}

module.exports = Setting;