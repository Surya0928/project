# Generated by Django 5.0.1 on 2024-06-20 03:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0024_alter_customers_credit_period'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customers',
            name='credit_period',
            field=models.IntegerField(blank=True, default=90, null=True),
        ),
    ]
