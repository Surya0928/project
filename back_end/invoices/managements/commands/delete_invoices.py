# invoices/management/commands/delete_invoices.py

from django.core.management.base import BaseCommand
from invoices.models import Customers

class Command(BaseCommand):
    help = 'Delete all records from the Customers model'

    def handle(self, *args, **options):
        Customers.objects.all().delete()
        self.stdout.write(self.style.SUCCESS('Successfully deleted all Customers records'))
