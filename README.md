# PushMe Server

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

PushMe Server 是一个基于 Node.js 开发的自建消息推送服务器,为 [PushMe](https://push.i-i.me/) APP 和 PushMeClient 提供私有化部署方案。

## ✨ 特性

- 🔐 **数据隐私**: 完全自主可控的消息服务,保障数据安全
- 🎯 **接口兼容**: 消息接口参数与官方保持一致(暂不支持 temp_key)
- 🖥️ **可视化管理**: 提供 Web 管理界面,支持 push_key 管理和在线测试
- 📡 **多协议支持**: 同时支持 HTTP/HTTPS API 和 MQTT/WebSocket 消息服务
- 🐳 **容器化部署**: 支持 Docker 快速部署

## 📦 系统要求

- **Node.js**: >= 18.0
- **端口占用**: 
  - `3010` - Web 管理及 API 接口
  - `3100` - MQTT/WebSocket 消息服务

## 🚀 快速开始

### 方式一:Docker 部署(推荐)

```bash
docker run -dit \
  -p 3010:3010 \
  -p 3100:3100 \
  -e TZ=Asia/Shanghai \
  -v $PWD/pushme-server/config:/pushme-server/config \
  --name pushme-server \
  --restart unless-stopped \
  yafoo/pushme-server:latest
```

**说明:**
- `-v` 参数将配置文件挂载到宿主机,方便持久化和修改
- `--restart unless-stopped` 确保容器异常退出后自动重启

### 方式二:源码部署

```bash
# 1. 克隆仓库
git clone https://github.com/yafoo/pushme-server.git
cd pushme-server

# 2. 安装依赖
npm i

# 3. 启动服务
node ./server.js
```

## ⚙️ 配置指南

### 首次使用

1. 启动服务后,访问 `http://您的服务器IP:3010`
2. 完成初始化配置
3. 设置 push_key(推送密钥)

### 客户端配置

在 PushMe 安卓或 Windows 客户端中:
- **Host**: 填写服务器 IP(如 `0.0.0.0`)
- **Port**: 填写 `3100`
- 保存配置即可使用

### 消息接口

- **接口地址**: `http://您的服务器IP:3010` (支持 IPv6)
- **请求参数**: 与[官方接口](https://push.i-i.me/)保持一致
- **注意事项**: 暂不支持 temp_key 临时密钥功能

## 🔧 高级配置

### 修改端口

如需更改默认端口,请编辑 [`server.js`](server.js) 文件中的端口配置。

### 域名绑定

生产环境建议通过 Nginx 反向代理绑定域名:

1. 配置 Nginx 反向代理到 `localhost:3010`
2. 配置 SSL 证书启用 HTTPS
3. 消息端口可能变为 80/443

📖 [查看详细域名绑定教程](https://me.i-i.me/article/76.html)

### 调试模式

二次开发时,请在 [`config/app.js`](config/app.js) 中设置:

```javascript
app_debug: true
```

⚠️ **重要**: 上线前务必关闭调试模式!

## 📁 项目结构

```
pushme-server/
├── app/                    # 应用核心代码
│   ├── controller/        # 控制器层
│   │   ├── admin.js      # 后台管理
│   │   ├── login.js      # 用户认证
│   │   ├── server.js     # 消息服务
│   │   └── setting.js    # 系统设置
│   ├── libs/             # 业务逻辑库
│   └── view/             # 视图模板
├── config/               # 配置文件
│   ├── app.js           # 应用配置
│   ├── log.js           # 日志配置
│   └── view.js          # 视图配置
├── public/              # 静态资源(Layui)
├── docker/              # Docker 相关文件
├── server.js            # 服务入口
└── package.json         # 项目依赖
```

## 🛠️ 技术栈

- **后端框架**: [jj.js](https://github.com/yafoo/jj.js) ^0.19.0
- **MQTT Broker**: [aedes](https://github.com/moscajs/aedes) ^0.51.3
- **WebSocket**: websocket-stream ^5.5.2
- **证书生成**: selfsigned ^4.0.0
- **前端 UI**: Layui

## 📝 开发指南

本项目基于 [jj.js](https://github.com/yafoo/jj.js) 轻量级框架开发,如需二次开发请参考其文档。

## 🔗 相关链接

- **GitHub**: https://github.com/yafoo/pushme-server
- **Gitee**: https://gitee.com/yafu/pushme-server
- **Docker Hub**: https://hub.docker.com/r/yafoo/pushme-server
- **PushMe 官网**: https://push.i-i.me/
- **pushme-server-golang**: https://github.com/0x01feng/pushme-server-golang （第三方实现的golang版本PushMeServer）

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

---

💡 **提示**: 如有问题或建议,欢迎在 GitHub Issues 中反馈。
