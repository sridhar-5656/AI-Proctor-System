from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    initial = True
    dependencies = [("accounts","0001_initial")]
    operations = [
        migrations.CreateModel(
            name="Exam",
            fields=[
                ("id",          models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("title",       models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("duration",    models.PositiveIntegerField()),
                ("start_time",  models.DateTimeField()),
                ("end_time",    models.DateTimeField()),
                ("status",      models.CharField(choices=[("draft","Draft"),("scheduled","Scheduled"),("active","Active"),("completed","Completed")], default="scheduled", max_length=20)),
                ("created_at",  models.DateTimeField(auto_now_add=True)),
                ("created_by",  models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="created_exams", to=settings.AUTH_USER_MODEL)),
            ],
            options={"db_table":"exams","ordering":["-created_at"]},
        ),
        migrations.CreateModel(
            name="Attempt",
            fields=[
                ("id",         models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("start_time", models.DateTimeField(auto_now_add=True)),
                ("end_time",   models.DateTimeField(blank=True, null=True)),
                ("score",      models.FloatField(blank=True, null=True)),
                ("status",     models.CharField(choices=[("in_progress","In Progress"),("completed","Completed"),("suspicious","Suspicious"),("auto_submitted","Auto Submitted")], default="in_progress", max_length=20)),
                ("exam", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="attempts", to="exams.exam")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="attempts", to=settings.AUTH_USER_MODEL)),
            ],
            options={"db_table":"attempts"},
        ),
        migrations.AlterUniqueTogether(name="attempt", unique_together={("user","exam")}),
    ]
