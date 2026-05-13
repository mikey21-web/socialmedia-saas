FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
RUN npx playwright install chromium --with-deps
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
