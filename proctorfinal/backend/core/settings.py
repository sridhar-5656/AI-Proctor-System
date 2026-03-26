import os
from datetime import timedelta
from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY    = config("SECRET_KEY")
DEBUG         = config("DEBUG", default=True, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost").split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "channels",
    "corsheaders",
    "accounts",
    "exams",
    "proctoring",
    "violations",
    "reports",
    "questions",
    "results",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF     = "core.urls"
ASGI_APPLICATION = "core.asgi.application"
AUTH_USER_MODEL  = "accounts.User"

TEMPLATES = [{"BACKEND":"django.template.backends.django.DjangoTemplates",
    "DIRS":[],"APP_DIRS":True,
    "OPTIONS":{"context_processors":[
        "django.template.context_processors.debug",
        "django.template.context_processors.request",
        "django.contrib.auth.context_processors.auth",
        "django.contrib.messages.context_processors.messages",
    ]}}]

DATABASES = {"default":{
    "ENGINE":   "django.db.backends.mysql",
    "NAME":     config("DB_NAME",     default="proctoring_db"),
    "USER":     config("DB_USER",     default="root"),
    "PASSWORD": config("DB_PASSWORD", default=""),
    "HOST":     config("DB_HOST",     default="localhost"),
    "PORT":     config("DB_PORT",     default="3306"),
    "OPTIONS":  {"charset":"utf8mb4"},
}}

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES":(
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES":(
        "rest_framework.permissions.IsAuthenticated",
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME":    timedelta(minutes=config("JWT_ACCESS_MINUTES",  default=60,   cast=int)),
    "REFRESH_TOKEN_LIFETIME":   timedelta(minutes=config("JWT_REFRESH_MINUTES", default=1440, cast=int)),
    "ROTATE_REFRESH_TOKENS":    True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES":        ("Bearer",),
}

CHANNEL_LAYERS = {"default":{
    "BACKEND":"channels_redis.core.RedisChannelLayer",
    "CONFIG":{"hosts":[config("REDIS_URL", default="redis://localhost:6379/0")]},
}}

CORS_ALLOWED_ORIGINS   = ["http://localhost:3000","http://127.0.0.1:3000"]
CORS_ALLOW_CREDENTIALS = True

STATIC_URL  = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL   = "/media/"
MEDIA_ROOT  = BASE_DIR / "media"

LANGUAGE_CODE      = "en-us"
TIME_ZONE          = "UTC"
USE_TZ             = True
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

VIOLATION_WARNING_THRESHOLD     = 3
VIOLATION_SUSPICIOUS_THRESHOLD  = 5
VIOLATION_AUTO_SUBMIT_THRESHOLD = 7

os.makedirs(BASE_DIR / "logs",  exist_ok=True)
os.makedirs(BASE_DIR / "media", exist_ok=True)

LOGGING = {
    "version":1,"disable_existing_loggers":False,
    "handlers":{
        "console":{"class":"logging.StreamHandler"},
        "file":{"class":"logging.FileHandler","filename":str(BASE_DIR/"logs/django.log")},
    },
    "root":{"handlers":["console","file"],"level":"INFO"},
}
