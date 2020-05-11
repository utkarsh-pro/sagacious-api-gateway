FROM node:12.16.2-alpine

WORKDIR /app

COPY ./package.json ./package.json

RUN npm install --only=production

COPY . .

RUN npm run build

CMD ["npm", "start"]