from app.core.config import settings
from app.core.auth import SECRET_KEY

print(f"DEBUG_SETTINGS_SECRET: [{settings.SECRET_KEY}]")
print(f"DEBUG_SETTINGS_JWT_SECRET: [{settings.JWT_SECRET_KEY}]")
print(f"DEBUG_AUTH_SECRET: [{SECRET_KEY}]")
