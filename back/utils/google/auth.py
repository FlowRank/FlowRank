from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from back import config

def get_google_token(
    refresh_token: str,
    token_uri: str = "https://oauth2.googleapis.com/token",
):
    """
    Retourne un access_token valide à partir d’un refresh_token.
    """

    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri=token_uri,
        client_id=config.GOOGLE_CLIENT_ID,
        client_secret=config.GOOGLE_CLIENT_SECRET,
    )

    # Force le refresh
    creds.refresh(Request())

    return creds.token


