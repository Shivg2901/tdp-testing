FROM node:22.1-alpine AS base
WORKDIR /app
COPY ./package.json /app/

FROM base AS prod-deps
RUN npm install --omit dev

FROM base AS build
RUN npm install
COPY . .
RUN npm run build

FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist /app/dist
COPY --from=build /app/src/clickhouse/migrations /app/src/clickhouse/migrations
CMD [ "npm", "run", "start:prod" ]