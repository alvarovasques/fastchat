FROM node:20-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

COPY frontend/package*.json ./
COPY frontend/yarn.lock ./

RUN yarn install

COPY frontend/ .

RUN rm -f .env 

ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

ARG REACT_APP_HOURS_CLOSE_TICKETS_AUTO
ENV REACT_APP_HOURS_CLOSE_TICKETS_AUTO=$REACT_APP_HOURS_CLOSE_TICKETS_AUTO

ARG STACK_NAME
ENV STACK_NAME=$STACK_NAME

RUN mkdir -p ./brands
COPY brands ./brands

COPY frontend/copy_brand_assets.sh ./
RUN chmod +x copy_brand_assets.sh
RUN ./copy_brand_assets.sh

RUN rm -rf ./brands

# Build the application
RUN yarn build

EXPOSE 3001

ENV HOST=0.0.0.0
ENV PORT=3001

# Serve the built application
CMD ["serve", "-s", "build", "-l", "3001"] 