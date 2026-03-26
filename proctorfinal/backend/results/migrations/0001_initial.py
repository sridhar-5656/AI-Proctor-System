from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    initial=True
    dependencies=[("exams","0001_initial")]
    operations=[
        migrations.CreateModel(
            name="Result",
            fields=[
                ("id",                models.BigAutoField(auto_created=True,primary_key=True,serialize=False)),
                ("total_marks",       models.FloatField(default=0)),
                ("obtained_marks",    models.FloatField(default=0)),
                ("percentage",        models.FloatField(default=0)),
                ("rank",              models.PositiveIntegerField(blank=True,null=True)),
                ("grade",             models.CharField(blank=True,max_length=5)),
                ("total_violations",  models.PositiveIntegerField(default=0)),
                ("high_violations",   models.PositiveIntegerField(default=0)),
                ("medium_violations", models.PositiveIntegerField(default=0)),
                ("low_violations",    models.PositiveIntegerField(default=0)),
                ("risk_score",        models.FloatField(default=0)),
                ("integrity_score",   models.FloatField(default=100)),
                ("created_at",        models.DateTimeField(auto_now_add=True)),
                ("updated_at",        models.DateTimeField(auto_now=True)),
                ("attempt", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE,related_name="result",to="exams.attempt")),
                ("exam",    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,related_name="results",to="exams.exam")),
            ],
            options={"db_table":"results","ordering":["-percentage"]},
        ),
        migrations.CreateModel(
            name="VideoFrame",
            fields=[
                ("id",        models.BigAutoField(auto_created=True,primary_key=True,serialize=False)),
                ("image",     models.ImageField(upload_to="frames/%Y/%m/%d/")),
                ("timestamp", models.DateTimeField(auto_now_add=True)),
                ("note",      models.CharField(blank=True,max_length=100)),
                ("attempt",   models.ForeignKey(on_delete=django.db.models.deletion.CASCADE,related_name="video_frames",to="exams.attempt")),
            ],
            options={"db_table":"video_frames","ordering":["-timestamp"]},
        ),
    ]
