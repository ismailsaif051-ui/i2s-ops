# Image de test pour Render — simple et lisible, pas optimisée pour la taille.
# Construite depuis la racine du dépôt (monorepo npm workspaces) :
#   docker build -f apps/api/Dockerfile -t i2s-ops-api .
FROM node:20-bookworm-slim

WORKDIR /app

# Prisma a besoin d'OpenSSL pour son moteur de requêtes en production.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Les package.json de chaque paquet du monorepo, copiés avant le code source :
# tant qu'ils ne changent pas, Docker réutilise la couche « npm ci » d'une
# construction à l'autre.
COPY package.json package-lock.json ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/calc/package.json packages/calc/package.json
COPY packages/db/package.json packages/db/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm ci

COPY . .

# Le client Prisma, puis les paquets dans leur ordre de dépendance : l'API
# importe @i2s/contracts et @i2s/calc compilés, et @i2s/db directement en TypeScript.
RUN npx prisma generate --schema packages/db/prisma/schema.prisma \
  && npm run build -w @i2s/contracts \
  && npm run build -w @i2s/calc \
  && npm run build -w @i2s/api

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "apps/api/dist/main.js"]
