# Generated by Django 5.0.1 on 2024-06-20 06:49

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0026_invoice_to_do'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='invoice',
            name='to_do',
        ),
    ]
