# Base image for Node.js
FROM node:20-alpine3.20 AS node

# Set working directory
WORKDIR /front

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Enable corepack
RUN corepack enable

# Install pnpm
RUN corepack prepare pnpm@10.13.1

# Copy dependencies
COPY ./package.json ./pnpm-lock.yaml /front/

# Install dependencies
RUN --mount=type=cache,target=/pnpm/store pnpm install --frozen-lockfile

# Copy sources
COPY ./ /front

# Development stage
FROM node AS development

# Command to run the React app in development mode
CMD ["pnpm", "dev", "--host", "0.0.0.0"]

# Build stage
FROM node AS build

# Build the React application
RUN pnpm run build

# Production stage
FROM nginx:1.27-alpine AS production

RUN apk add --no-cache openssl \
    && mkdir -p /etc/nginx/ssl \
    && openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/nginx.key \
        -out /etc/nginx/ssl/nginx.crt \
        -subj "/CN=localhost"

WORKDIR /usr/share/nginx/html

COPY ./nginx.conf /etc/nginx/nginx.conf

COPY --from=build /front/dist/ /usr/share/nginx/html/
