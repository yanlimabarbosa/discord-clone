FROM node:20-alpine AS build
WORKDIR /app
COPY apps/web/package*.json ./
RUN npm install
COPY apps/web/ ./
RUN npm run build

FROM caddy:2
COPY --from=build /app/dist /srv
