FROM node:20-alpine

WORKDIR /app

# Copie des fichiers package.json et package-lock.json
COPY package*.json ./

# Installation des dépendances de production uniquement
RUN npm ci --omit=dev

# Copie des fichiers buildés (qui contiennent le front et le server.cjs)
COPY dist ./dist

# Exposition du port utilisé par Cloud Run
EXPOSE 8080

# Variable d'environnement pour le port par défaut
ENV PORT=8080

# Démarrage du serveur Node.js compilé
CMD ["node", "dist/server.cjs"]
