# PushMeServer
PushMeServer是基于nodejs开发的消息服务器，支持安装、登录、管理push_key的功能，环境要求nodejs版本>=14。

### 仓库地址

Github：https://github.com/yafoo/pushme-server

Gitee：https://gitee.com/yafu/pushme-server

### 服务地址

程序运行，需要两个端口3100和3010，加入你的服务器公网IP为0.0.0.0，则：
1. 0.0.0.0:3100，为消息服务器，在PushMe安卓客户端，设置自建服务，host填写0.0.0.0，端口填写3100，保存即可。
2. 0.0.0.0:3010，为Web及接口服务器，首次访问http://0.0.0.0:3010，会提示安装，安装后进入首页，可以测试消息发送功能。

### 接口地址

消息接口地址为：http://您服务器:3010

### 端口更改、域名绑定

如果您想使用其他端口，请在server.js文件内修改，同时您也可以通过nginx绑定自己的域名，通过域名访问。

### 二次开发

如果您需要二次开发，请参考jj.js开发框架，开发时注意打开调试模式，在config/app.js里设置app_debug为true，上线时记得关闭调试模式。