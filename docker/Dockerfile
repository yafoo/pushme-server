# syntax=docker/dockerfile:1

FROM node:20.19.6-alpine3.22
ENV NODE_ENV=production
ENV TZ=Asia/Shanghai

EXPOSE 3010
EXPOSE 3100
VOLUME /pushme-server/config

WORKDIR /pushme-server
COPY package.json package-lock.json ./
RUN NODE_OPTIONS="--max-old-space-size=1024" npm ci --omit=dev --no-audit --no-fund
COPY . .
COPY config config.demo

CMD [ "sh", "docker/Run.sh" ]