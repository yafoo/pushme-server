const Admin = require('./admin.js');
const {getConfig} = require('../../lib/config.js');

/**
 * 系统设置控制器
 * @description 管理push_key、TLS配置、用户账号
 * @extends Admin
 */
class Setting extends Admin
{
    /**
     * 初始化，设置当前导航
     * @returns {Promise<import('jj.js/types').EXIT|undefined>}
     */
    async _init() {
        const res = await super._init();
        if(res === '__EXIT__') {
            return '__EXIT__';
        }
        this.$assign('cur_nav', 'setting');
    }

    /**
     * 设置页面/保存设置
     * @description GET显示设置页面，POST根据form字段处理不同设置项
     * @returns {Promise<import('jj.js/types').EXIT|void>}
     */
    async index() {
        const config = getConfig();
        if(this.$request.isGet()) {
            this.$assign('push_key', this.$libs.setting.get_push_key());
            this.$assign('tls', config.tls);
            this.$assign('panel_tls', config.panelTls);
            this.$assign('server_port', config.serverPort);
            this.$assign('panel_port', config.panelPort);
            /** @type {string[]} 证书域名列表 */
            const domains = [];
            const domain = this.ctx.request.hostname.replace(/\[|\]/g, '');
            domains.push(domain);
            domain != '127.0.0.1' && domains.push('127.0.0.1');
            domain != '::1' && domains.push('::1');
            this.$assign('domains', domains.join("\\n"));
            return this.$fetch();
        }

        /** @type {string} 表单类型标识 */
        const form = this.$request.query('form', '');
        let ext_msg = '';
        const oldTls = config.tls;
        const oldPanelTls = config.panelTls;
        const oldServerPort = config.serverPort;
        const oldPanelPort = config.panelPort;
        if(form == 'push_key') {
            const push_key = this.$request.query('push_key', '');
            await this.$libs.setting.save({push_key});
        } else if(form == 'tls') {
            const tls = this.$request.query('tls', 'none');
            const panel_tls = this.$request.query('panel_tls', 'none');
            // 验证是否存在
            if((tls != 'none' || panel_tls != 'none') && (!this.$libs.tls.existsKey() || !this.$libs.tls.existsCert())) {
                return this.$error(tls == 'public' ? '证书不存在' : '请先生成自签名证书');
            }
            await this.$libs.setting.save({tls, panel_tls});
            if(panel_tls != oldPanelTls) {
                ext_msg = '系统将自动重启';
                setTimeout(() => {
                    this.ctx.app.emit('systemRestart');
                }, 3000);
            } else if(tls != oldTls) {
                ext_msg = '服务将自动重启';
                await this.ctx.pushme.restart();
            }
        } else if(form == 'port') {
            const server_port = parseInt(this.$request.query('server_port', '3100'));
            const panel_port = parseInt(this.$request.query('panel_port', '3010'));
            if(isNaN(server_port) || isNaN(panel_port) || server_port < 1 || panel_port < 1 || server_port > 65535 || panel_port > 65535) {
                return this.$error('端口号必须为1-65535之间的数字！');
            }
            await this.$libs.setting.save({server_port, panel_port});
            if(server_port != oldServerPort || panel_port != oldPanelPort) {
                ext_msg = '系统将自动重启以应用新端口';
                setTimeout(() => {
                    this.ctx.app.emit('systemRestart');
                }, 3000);
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
        
        this.$success('保存成功！' + ext_msg);
    }
}

module.exports = Setting;
