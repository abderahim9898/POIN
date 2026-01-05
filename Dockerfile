FROM node:22-bullseye-slim

WORKDIR /usr/src/app

# Install dependencies
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN npm ci --no-audit --no-fund

# Copy source
COPY . .

# Build client + server
RUN npm run build

ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/server/node-build.mjs"]
