FROM node:18.20.4-alpine3.20
ENV NODE_ENV=production
ENV TZ=Asia/Shanghai

EXPOSE 3010 3100
VOLUME /config

WORKDIR /pushme-server
COPY . .
COPY config config.demo

CMD [ "sh", "docker/Run.sh" ]