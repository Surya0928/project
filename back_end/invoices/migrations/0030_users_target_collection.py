# Generated by Django 5.0.1 on 2024-06-28 12:19

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0029_remove_comments_deleted_at_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='users',
            name='target_collection',
            field=models.DecimalField(decimal_places=2, default=0.0, max_digits=10),
        ),
    ]
