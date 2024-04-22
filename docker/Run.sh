#!/bin/bash
echo "配置文件"
[ ! -f config/app.js ] && cp config.demo/app.js config/app.js
[ ! -f config/log.js ] && cp config.demo/log.js config/log.js
[ ! -f config/view.js ] && cp config.demo/view.js config/view.js
if [ ! -d "node_modules" ]; then
  echo "安装依赖"
  npm i --registry=https://registry.npmmirror.com
else
  echo "依赖已安装"
fi
echo "启动服务"
node server.js