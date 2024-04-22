# PushMeServer
PushMeServer是基于nodejs开发的[PushMe](https://push.i-i.me/) APP消息服务器，支持安装、登录、管理push_key的功能，环境要求nodejs版本>=16。

### 仓库地址

Github：https://github.com/yafoo/pushme-server

Gitee：https://gitee.com/yafu/pushme-server

### 系统安装

#### 一、Docker部署

```bash
docker run -dit -p 3010:3010 -p 3100:3100 -v $PWD/pushme-server/config:/pushme-server/config --name pushme-server --restart unless-stopped yafoo/pushme-server:latest
```
> 注意：镜像内没有打包node_moudules目录，容器首次启动时会自动安装依赖，所以启动速度没那么快。

#### 二、源码安装

环境要求：nodejs>=16

端口要求：`3100`和`3010`

在程序根目录执行命令：

```bash
npm i
node ./server.js
```

#### 系统初始化

假如你的服务器IP为`0.0.0.0`，则：
- 0.0.0.0:3100：为消息服务器，在PushMe安卓客户端，设置自建服务，host填写`0.0.0.0`，端口填写`3100`，保存即可。
- 0.0.0.0:3010：为Web管理及接口服务器，首次访问`http://0.0.0.0:3010`，会提示安装，安装后进入首页，可以在线测试消息发送功能。

### 接口地址

消息接口地址为：http://您服务器:3010

### 端口更改、域名绑定

如果您想使用其他端口，请在`server.js`文件内修改，同时您也可以通过nginx绑定自己的域名，通过域名访问。

### 二次开发

如果您需要二次开发，请参考[jj.js](https://github.com/yafoo/jj.js) 开发框架，开发时注意打开调试模式，在`config/app.js`里设置`app_debug`为`true`，上线时记得关闭调试模式。