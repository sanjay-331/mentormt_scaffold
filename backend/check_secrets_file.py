from app.core.config import settings
from app.core.auth import SECRET_KEY

with open("secrets.txt", "w") as f:
    f.write(f"DEBUG_SETTINGS_SECRET: [{settings.SECRET_KEY}]\n")
    f.write(f"DEBUG_SETTINGS_JWT_SECRET: [{settings.JWT_SECRET_KEY}]\n")
    f.write(f"DEBUG_AUTH_SECRET: [{SECRET_KEY}]\n")
