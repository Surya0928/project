# invoices/management/commands/delete_invoices.py

from django.core.management.base import BaseCommand
from invoices.models import Customer

class Command(BaseCommand):
    help = 'Delete all records from the Customer model'

    def handle(self, *args, **options):
        Customer.objects.all().delete()
        self.stdout.write(self.style.SUCCESS('Successfully deleted all Customer records'))
