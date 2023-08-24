FROM --platform=linux/amd64 node:20-alpine
WORKDIR /usr/src/app

COPY *.ts .
COPY *.json .
COPY types .
COPY db .

RUN npm install
RUN npm run build

CMD [ "npm", "start" ]
