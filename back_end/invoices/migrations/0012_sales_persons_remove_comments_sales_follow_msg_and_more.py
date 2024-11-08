# Generated by Django 5.0.1 on 2024-05-28 15:24

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0011_comments_paid_comments_paid_date'),
    ]

    operations = [
        migrations.CreateModel(
            name='Sales_Persons',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(blank=True, max_length=1000, null=True)),
                ('phone_number', models.CharField(blank=True, max_length=20, null=True)),
                ('address', models.CharField(blank=True, max_length=1000, null=True)),
                ('email', models.EmailField(blank=True, max_length=100, null=True)),
            ],
        ),
        migrations.RemoveField(
            model_name='comments',
            name='sales_follow_msg',
        ),
        migrations.RemoveField(
            model_name='comments',
            name='sales_follow_response',
        ),
        migrations.RemoveField(
            model_name='customers',
            name='sales_person',
        ),
        migrations.AddField(
            model_name='comments',
            name='follow_up_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='comments',
            name='sales_person',
            field=models.ForeignKey(blank=True, default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='comments_sales_pz', to='invoices.sales_persons'),
        ),
        migrations.AddField(
            model_name='invoice',
            name='sales_person',
            field=models.ForeignKey(blank=True, default=None, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='invoice_sales_p', to='invoices.sales_persons'),
        ),
    ]
