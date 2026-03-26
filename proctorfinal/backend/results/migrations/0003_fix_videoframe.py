from django.db import migrations, connection


def fix_video_frames_table(apps, schema_editor):
    """
    Safely migrate video_frames table:
    1. Rename image -> file
    2. Add file_type column
    3. Extend note to 500
    """

    with connection.cursor() as cursor:
        # Check if table exists
        cursor.execute("SHOW TABLES LIKE 'video_frames'")
        table_exists = cursor.fetchone()

        if table_exists:
            cursor.execute("SHOW COLUMNS FROM video_frames")
            cols = [row[0] for row in cursor.fetchall()]

            # Rename image -> file
            if "image" in cols and "file" not in cols:
                cursor.execute(
                    "ALTER TABLE video_frames CHANGE image file varchar(200) NOT NULL DEFAULT ''"
                )
                print("Renamed: image -> file")

            # Add file_type column
            if "file_type" not in cols:
                cursor.execute(
                    "ALTER TABLE video_frames ADD COLUMN file_type varchar(10) NOT NULL DEFAULT 'snapshot'"
                )
                print("Added: file_type")

            # Extend note field
            cursor.execute(
                "ALTER TABLE video_frames MODIFY note varchar(500) NOT NULL DEFAULT ''"
            )
            print("Extended: note to 500 chars")


def reverse_fix(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("results", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(fix_video_frames_table, reverse_fix),
    ]