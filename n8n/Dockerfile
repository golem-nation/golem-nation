FROM docker.n8n.io/n8nio/n8n

ARG PRIVATE_KEY

USER 0
RUN apk add wget && apk add jq

WORKDIR /home/yagna
ADD keyToJson ./keyToJson
COPY "./as-requestor.sh" "./as-requestor.sh"
COPY "./entrypoint.sh" "./entrypoint.sh"

RUN sh as-requestor.sh; exit 0
RUN echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.profile
ENV PATH="$HOME/.local/bin:$PATH"

WORKDIR /home/yagna/keyToJson
RUN npm install && npm run keyToJson -- ${PRIVATE_KEY} asd

WORKDIR /home/yagna
RUN cp "./keyToJson/key.json" "./key.json"

WORKDIR /home/nodes
COPY './nodes' '.'
RUN npm run build
RUN npm link

WORKDIR /root/.n8n/custom
RUN npm link n8n-nodes-golem

WORKDIR /home/yagna

RUN chmod 755 /home/yagna/entrypoint.sh
ENTRYPOINT ["/home/yagna/entrypoint.sh"]
