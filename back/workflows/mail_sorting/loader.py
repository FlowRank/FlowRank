import importlib
import threading

from back import config
from back.workflows.mail_sorting.base import MailSorter

DEFAULT_MAIL_SORTER_CLASS_PATH = (
    "back.workflows.mail_sorting.hf_text_classifier.HfTextClassificationSorter"
)

_lock = threading.Lock()
_cached_sorter: MailSorter | None = None


def load_mail_sorter() -> MailSorter:
    """Charge (et met en cache) le ``MailSorter`` configuré.

    Utilise ``MAIL_SORTER_CLASS_PATH`` si défini, sinon ``HfTextClassificationSorter``.
    """

    global _cached_sorter
    if _cached_sorter is not None:
        return _cached_sorter

    with _lock:
        if _cached_sorter is not None:
            return _cached_sorter

        class_path = config.MAIL_SORTER_CLASS_PATH or DEFAULT_MAIL_SORTER_CLASS_PATH
        _cached_sorter = _instantiate_mail_sorter(class_path)
        return _cached_sorter


def reset_mail_sorter_cache() -> None:
    """Vide le cache (utile en tests ou après un changement de config)."""

    global _cached_sorter
    with _lock:
        _cached_sorter = None


def _instantiate_mail_sorter(class_path: str) -> MailSorter:
    if "." not in class_path:
        raise RuntimeError(
            f"MAIL_SORTER_CLASS_PATH must be a fully-qualified class path, got {class_path!r}"
        )

    module_path, class_name = class_path.rsplit(".", 1)

    try:
        module = importlib.import_module(module_path)
    except ImportError as exc:
        raise RuntimeError(f"Cannot import mail sorter module {module_path!r}") from exc

    cls = getattr(module, class_name, None)
    if cls is None:
        raise RuntimeError(f"Module {module_path!r} has no attribute {class_name!r}")

    instance = cls()
    if not isinstance(instance, MailSorter):
        raise TypeError(f"{class_path!r} must inherit from back.workflows.mail_sorting.MailSorter")

    return instance
