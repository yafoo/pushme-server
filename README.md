# PushMeServer
PushMeServer是基于nodejs开发的[PushMe](https://push.i-i.me/)APP和PushMeClient自建消息服务器，支持登录、管理push_key的功能，支持在线测试接口。

消息接口参数与官方接口保持一致（暂不支持temp_key）。

### 仓库地址

Github：https://github.com/yafoo/pushme-server

Gitee：https://gitee.com/yafu/pushme-server

### 系统部署

#### 环境要求

nodejs>=18

#### 端口要求

`3100`和`3010`

- 3100：为消息服务端口，需开放，给PushMe APP手机客户端使用

- 3010：为Web管理、消息发送API及Websocket服务端口，给管理员使用和给PushMe Client电脑客户端使用，可以根据情况选择此端口是否开放

#### 一、Docker部署（脚本）

仓库地址：https://hub.docker.com/r/yafoo/pushme-server
```bash
docker run -dit -p 3010:3010 -p 3100:3100 -e TZ=Asia/Shanghai -v $PWD/pushme-server/config:/pushme-server/config --name pushme-server --restart unless-stopped yafoo/pushme-server:latest
```

#### 二、源码安装

环境要求：nodejs>=18

在程序根目录执行命令：

```bash
npm i
node ./server.js
```

#### 系统初始化

假如你的服务器IP为`0.0.0.0` (IPv6为`::`)，则：
- 访问`http://0.0.0.0:3010` (IPv6:`http://[::]:3010`)，按提示安装，安装后进入首页，可以在线测试消息发送功能。
- 0.0.0.0:3100：为消息服务器，在PushMe安卓客户端，设置自建服务，host填写`0.0.0.0` (IPv6:`[::]`)，端口填写`3100`，保存即可。
- ws://0.0.0.0:3010 (IPv6:`ws://[::]:3010`)：为Websocket消息服务地址，在PushMeClient电脑客户端，设置自建服务开启，IP或域名填写`0.0.0.0` (IPv6:`[::]`)，端口填写`3010`，push_key填写您的`push_key`，保存并重启即可。

### 接口地址

消息接口地址为：http://您服务器:3010 (IPv6:[http://[::]:3010](http://[::]:3010))，参数与官网保持一致，暂不支持temp_key。

### 端口更改、域名绑定

如果您想使用其他端口，请在`server.js`文件内修改，同时您也可以通过nginx绑定自己的域名（绑定后，消息端口可能变为80），通过域名访问。[点击查看域名绑定教程](https://me.i-i.me/article/76.html)

### 二次开发

如果您需要二次开发，请参考[jj.js](https://github.com/yafoo/jj.js) 开发框架，开发时注意打开调试模式，在`config/app.js`里设置`app_debug`为`true`，上线时记得关闭调试模式。
