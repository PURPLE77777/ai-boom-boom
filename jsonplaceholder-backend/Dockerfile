FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run prisma:generate
RUN npm run build

RUN ls -la dist/src/main.js || ls -la dist/main.js

EXPOSE 3000

CMD ["node", "dist/src/main.js"] 