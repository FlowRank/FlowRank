from fastapi import APIRouter

router = APIRouter(prefix="/mail", tags=["mail"])


# @router.post("/sort", response_model=SortedMail)
# def sort_mail(
#     email: EmailToSort,
#     current_account=Depends(get_current_account),  # noqa: ARG001
# ) -> SortedMail:
#     """Classe un email via le ``MailSorter`` configuré (env ``MAIL_SORTER_CLASS_PATH``)."""

#     sorter = load_mail_sorter()
#     return sorter.sort(email)


# @router.post("/sort/batch", response_model=list[SortedMail])
# def sort_mail_batch(
#     emails: list[EmailToSort],
#     current_account=Depends(get_current_account),  # noqa: ARG001
# ) -> list[SortedMail]:
#     """Classe un lot d'emails via le ``MailSorter`` configuré."""

#     sorter = load_mail_sorter()
#     return sorter.sort_batch(emails)
