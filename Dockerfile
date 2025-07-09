FROM node:20-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    fontconfig fonts-dejavu-core && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .
RUN npm install && npm run build

CMD ["npm", "run", "bot"]