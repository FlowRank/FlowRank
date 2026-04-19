from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from back import config
from back.dao.connection import (
    BaseData,
    engine_data,
)
from back.router.account import router as account_router

BaseData.metadata.create_all(bind=engine_data)

app = FastAPI(title="API FlowRank", version="0.1", redoc_url=None)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.APP_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthcheck")
def healthcheck():
    return {"message":"API UP"}


app.include_router(account_router)