FROM --platform=linux/amd64 node:16-alpine
WORKDIR /usr/src/app

COPY package*.json ./
COPY *.ts .
COPY *.js .
COPY types .
COPY *.json .
COPY db .

RUN npm install
RUN npm run build


ARG SUPERTOKENS_CORE_URI
ARG SUPERTOKENS_API_KEY
ARG SMTP_HOST
ARG SMTP_USER
ARG SMTP_PASS
ARG SMTP_PORT
ARG SMTP_FROM_NAME
ARG SMTP_FROM_EMAIL
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG GITHUB_CLIENT_ID
ARG GITHUB_CLIENT_SECRET
ARG APP_URL
ARG APP_NAME
ARG HASURA_ADMIN_SECRET
ARG DATABASE_URL
ARG DATABASE_MAX_CONNECTIONS


ARG SUPERTOKENS_CORE_URI=$SUPERTOKENS_CORE_URI
ARG SUPERTOKENS_API_KEY=$SUPERTOKENS_API_KEY
ARG SMTP_HOST=$SMTP_HOST
ARG SMTP_USER=$SMTP_USER
ARG SMTP_PASS=$SMTP_PASS
ARG SMTP_PORT=$SMTP_PORT
ARG SMTP_FROM_NAME=$SMTP_FROM_NAME
ARG SMTP_FROM_EMAIL=$SMTP_FROM_EMAIL
ARG GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
ARG GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID
ARG GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET
ARG APP_URL=$APP_URL
ARG APP_NAME=$APP_NAME
ARG HASURA_ADMIN_SECRET=$HASURA_ADMIN_SECRET
ARG DATABASE_URL=$DATABASE_URL
ARG DATABASE_MAX_CONNECTIONS=$DATABASE_MAX_CONNECTIONS

EXPOSE 9000
CMD [ "npm", "start" ]
