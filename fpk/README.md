# PushMe Server - 飞牛 fnOS 应用

自建消息推送服务器，支持 MQTT/WebSocket 协议，提供可视化管理界面，接口完全兼容官方 PushMe APP。

## 功能特性

- 🔐 **数据隐私**：完全自主可控的消息服务，保障数据安全
- 🎯 **接口兼容**：消息接口参数与官方完全一致
- 🖥️ **可视化管理**：Web 管理界面，支持 PushKey 管理、系统日志查看
- 📡 **多协议支持**：HTTP/HTTPS API + MQTT/WebSocket 消息服务
- 🔧 **灵活配置**：Web 界面配置端口、证书，无需编辑文件
- 📊 **实时监控**：显示面板和服务运行状态
- 📝 **系统日志**：实时日志查看，支持级别筛选

## 端口说明

| 端口 | 用途 |
|------|------|
| 3010 | Web 管理面板和 API 接口 |
| 3100 | MQTT/WebSocket/TCP 消息服务 |

## 安装方法

1. 将 `pushme-server.fpk` 文件传输到飞牛 fnOS 设备
2. 打开飞牛应用中心
3. 选择"本地安装"
4. 选择该 `.fpk` 文件进行安装
5. 等待安装完成，应用将自动启动

## 首次使用

1. 访问管理界面：`http://飞牛IP:3010`
2. 设置管理员账号和密码
3. 进入 PushKey 管理页面，创建推送密钥
4. 在 PushMe APP 中配置服务器地址和端口

## 客户端配置

在 PushMe APP（安卓/Windows）中：

- **Host**：填写飞牛 NAS 的 IP 地址（如 `192.168.1.100`）
- **Port**：填写 `3100`
- 保存配置即可使用

## 消息推送示例

```bash
# 使用 push_key 推送
curl -d "push_key=YOUR_KEY&title=测试&content=消息内容" http://飞牛IP:3010

# 使用 temp_key 推送
curl -d "temp_key=YOUR_TEMP_KEY&title=测试&content=消息内容" http://飞牛IP:3010
```

## 支持的消息类型

- `text` - 纯文本消息
- `markdown` - Markdown 格式消息
- `html` - HTML 格式消息
- `url` - URL 消息
- `data` - 数据消息
- `markdata` - Markdown 数据消息
- `note` - 笔记/任务列表消息
- `svg` - SVG 图片消息
- `chart` - 图表消息
- `echarts` - ECharts 图表消息

## 数据存储位置

应用数据保存在：`/vol1/.apps/pushme-server/var/config`

包含以下文件：
- `data.json` - 系统配置和状态数据
- `app.js` - 应用配置
- `log.js` - 日志配置
- `view.js` - 视图配置
- `certs/` - SSL 证书文件

## 常见问题

### 1. 应用无法启动

检查 Docker 是否正常运行，以及镜像是否成功拉取。可以在飞牛的 Docker 管理界面查看容器日志。

### 2. 无法访问管理界面

- 确认应用已启动（在应用中心查看运行状态）
- 检查端口 3010 是否被其他应用占用
- 尝试访问 `http://飞牛IP:3010`（确保使用正确的 IP 地址）

### 3. 消息推送失败

- 确认 PushKey 已正确配置
- 检查客户端配置的端口是否为 3100
- 查看系统日志排查错误

### 4. 如何备份配置

将 `/vol1/.apps/pushme-server/var/config` 目录备份即可。

### 5. 如何更新应用

在应用中心下载新版本的 `.fpk` 文件，重新安装即可。配置数据会自动保留。

## 相关链接

- 项目主页：https://github.com/yafoo/pushme-server
- PushMe 官网：https://push.i-i.me/
- 飞牛 fnOS：https://fnnas.com/

## 技术支持

如有问题，请通过以下方式反馈：
- GitHub Issues：https://github.com/yafoo/pushme-server/issues
