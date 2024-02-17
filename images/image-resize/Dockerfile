FROM node:alpine
WORKDIR /golem/work

COPY package.json index.js ./
RUN npm install

VOLUME /golem/work/input
VOLUME /golem/work/output