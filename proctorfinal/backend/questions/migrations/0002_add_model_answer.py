from django.db import migrations, models

class Migration(migrations.Migration):
    """
    Adds model_answer to questions table and graded_by_admin to answers table.
    Run this if you already have the old questions table without these columns.
    """
    dependencies = [
        ("questions", "0001_initial"),
    ]
    operations = [
        migrations.AddField(
            model_name="question",
            name="model_answer",
            field=models.TextField(blank=True, default=""),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="answer",
            name="graded_by_admin",
            field=models.BooleanField(default=False),
        ),
    ]
