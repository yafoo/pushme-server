docker run -dit -p 3010:3010 -p 3100:3100 -e TZ=Asia/Shanghai -v $PWD/pushme-server/config:/pushme-server/config --name pushme-server --restart unless-stopped pushme
