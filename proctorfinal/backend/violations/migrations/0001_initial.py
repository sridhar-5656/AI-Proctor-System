from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    initial = True
    dependencies = [("accounts","0001_initial"),("exams","0001_initial")]
    operations = [
        migrations.CreateModel(
            name="Violation",
            fields=[
                ("id",        models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("type",      models.CharField(max_length=50)),
                ("severity",  models.CharField(choices=[("low","Low"),("medium","Medium"),("high","High")], default="low", max_length=10)),
                ("timestamp", models.DateTimeField(auto_now_add=True)),
                ("details",   models.JSONField(blank=True, default=dict)),
                ("attempt",   models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="exams.attempt")),
                ("exam",      models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="violations", to="exams.exam")),
                ("user",      models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="violations", to=settings.AUTH_USER_MODEL)),
            ],
            options={"db_table":"violations","ordering":["-timestamp"]},
        ),
        migrations.CreateModel(
            name="Log",
            fields=[
                ("id",         models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("message",    models.TextField()),
                ("level",      models.CharField(default="info", max_length=10)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("exam",       models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="exams.exam")),
                ("user",       models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={"db_table":"logs","ordering":["-created_at"]},
        ),
    ]
