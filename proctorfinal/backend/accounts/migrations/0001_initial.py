import django.contrib.auth.models
from django.db import migrations, models

class Migration(migrations.Migration):
    initial = True
    dependencies = [
        ("auth","0012_alter_user_first_name_max_length"),
    ]
    operations = [
        migrations.CreateModel(
            name="User",
            fields=[
                ("id",           models.BigAutoField(primary_key=True, serialize=False)),
                ("password",     models.CharField(max_length=128, verbose_name="password")),
                ("last_login",   models.DateTimeField(blank=True, null=True, verbose_name="last login")),
                ("is_superuser", models.BooleanField(default=False)),
                ("name",         models.CharField(max_length=150)),
                ("email",        models.EmailField(max_length=254, unique=True)),
                ("role",         models.CharField(choices=[("admin","Admin"),("student","Student")], default="student", max_length=20)),
                ("is_active",    models.BooleanField(default=True)),
                ("is_staff",     models.BooleanField(default=False)),
                ("date_joined",  models.DateTimeField(auto_now_add=True)),
                ("groups",       models.ManyToManyField(blank=True, related_name="user_set", related_query_name="user", to="auth.group", verbose_name="groups")),
                ("user_permissions", models.ManyToManyField(blank=True, related_name="user_set", related_query_name="user", to="auth.permission", verbose_name="user permissions")),
            ],
            options={"db_table":"users"},
            managers=[("objects", django.contrib.auth.models.UserManager())],
        ),
    ]
