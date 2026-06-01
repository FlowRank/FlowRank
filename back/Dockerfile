FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS base

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

CMD ["sh", "-lc", "uv run --no-sync python -m back.scripts.seed_dev && exec uvicorn back.main:app --host 0.0.0.0 --port 5000 --reload"]

FROM base AS production-deps

RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=./uv.lock \
    --mount=type=bind,source=./pyproject.toml,target=./pyproject.toml \
    uv sync --no-install-workspace --package back-flowrank --group prod --no-group dev --frozen

FROM python:3.12-slim AS production

ENV APP_ENV=prod
ENV HF_HOME=/var/cache/huggingface
COPY --from=production-deps /usr/local/ /usr/local/
ENV PYTHONPATH=/app
WORKDIR /app
COPY . /app/back

CMD ["uvicorn", "back.main:app", "--host", "0.0.0.0", "--port", "5000"]
