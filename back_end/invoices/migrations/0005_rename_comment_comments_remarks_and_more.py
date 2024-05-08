# Generated by Django 5.0.1 on 2024-05-06 16:26

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('invoices', '0004_alter_comments_comment_alter_comments_reference'),
    ]

    operations = [
        migrations.RenameField(
            model_name='comments',
            old_name='comment',
            new_name='remarks',
        ),
        migrations.RemoveField(
            model_name='comments',
            name='reference',
        ),
        migrations.AddField(
            model_name='comments',
            name='invoice_list',
            field=models.CharField(blank=True, max_length=1000, null=True),
        ),
        migrations.AddField(
            model_name='comments',
            name='sales_follow_msg',
            field=models.CharField(blank=True, max_length=1000, null=True),
        ),
        migrations.AddField(
            model_name='comments',
            name='sales_follow_response',
            field=models.CharField(blank=True, max_length=1000, null=True),
        ),
        migrations.AddField(
            model_name='comments',
            name='sales_up_date',
            field=models.DateField(blank=True, null=True),
        ),
    ]
