FROM node:10.15.0
WORKDIR /usr/src/app
COPY package.json ./
COPY yarn.lock ./
RUN yarn install
COPY . .
EXPOSE 8081
CMD ["yarn", "start"]