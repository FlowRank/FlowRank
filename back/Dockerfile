FROM ghcr.io/astral-sh/uv:python3.12-alpine AS base

ENV UV_PROJECT_ENVIRONMENT="/usr/local/"

WORKDIR /app

COPY uv.lock pyproject.toml ./

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync \
    --no-install-workspace \
    --package back-flowrank \
    --no-group dev \
    --frozen

FROM base AS development

ENV APP_ENV=dev

CMD ["uvicorn", "back.main:app", "--host", "0.0.0.0", "--port", "5000", "--reload"]
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
ENV PYTHONPATH=/app
WORKDIR /app
COPY . /app

CMD ["uvicorn", "back.main:app", "--host", "0.0.0.0", "--port", "5000"]