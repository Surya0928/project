# Generated by Django 5.0.6 on 2024-06-14 11:04

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0018_name'),
    ]

    operations = [
        migrations.DeleteModel(
            name='Name',
        ),
    ]