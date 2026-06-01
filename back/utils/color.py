import random


def random_label_color() -> str:
    """Couleur hex lisible pour un badge de label (#RRGGBB)."""
    r = random.randint(80, 200)
    g = random.randint(80, 200)
    b = random.randint(80, 200)
    return f"#{r:02x}{g:02x}{b:02x}"
