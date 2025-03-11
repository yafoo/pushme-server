const Base = require('./base.js');

class Index extends Base
{
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
            if(!this.$config.setting) {
                return this.$redirect('setting/install');
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

        const date = this.$request.query('date', undefined);
        if(typeof push_key == 'object' || typeof title == 'object' || typeof content == 'object') {
            return this.$show('Push failed, the parameter format is incorrect!');
        }

        const msg = {title, content, date};
        if(~['text', 'markdown', 'html', 'data', 'markdata', 'chart', 'echarts'].indexOf(type)) {
            msg.type = type;
        } else {
            msg.type = 'text';
        }

        let result = 'success';
        if(!~push_key.indexOf(',')) {
            result = await this.ctx.publish(push_key, msg);
        } else {
            const push_keys = push_key.split(',');
            for(let i = 0; i < push_keys.length; i++) {
                push_keys[i] && this.ctx.publish(push_keys[i], msg);
            }
        }

        if(third_data.title || third_data.content) {
            const state = result == 'success' ? 0 : 1;
            return this.$show({errcode: state, errmsg: result, code: state, msg: result});
        }

        this.$show(result);
    }

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

    _check_key(push_key = '') {
        if(!push_key) {
            return '';
        }

        if(!this.$config.setting.push_keys.includes(push_key)) {
            this.$logger.error(`非法push_key ${push_key}`);
            return '非法push_key!';
        }
    }
}

module.exports = Index;