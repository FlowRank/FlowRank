### Stage 1: Base stage ####
FROM ghcr.io/astral-sh/uv:python3.12-alpine AS base

# Force uv to use the system location for python packages
ENV UV_PROJECT_ENVIRONMENT="/usr/local/"

RUN apk add --no-cache curl

# Copy source and requirements
WORKDIR /back

# Install Python dependencies (with cache)
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=./uv.lock \
    --mount=type=bind,source=./pyproject.toml,target=./pyproject.toml \
    uv sync --no-install-workspace --package back-flowrank --no-group prod --no-group dev --frozen

### Stage 2: Development stage ####
FROM base AS development
ENV APP_ENV=dev

# Install Python dev dependencies (with cache)
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=./uv.lock \
    --mount=type=bind,source=./pyproject.toml,target=./pyproject.toml \
    uv sync --no-install-workspace --package back-flowrank --no-group prod --group dev --frozen

# Copy sources
COPY --chmod=755 ./ /back/

CMD ["fastapi", "dev", "app/app.py", "--host", "0.0.0.0", "--port", "5000"]

### Stage 3: Production stage ####
FROM base AS production-deps

# Install Python prod dependencies (with cache)
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=./uv.lock \
    --mount=type=bind,source=./pyproject.toml,target=./pyproject.toml \
    uv sync --no-install-workspace --package back-flowrank --group prod --no-group dev --frozen

FROM python:3.12-alpine AS production

ENV APP_ENV=prod

COPY --from=production-deps /usr/local/ /usr/local/

WORKDIR /back

# Copy sources
COPY --chmod=755 ./ ./

CMD ["uvicorn", "app.app:app", "--host", "0.0.0.0", "--port", "5000"]