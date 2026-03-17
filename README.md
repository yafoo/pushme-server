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

程序运行，需要两个端口`3100`和`3010`，假如你的服务器公网IP为`0.0.0.0`，则：

- 3100：为消息服务端口，需开放。在PushMe安卓或windows客户端，设置自建服务，host填写0.0.0.0，端口填写3100，保存即可。

- 3010：为Web管理、消息发送API端口。

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

### 接口地址

首次部署后，需打开`http://您服务器IP:3010`进行初始化及push_key配置。

消息接口地址为：http://您服务器IP(支持IPv6):3010，参数与官网保持一致，暂不支持temp_key。

### 端口更改、域名绑定

如果您想使用其他端口，请在`server.js`文件内修改，同时您也可以通过nginx绑定自己的域名（绑定后，消息端口可能变为80），通过域名访问。[点击查看域名绑定教程](https://me.i-i.me/article/76.html)

### 二次开发

如果您需要二次开发，请参考[jj.js](https://github.com/yafoo/jj.js) 开发框架，开发时注意打开调试模式，在`config/app.js`里设置`app_debug`为`true`，上线时记得关闭调试模式。
