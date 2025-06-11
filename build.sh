docker rm -f $(docker ps -a --filter name=pushme --format="{{.ID}}")
echo "已删除pushme旧容器"
docker image rm -f pushme 
echo "已删除pushme旧镜像"
docker build -t pushme .
echo "已构建pushme新镜像"
chmod +x startup.sh
echo "已赋予执行权限"
./startup.sh
echo "已启动pushme新容器"