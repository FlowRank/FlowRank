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

# Set working directory
WORKDIR /usr/share/nginx/html

# Copy Nginx configuration and entrypoint script
COPY ./nginx.conf /etc/nginx/nginx.conf 
#TODO: conf does not exist and prod deployment does not work, create it
# COPY ./frontend-entrypoint.sh /

# Copy the built application from the build stage
COPY --from=build /front/dist/frontend /usr/share/nginx/html

# Command to run the Nginx server
# CMD ["sh", "/frontend-entrypoint.sh"]
