#!/bin/sh
export PATH="$HOME/.local/bin:$PATH"
yagna service run &
export NODE_ID=`yagna id create --from-keystore ./key.json --json | jq ".Ok.nodeId"`
#export NODE_ID=`yagna id show --json | jq ".Ok.nodeId"`
yagna id update --set-default $NODE_ID
yagna id unlock asd
export YAGNA_APPKEY=`yagna app-key create new-requestor`

n8n

