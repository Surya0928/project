# Generated by Django 5.0.1 on 2024-06-29 05:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0030_users_target_collection'),
    ]

    operations = [
        migrations.AlterField(
            model_name='users',
            name='address',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]