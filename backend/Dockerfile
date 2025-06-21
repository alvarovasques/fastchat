FROM node:20-alpine

WORKDIR /app

# Install git, ssh and other dependencies
RUN apk add --no-cache git openssh-client netcat-openbsd

# Remove package-lock.json to avoid conflicts with yarn
RUN rm -f package-lock.json

COPY backend/package*.json ./
COPY backend/yarn.lock ./

# Configure git to use HTTPS instead of SSH
RUN git config --global url."https://".insteadOf ssh://

RUN yarn install

COPY backend/ .

COPY certificates ./certs-temp

COPY backend/copy_cert_assets.sh ./
RUN chmod +x copy_cert_assets.sh

ARG STACK_NAME
ENV STACK_NAME=$STACK_NAME

RUN ./copy_cert_assets.sh

RUN rm -rf ./certs-temp

RUN yarn build

EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000

# Make the entrypoint script executable
COPY backend/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

CMD ["/app/docker-entrypoint.sh"] 