"""Sets Firebase Auth email_verified for federated (SSO) users via Admin SDK."""

from firebase_admin import auth as firebase_admin_auth
from firebase_functions import https_fn, options

SSO_PROVIDER_IDS = frozenset({"google.com", "apple.com", "facebook.com"})


@https_fn.on_call(
    cors=options.CorsOptions(
        cors_origins=[
            "https://www.sportshub.net.au",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "*",
        ],
        cors_methods=["post"],
    ),
    region="australia-southeast1",
)
def verify_email_for_sso_user(req: https_fn.CallableRequest):
    if req.auth is None or req.auth.uid is None:
        return {"success": False, "error": "unauthenticated"}

    uid = req.auth.uid

    try:
        user = firebase_admin_auth.get_user(uid)
    except firebase_admin_auth.UserNotFoundError:
        return {"success": False, "error": "user_not_found"}

    has_sso = any(p.provider_id in SSO_PROVIDER_IDS for p in user.provider_data)
    if not has_sso:
        return {"success": False, "error": "not_sso"}

    if user.email_verified:
        return {"success": True, "emailVerified": True, "alreadyVerified": True}

    firebase_admin_auth.update_user(uid, email_verified=True)
    return {"success": True, "emailVerified": True, "alreadyVerified": False}
