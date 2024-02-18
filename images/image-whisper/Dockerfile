FROM node

#RUN apk update
#RUN apk upgrade
#RUN apk add --no-cache ffmpeg

RUN apt-get -y update && apt-get -y upgrade && apt-get install -y --no-install-recommends ffmpeg


WORKDIR /golem/work
COPY package.json index.js ./

#COPY node_modules ./node_modules
RUN npm install

RUN ./node_modules/whisper-node/lib/whisper.cpp/models/download-ggml-model.sh base.en
RUN cd ./node_modules/whisper-node/lib/whisper.cpp && make


VOLUME /golem/work/input
VOLUME /golem/work/output
COPY ./input ./input


ENTRYPOINT ["npm", "start"]