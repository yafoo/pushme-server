const Base = require('./base.js');

/**
 * 首页控制器
 * @description 处理消息推送请求和WEB首页展示
 * @extends Base
 */
class Index extends Base
{
    /**
     * 消息推送入口
     * @description 支持单key/多key推送，兼容飞书/企微/钉钉消息格式
     * @returns {Promise<import('jj.js/types').EXIT|void>}
     */
    async index() {
        let push_key = this.$request.query('push_key');
        let title = this.$request.query('title');
        let content = this.$request.query('content');
        let type = this.$request.query('type');

        // 兼容企微、钉钉、飞书
        const third_data = this.$libs.third.data();
        if(third_data.title) {
            title = third_data.title;
        }
        if(third_data.content) {
            content = third_data.content;
        }
        if(third_data.type == 'markdown') {
            type = 'markdown';
        }

        // WEB首页或安装
        if(!push_key && !title && !content) {
            if(!this._isInstall()) {
                return this.$redirect('login/install');
            } else {
                this.$assign('cur_nav', '/');
                return await this.$fetch();
            }
        }

        // push_key验证
        const error = this._check_keys(push_key);
        if(error) {
            return this.$show(error);
        }
        // title、content至少填写一项
        if(title === '' && content === '') {
            return this.$show('Push failed, empty title and content!');
        }
        if(typeof push_key == 'object' || typeof title == 'object' || typeof content == 'object') {
            return this.$show('Push failed, the parameter format is incorrect!');
        }

        /** @type {string|undefined} 自定义日期 */
        const date = this.$request.query('date', undefined);

        /** @type {{title: string, content: string, date: string|undefined, type: string}} */
        const msg = {title, content, date, type};

        let result = 'success';
        if(!~push_key.indexOf(',')) {
            result = await this.ctx.pushme.publish(push_key, msg);
        } else {
            const push_keys = push_key.split(',');
            for(let i = 0; i < push_keys.length; i++) {
                push_keys[i] && this.ctx.pushme.publish(push_keys[i], msg);
            }
        }

        // 返回第三方格式
        if(third_data.title || third_data.content) {
            const state = result == 'success' ? 0 : 1;
            return this.$show({errcode: state, errmsg: result, code: state, msg: result});
        }

        this.$show(result);
    }

    /**
     * 批量校验push_key列表
     * @param {string} [push_key=""] - 逗号分隔的push_key字符串
     * @returns {string} 错误信息，空字符串表示通过
     */
    _check_keys(push_key = "") {
        if(!push_key) {
            return "Push failed, empty push_key!";
        }

        if(typeof push_key != 'string') {
            return "Push failed, push_key type must be string!";
        }
        
        if(!~push_key.indexOf(',')) {
            return this._check_key(push_key);
        }

        const push_keys = push_key.split(',');
        if(push_keys.length > 100) {
            return "Push failed, push_key numbers must be less than 100!";
        }
        let error = "";
        for(let i = 0; i < push_keys.length; i++) {
            error = this._check_key(push_keys[i]);
            if(error) {
                break;
            }
        }
        return error;
    }

    /**
     * 校验单个push_key是否合法
     * @param {string} [push_key=''] - 待校验的push_key
     * @returns {string} 错误信息，空字符串或undefined表示通过
     */
    _check_key(push_key = '') {
        if(!push_key) {
            return '';
        }

        if(!this.$config.setting.push_keys.includes(push_key)) {
            this.$logger.error(`非法push_key ${push_key}`);
            return '非法push_key!';
        }
        return '';
    }
}

module.exports = Index;
