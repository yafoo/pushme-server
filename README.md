# PushMe Server

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.19-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

PushMe Server 是一个基于 Node.js 开发的自建消息推送服务器，为 [PushMe](https://push.i-i.me/) APP 和 PushMeClient 提供私有化部署方案。

## ✨ 特性

- 🔐 **数据隐私**: 完全自主可控的消息服务，保障数据安全
- 🎯 **接口兼容**: 消息接口参数与官方完全一致，支持 push_key 和 temp_key
- 🖥️ **可视化管理**: 提供 Web 管理界面，支持 push_key 管理、系统日志查看和在线测试
- 📡 **多协议支持**: 同时支持 HTTP/HTTPS API 和 MQTT/WebSocket 消息服务
- 🔧 **灵活配置**: 支持通过 Web 界面修改端口、证书等配置，无需编辑文件
- 📊 **实时监控**: 独立的系统信息面板，实时显示面板和服务运行状态
- 📝 **系统日志**: 实时日志查看功能，支持级别筛选和历史日志查看
- 🐳 **容器化部署**: 支持 Docker 快速部署

## 📦 系统要求

- **Node.js**: >= 20.19.0
- **端口占用**（默认值，可通过 Web 界面修改）:
  - `3010` - Web 管理及 API 接口
  - `3100` - MQTT/WebSocket 消息服务

## 🚀 快速开始

### 方式一：npx 一键部署（最简单）

```bash
# 创建项目
npx pushme-server init mypush

# 进入项目目录
cd mypush

# 启动服务
npm start
```

或者在当前目录初始化：

```bash
npx pushme-server init
npm start
```

启动后访问 `http://localhost:3010` 即可使用。

### 方式二：Docker 部署

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
- `-v` 参数将配置文件挂载到宿主机，方便持久化和修改
- `--restart unless-stopped` 确保容器异常退出后自动重启

### 方式三：源码部署

```bash
# 1. 克隆仓库
git clone https://github.com/yafoo/pushme-server.git
cd pushme-server

# 2. 安装依赖
npm i

# 3. 启动服务
npm start
```

## ⚙️ 配置指南

### 首次使用

1. 启动服务后，访问 `http://您的服务器IP:3010`
2. 完成初始化配置（设置管理员账号密码）
3. 在"PushKey"页面管理推送密钥（支持添加备注）

### 客户端配置

在 PushMe 安卓或 Windows 客户端中：
- **Host**: 填写服务器 IP（如 `192.168.1.100`）
- **Port**: 填写 `3100`
- 保存配置即可使用

### 消息接口

- **接口地址**: `http://您的服务器IP:3010`（支持 IPv6）
- **请求参数**: 与[官方接口](https://push.i-i.me/)完全一致
- **支持的密钥类型**:
  - `push_key`: 永久推送密钥
  - `temp_key`: 临时推送密钥（可在 PushKey 管理中配置）

**示例：**
```bash
# 使用 push_key
curl -d "push_key=YOUR_KEY&title=测试&content=消息内容" http://您的IP:3010

# 使用 temp_key
curl -d "temp_key=YOUR_TEMP_KEY&title=测试&content=消息内容" http://您的IP:3010
```

### 支持的消息类型

- `text`: 纯文本消息
- `markdown`: Markdown 格式消息
- `html`: HTML 格式消息
- `url`: URL 消息（点击打开链接）
- `data`: 数据消息（仅传递数据）
- `markdata`: Markdown 数据消息
- `note`: 笔记/任务列表消息
- `svg`: SVG 图片消息
- `chart`: 图表消息
- `echarts`: ECharts 图表消息

## 🔧 高级配置

### 端口配置

通过 Web 管理界面修改端口：
1. 进入"面板设置"或"服务设置"页面
2. 修改对应端口号
3. 保存后系统将自动重启

### 证书配置

系统支持自签名证书和公共证书：
1. 进入"面板设置"或"服务设置"页面
2. 选择证书类型
3. 如需自签名证书，点击"生成自签名证书"按钮
4. 输入域名（支持 IP 地址，多个域名换行分隔）
5. 系统自动生成证书并重启服务

### 域名绑定

生产环境建议通过 Nginx 反向代理绑定域名：

1. 配置 Nginx 反向代理到 `localhost:3010`
2. 配置 SSL 证书启用 HTTPS
3. 消息端口可能变为 80/443

📖 [查看详细域名绑定教程](https://me.i-i.me/article/76.html)

### 调试模式

二次开发时，请在 [`config/app.js`](config/app.js) 中设置：

```javascript
app_debug: true
```

⚠️ **重要**: 上线前务必关闭调试模式！

## 📁 项目结构

```
pushme-server/
├── app/                    # 应用核心代码
│   ├── controller/        # 控制器层
│   │   ├── admin.js      # 后台管理基类
│   │   ├── index.js      # 消息推送接口
│   │   ├── login.js      # 用户认证
│   │   ├── server.js     # 服务管理
│   │   ├── setting.js    # 系统设置
│   │   └── log.js        # 日志管理
│   ├── libs/             # 业务逻辑库
│   │   ├── setting.js    # 设置管理
│   │   ├── third.js      # 第三方平台适配
│   │   └── tls.js        # 证书管理
│   └── view/             # 视图模板
├── lib/                  # 核心库
│   ├── config.js         # 配置管理器（统一配置）
│   ├── log_buffer.js     # 日志缓冲区（内存环形缓冲）
│   ├── pushme_panel.js   # 面板服务（Web管理）
│   ├── pushme_proxy.js   # PushMe代理
│   └── pushme_server.js  # 推送服务（MQTT/WS/TCP）
├── config/               # 配置文件
│   ├── app.js           # 应用配置
│   ├── log.js           # 日志配置
│   ├── view.js          # 视图配置
│   └── data.json        # 系统数据（配置和状态）
├── public/              # 静态资源（Layui）
├── docker/              # Docker 相关文件
├── server.js            # 服务入口
└── package.json         # 项目依赖
```

## 🔄 配置迁移

从 v2.1.0 升级到新版本时，系统会自动执行配置迁移：
- 自动合并 `config/setting.js` 和 `config/data.json` 为统一的 `config/data.json`
- 保留所有原有配置
- 添加版本标识，支持后续迁移

## 🛠️ 技术栈

- **后端框架**: [jj.js](https://github.com/yafoo/jj.js) ^1.1.0
- **MQTT Broker**: [aedes](https://github.com/moscajs/aedes) ^1.1.1
- **WebSocket**: [ws](https://github.com/websockets/ws) ^8.21.3
- **证书生成**: selfsigned ^5.5.0
- **前端 UI**: Layui ^2.9.21

## 📝 开发指南

本项目基于 [jj.js](https://github.com/yafoo/jj.js) 轻量级框架开发，如需二次开发请参考其文档。

### 主要模块说明

- **PushmeServer**: 推送服务核心，负责 MQTT/WebSocket/TCP 协议处理
- **PushmePanel**: Web 面板服务，基于 jj.js 框架
- **PushmeProxy**: 代理层，提供统一的服务接口
- **ConfigManager**: 配置管理器，统一配置管理
- **LogBuffer**: 日志缓冲区，支持实时日志查看

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

💡 **提示**: 如有问题或建议，欢迎在 GitHub Issues 中反馈。
