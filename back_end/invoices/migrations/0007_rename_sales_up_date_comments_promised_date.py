# Generated by Django 5.0.1 on 2024-05-23 19:27

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0006_comments_amount_promised'),
    ]

    operations = [
        migrations.RenameField(
            model_name='comments',
            old_name='sales_up_date',
            new_name='promised_date',
        ),
    ]
