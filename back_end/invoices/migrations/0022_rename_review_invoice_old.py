# Generated by Django 5.0.1 on 2024-06-14 17:09

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0021_invoice_new_invoice_review'),
    ]

    operations = [
        migrations.RenameField(
            model_name='invoice',
            old_name='review',
            new_name='old',
        ),
    ]