from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    initial = True
    dependencies = [("exams","0001_initial")]
    operations = [
        migrations.CreateModel(
            name="Question",
            fields=[
                ("id",           models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("text",         models.TextField()),
                ("qtype",        models.CharField(choices=[("mcq","Multiple Choice"),("true_false","True / False"),("short","Short Answer")], default="mcq", max_length=20)),
                ("marks",        models.PositiveIntegerField(default=1)),
                ("order",        models.PositiveIntegerField(default=1)),
                ("model_answer", models.TextField(blank=True)),
                ("created_at",   models.DateTimeField(auto_now_add=True)),
                ("exam",         models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="questions", to="exams.exam")),
            ],
            options={"db_table":"questions","ordering":["order"]},
        ),
        migrations.CreateModel(
            name="Choice",
            fields=[
                ("id",         models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("text",       models.CharField(max_length=500)),
                ("is_correct", models.BooleanField(default=False)),
                ("question",   models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="choices", to="questions.question")),
            ],
            options={"db_table":"choices"},
        ),
        migrations.CreateModel(
            name="Answer",
            fields=[
                ("id",              models.BigAutoField(auto_created=True, primary_key=True, serialize=False)),
                ("text_answer",     models.TextField(blank=True)),
                ("is_correct",      models.BooleanField(default=False)),
                ("marks_obtained",  models.FloatField(default=0)),
                ("graded_by_admin", models.BooleanField(default=False)),
                ("answered_at",     models.DateTimeField(auto_now_add=True)),
                ("attempt",  models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="answers", to="exams.attempt")),
                ("question", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="answers", to="questions.question")),
                ("selected", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="questions.choice")),
            ],
            options={"db_table":"answers"},
        ),
        migrations.AlterUniqueTogether(name="answer", unique_together={("attempt","question")}),
    ]
