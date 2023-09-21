FROM --platform=linux/amd64 oven/bun
WORKDIR /usr/src/app

COPY *.ts .
COPY *.json .
COPY ./types ./types
COPY ./db ./db

RUN bun install

CMD [ "npm", "start" ]
