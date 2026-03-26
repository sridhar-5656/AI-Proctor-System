from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

class UserManager(BaseUserManager):
    def create_user(self, email, name, password=None, role="student"):
        user = self.model(email=self.normalize_email(email), name=name, role=role)
        user.set_password(password)
        user.save(using=self._db)
        return user
    def create_superuser(self, email, name, password=None):
        user = self.create_user(email, name, password, role="admin")
        user.is_staff = user.is_superuser = True
        user.save(using=self._db)
        return user

class User(AbstractBaseUser, PermissionsMixin):
    ROLES = [("admin","Admin"),("student","Student")]
    id          = models.BigAutoField(primary_key=True)
    name        = models.CharField(max_length=150)
    email       = models.EmailField(unique=True)
    role        = models.CharField(max_length=20, choices=ROLES, default="student")
    is_active   = models.BooleanField(default=True)
    is_staff    = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    objects = UserManager()
    USERNAME_FIELD  = "email"
    REQUIRED_FIELDS = ["name"]
    class Meta:
        db_table = "users"
    @property
    def is_admin(self):
        return self.role == "admin"
