FROM node:10.15.0
WORKDIR /usr/src/app
COPY . .
RUN yarn install
EXPOSE 8081
CMD ["yarn", "start"]