from bs4 import BeautifulSoup
import re


def html_to_text(html: str) -> str:
    if not html:
        return ""

    soup = BeautifulSoup(html, "html.parser")

    # supprime scripts/styles
    for tag in soup(["script", "style"]):
        tag.decompose()

    text = soup.get_text(separator=" ")

    # nettoyage espaces multiples
    text = re.sub(r"\s+", " ", text).strip()

    return text