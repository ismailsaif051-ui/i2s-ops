# Image de test pour Render — simple et lisible, pas optimisée pour la taille.
# Construite depuis la racine du dépôt (monorepo npm workspaces) :
#   docker build -f apps/web/Dockerfile -t i2s-ops-web .
FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/calc/package.json packages/calc/package.json
COPY packages/db/package.json packages/db/package.json
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm ci

COPY . .

# L'interface s'appuie sur @i2s/contracts compilé (schémas Zod, matrice RBAC).
# Elle ne parle jamais directement à la base : elle relaie tout vers l'API.
RUN npm run build -w @i2s/contracts \
  && npm run build -w @i2s/web

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "run", "start", "-w", "@i2s/web"]
