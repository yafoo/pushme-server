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
            const push_keys = this.$libs.setting.get_push_keys();
            this.$assign('push_keys_json', JSON.stringify(push_keys));
            this.$assign('tls', config.tls);
            this.$assign('panel_tls', config.panelTls);
            this.$assign('server_port', config.serverPort);
            this.$assign('panel_port', config.panelPort);
            // 获取日志级别配置，传给前端动态生成筛选项
            this.$assign('log_levels', this.$config.log.log_level);
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
        let ext_data = null;
        const oldTls = config.tls;
        const oldPanelTls = config.panelTls;
        const oldServerPort = config.serverPort;
        const oldPanelPort = config.panelPort;
        if(form == 'push_key') {
            const push_keys_json = this.$request.query('push_keys_json', '[]');
            let push_keys = [];
            try {
                push_keys = JSON.parse(push_keys_json);
            } catch(e) {
                return this.$error('push_key数据格式错误');
            }
            await this.$libs.setting.save({push_keys});
        } else if(form == 'panel') {
            // 面板设置：端口 + 证书
            const panel_port = parseInt(this.$request.query('panel_port', '3010'));
            const panel_tls = this.$request.query('panel_tls', 'none');

            if(isNaN(panel_port) || panel_port < 1 || panel_port > 65535) {
                return this.$error('端口号必须为1-65535之间的数字！');
            }

            // 验证证书是否存在
            if(panel_tls != 'none' && (!this.$libs.tls.existsKey() || !this.$libs.tls.existsCert())) {
                return this.$error('证书不存在，请先生成自签名证书');
            }

            await this.$libs.setting.save({panel_port, panel_tls});

            if(panel_port != oldPanelPort || panel_tls != oldPanelTls) {
                ext_msg = '面板将自动重启以应用新设置';
                ext_data = {panel_port, panel_tls};
                setTimeout(() => {
                    this.ctx.app.emit('PANEL_RESTART');
                }, 500);
            }
        } else if(form == 'server') {
            // 服务设置：端口 + 证书
            const server_port = parseInt(this.$request.query('server_port', '3100'));
            const tls = this.$request.query('tls', 'none');

            if(isNaN(server_port) || server_port < 1 || server_port > 65535) {
                return this.$error('端口号必须为1-65535之间的数字！');
            }

            // 验证证书是否存在
            if(tls != 'none' && (!this.$libs.tls.existsKey() || !this.$libs.tls.existsCert())) {
                return this.$error(tls == 'public' ? '证书不存在' : '请先生成自签名证书');
            }

            await this.$libs.setting.save({server_port, tls});

            if(server_port != oldServerPort || tls != oldTls) {
                ext_msg = '服务将自动重启以应用新设置';
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

        this.$success('保存成功！' + ext_msg, ext_data);
    }
}

module.exports = Setting;
