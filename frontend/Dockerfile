FROM node:20-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

COPY package*.json ./
COPY yarn.lock ./

RUN yarn install

COPY . .

RUN rm -f .env 

ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

ARG REACT_APP_HOURS_CLOSE_TICKETS_AUTO
ENV REACT_APP_HOURS_CLOSE_TICKETS_AUTO=$REACT_APP_HOURS_CLOSE_TICKETS_AUTO

# Build the application
RUN yarn build

EXPOSE 3001

ENV HOST=0.0.0.0
ENV PORT=3001

# Serve the built application
CMD ["serve", "-s", "build", "-l", "3001"] 