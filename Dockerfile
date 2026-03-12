FROM node:24-alpine

WORKDIR /app

# Install frontend deps and build
COPY app/package*.json ./app/
RUN cd app && npm ci

COPY app/ ./app/
RUN cd app && npm run build

# Install API deps
COPY api/package*.json ./api/
RUN cd api && npm ci

COPY api/ ./api/

EXPOSE 3001

CMD ["node", "--import", "tsx/esm", "api/src/index.ts"]
