from abc import ABC, abstractmethod

from back.workflows.mail_sorting.schemas import EmailToSort, SortedMail


class MailSorter(ABC):
    """Interface à implémenter pour proposer un workflow de tri de mails.

    La classe concrète est résolue dynamiquement via la variable
    d'environnement ``MAIL_SORTER_CLASS_PATH``
    (ex. ``my_pkg.my_module.MyAiMailSorter``).
    """

    @abstractmethod
    def sort(self, email: EmailToSort) -> SortedMail:
        """Classer un email et retourner la décision de tri associée."""

    def sort_batch(self, emails: list[EmailToSort]) -> list[SortedMail]:
        """Implémentation par défaut : appel séquentiel à ``sort``.

        Les implémentations IA peuvent surcharger cette méthode pour batcher
        les appels au modèle.
        """

        return [self.sort(email) for email in emails]
