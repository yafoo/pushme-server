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

        // push_key不能为空
        if(!push_key) {
            return this.$show('Push failed, empty push_key!');
        }
        // title、content至少填写一项
        if(title === '' && content === '') {
            return this.$show('Push failed, empty title and content!');
        }

        // push_key验证
        if(!this.$config.setting.push_keys.includes(push_key)) {
            this.$logger.error(`非法push_key ${push_key}`);
            return this.$show('非法push_key!');
        }

        const date = this.$request.query('date', undefined);
        if(typeof push_key == 'object' || typeof title == 'object' || typeof content == 'object') {
            return this.$show('Push failed, the parameter format is incorrect!');
        }

        const msg = {title, content, date};
        if(type == 'markdown' || type == 'data' || type == 'markdata') {
            msg.type = type;
        }
        let result = await this.ctx.publish(push_key, msg);

        if(third_data.title || third_data.content) {
            const state = result == 'success' ? 0 : 1;
            result = {errcode: state, errmsg: result, code: state, msg: result};
        }

        this.$show(result);
    }
}

module.exports = Index;