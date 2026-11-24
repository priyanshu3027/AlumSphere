FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# The upload middleware creates uploads/* at startup, so the app user must own /app.
RUN mkdir -p uploads && chown -R node:node /app
USER node

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]
