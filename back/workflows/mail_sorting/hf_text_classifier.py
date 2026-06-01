import os
import threading

from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    pipeline,
)

from back import config
from back.workflows.mail_sorting.base import MailSorter
from back.workflows.mail_sorting.schemas import EmailToSort, SortedMail


class HfTextClassificationSorter(MailSorter):
    """Classification de mails via un modèle Hugging Face (sequence classification).

    La pipeline ``transformers`` est un détail d'implémentation de ce sorter uniquement.
    Le job ``sort_mails`` et l'interface ``MailSorter`` restent agnostiques du modèle.
    """

    _lock = threading.Lock()
    _pipeline = None

    def sort(self, email: EmailToSort) -> SortedMail:
        clf = self._get_pipeline()
        result = clf(self._format_text(email))[0]
        label = str(result["label"])
        score = float(result.get("score", 0.0))
        return SortedMail(
            email_id=email.id,
            category=label,
            priority=0,
            reason=f"score={score:.4f}",
            labels_to_add=[label],
        )

    @classmethod
    def _get_pipeline(cls):
        if cls._pipeline is not None:
            return cls._pipeline

        with cls._lock:
            if cls._pipeline is not None:
                return cls._pipeline

            model_id = config.MAIL_SORT_MODEL_ID
            cache_dir = os.getenv("HF_HOME", os.path.expanduser("~/.cache/huggingface"))
            tokenizer = AutoTokenizer.from_pretrained(
                model_id,
                subfolder="model",
                cache_dir=cache_dir,
            )
            model = AutoModelForSequenceClassification.from_pretrained(
                model_id,
                subfolder="model",
                cache_dir=cache_dir,
            )
            cls._pipeline = pipeline(
                "text-classification",
                model=model,
                tokenizer=tokenizer,
                truncation=True,
            )
            return cls._pipeline

    @staticmethod
    def _format_text(email: EmailToSort) -> str:
        body = email.body or email.snippet or ""
        return f"Subject: {email.subject}\n\nBody: {body}"
