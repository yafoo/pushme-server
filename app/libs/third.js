const {Context} = require('jj.js');

class Third extends Context
{
    data() {
        const third_data = {
            title: '',
            content: '',
            type: ''
        };
        
        const msg_type = this.$request.query('msg_type'); // 飞书
        const msgtype = this.$request.query('msgtype'); // 企业微信/钉钉群机器人
        if(msg_type) {
            return this.feishu(msg_type, third_data);
        } else if(msgtype) {
            return this.weiding(msgtype, third_data);
        } else {
            return third_data;
        }
    }

    // 飞书机器人 请求{msg_type: 'text', content: {text}} 响应{StatusCode: 0, msg}
    feishu(msg_type, third_data={}) {
        const content = this.$request.query('content');

        // 文本
        if(msg_type == 'text') {
            third_data.content = content.text || '';
            return third_data;
        }

        // 富文本
        if(msg_type == 'post') {
            const post = content.post && content.post.zh_cn || content.post && content.post.en_us || {};
            third_data.title = post.title || '';
            post.content && post.content.forEach(item => {
                if(item.tag == 'text') {
                    third_data.content += `${item.text}\n`;
                } else if(item.tag == 'a') {
                    third_data.content += `[${item.text}](${item.href})\n`;
                } else if(item.tag == 'at') {
                    third_data.content += `@${item.user_id}\n`;
                } else if(item.tag == 'img') {
                    third_data.content += `图片，image_key：${item.image_key}\n`;
                }
            });
            third_data.type = 'markdown';
            return third_data;
        }

        // 群名片
        if(msg_type == 'share_chat') {
            third_data.content = '群名片，share_chat_id：' + content.share_chat_id;
            return third_data;
        }

        // 图片
        if(msg_type == 'image') {
            third_data.content = '图片，image_key：$' + content.image_key;
            return third_data;
        }

        // 消息卡片
        if(msg_type == 'interactive') {
            const card = content.card || {};
            third_data.title = card.header && card.header.title || '';

            card.elements.forEach(item => {
                if(item.tag == 'div') {
                    third_data.content += `${item.text.content}\n`;
                } else if(item.tag == 'action') {
                    item.actions.forEach(it => {
                        if(it.tag == 'button') {
                            third_data.content += `[${it.text.content}](${it.url})\n`;
                        } else if(it.tag == 'hr') {
                            third_data.content += `---------------------\n`;
                        } else if(it.tag == 'img') {
                            third_data.content += `图片，image_key：${it.img_key}\n`;
                        } else if(it.tag == 'markdown') {
                            third_data.content += `${it.content}\n`;
                        } else if(it.tag == 'note') {
                            third_data.content += `备注：\n`;
                            it.elements.forEach(i => {
                                third_data.content += `${i.content}\n`;
                            });
                        }
                    });
                }
            });
            third_data.type = 'markdown';
            return third_data;
        }

        return third_data;
    }

    // 企业微信/钉钉群机器人 请求{msgtype: 'text', content: {text}} 响应{errcode: 0, errmsg}
    weiding(msgtype, third_data={}) {
        third_data.type = 'markdown';
        const params = this.$request.post(msgtype, {});

        //微信|钉钉
        if(msgtype == 'text') {
            third_data.content = params.content || '';
            third_data.type = 'text';
            return third_data;
        }

        //微信|钉钉
        if(msgtype == 'markdown') {
            if(params.content) {
                third_data.content = params.content || '';
            } else {
                third_data.title = params.title || '';
                third_data.content = params.text || '';
            }
            return third_data;
        }

        //微信
        if(msgtype == 'image') {
            third_data.content = '暂不支持base64图片';
            return third_data;
        }
        //微信
        if(msgtype == 'news') {
            params.articles.forEach(item => {
                third_data.content += `## ${item.title}\n${item.description}\n![](${item.picurl})\n[阅读原文](${item.url})\n\n`;
            });
            return third_data;
        }
        //微信
        else if(msgtype == 'file') {
            third_data.content = '文件media_id：' + params.media_id;
        }
        //微信
        if(msgtype == 'template_card') {
            third_data.content = '暂不支持模板卡片消息';
            return third_data;
        }

        //钉钉
        if(msgtype == 'link') {
            third_data.title = params.title || '';
            third_data.content = `${params.text}\n![](${params.picUrl})\n[阅读原文](${params.messageUrl})`;
            return third_data;
        }
        //钉钉
        if(msgtype == 'actionCard') {
            third_data.title = params.title || '';
            third_data.content = `${params.text}`;
            if(params.singleURL) {
                third_data.content += `\n[${params.singleTitle}](${params.singleURL})`
            } else {
                params.btns.forEach(item => {
                    third_data.content += `\n[${item.title}](${item.actionURL})`;
                });
            }
            return third_data;
        }
        //钉钉
        if(msgtype == 'feedCard') {
            params.links.forEach(item => {
                third_data.content += `## ${item.title}\n![](${item.picURL})\n[阅读原文](${item.messageURL})\n\n`;
            });
            return third_data;
        }

        third_data.type = '';
        return third_data;
    }
}

module.exports = Third;