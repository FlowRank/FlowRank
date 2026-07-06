import logging

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from back import config
from back.router.account import router as account_router
from back.router.dashboard import router as dashboard_router
from back.router.link import router as link_router
from back.router.mail import router as mail_router
from back.scripts._db import ensure_schema
from back.scripts.get_mails import get_mails
from back.scripts.sort_mails import sort_unlabeled_mails

ensure_schema()

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
    return {"message": "API UP"}


app.include_router(account_router)
app.include_router(link_router)
app.include_router(dashboard_router)
app.include_router(mail_router)

logging.getLogger("mail_fetch").setLevel(logging.INFO)
logging.getLogger("sort_mails").setLevel(logging.INFO)

scheduler = BackgroundScheduler()
scheduler.add_job(get_mails, "interval", minutes=int(config.MAIL_FETCH_INTERVAL_MINUTES))
scheduler.add_job(
    sort_unlabeled_mails,
    "interval",
    minutes=config.MAIL_SORT_INTERVAL_MINUTES,
)
scheduler.start()
