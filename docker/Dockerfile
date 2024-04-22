FROM node:16.20.2-alpine3.17
ENV NODE_ENV=production

EXPOSE 3010 3100
VOLUME /config

WORKDIR /pushme-server
COPY . .
COPY config config.demo

CMD [ "sh", "docker/Run.sh" ]