# Generated by Django 5.0.1 on 2024-05-23 19:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0007_rename_sales_up_date_comments_promised_date'),
    ]

    operations = [
        migrations.AddField(
            model_name='comments',
            name='paid',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='customers',
            name='premium_user',
            field=models.BooleanField(default=False),
        ),
    ]
