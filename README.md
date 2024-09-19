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

v1.2.0部署脚本：https://hub.docker.com/r/yafoo/pushme-server
```bash
docker run -dit -p 3010:3010 -p 3100:3100 -v $PWD/pushme-server/config:/pushme-server/config --name pushme-server --restart unless-stopped yafoo/pushme-server:latest
```

v1.3.0开始不再提供docker镜像，请使用如下命令，拉取一个node(>=18)镜像，然后执行脚本部署。

```bash
# 拉取并运行node镜像，要求node>=18
docker run -dit -p 3010:3010 -p 3100:3100 -v $PWD/pushme-server/config:/pushme-server/config --name pushme-server --restart unless-stopped node:18.20.4-alpine3.20
# 进入容器环境
docker exec -it pushme-server sh
# 切换跟目录
cd /
# 下载源码
wget https://github.com/yafoo/pushme-server/archive/refs/tags/v1.5.0.tar.gz
# 解压并复制到项目目录
tar -zxvf v1.5.0.tar.gz
cp -r pushme-server-1.5.0/* pushme-server/
# 进入项目目录
cd pushme-server
# 安装依赖
npm i --registry=https://registry.npmmirror.com
# 安装pm2
npm i pm2 -g --registry=https://registry.npmmirror.com
# 启动服务
pm2 start server.js --name pushme-server
# 保存配置
pm2 save
# 设置开机启动
pm2 startup #如果此步报错，项目就没办法开机自启动。每次容器重启后，请进入容器`docker exec -it pushme-server sh`，手动再执行启动服务命令`pm2 start server.js --name pushme-server`
# 退出容器
exit
```

#### 二、源码安装

环境要求：nodejs>=18

在程序根目录执行命令：

```bash
npm i
node ./server.js
```

#### 系统初始化

假如你的服务器IP为`0.0.0.0`，则：
- 访问`http://0.0.0.0:3010`，按提示安装，安装后进入首页，可以在线测试消息发送功能。
- 0.0.0.0:3100：为消息服务器，在PushMe安卓客户端，设置自建服务，host填写`0.0.0.0`，端口填写`3100`，保存即可。
- ws://0.0.0.0:3010：为Websocket消息服务地址，在PushMeClient电脑客户端，设置自建服务开启，IP或域名填写`0.0.0.0`，端口填写`3010`，push_key填写您的`push_key`，保存并重启即可。

### 接口地址

消息接口地址为：http://您服务器:3010，参数与官网保持一致，暂不支持temp_key。

### 端口更改、域名绑定

如果您想使用其他端口，请在`server.js`文件内修改，同时您也可以通过nginx绑定自己的域名（绑定后，消息端口可能变为80），通过域名访问。

### 二次开发

如果您需要二次开发，请参考[jj.js](https://github.com/yafoo/jj.js) 开发框架，开发时注意打开调试模式，在`config/app.js`里设置`app_debug`为`true`，上线时记得关闭调试模式。
