const Admin = require('./admin.js');

class Setting extends Admin
{
    async _init() {
        super._init();
        this.$assign('cur_nav', 'setting');
    }

    async index() {
        if(!this._isInstall()) {
            return this.$redirect('install');
        }

        if(!this._isLogin()) {
            return this.$redirect('login/index');
        }

        if(this.$request.isGet()) {
            this.$assign('push_key', this._getPushkey());
            return this.$fetch();
        }
        
        const push_key = this.$request.query('push_key', '');
        await this._writeSettingFile({push_key});
        this.$success('保存成功！');
    }

    

    

    
}

module.exports = Setting;