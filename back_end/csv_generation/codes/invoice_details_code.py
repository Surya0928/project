import csv
from datetime import datetime

import os
import sys

# Add the path to your Django project directory
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
sys.path.append(project_root)

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tally_proj.settings')

# Initialize Django
import django
django.setup()

# Import your Django models
from invoices.models import Customers, Invoice

def import_data_from_csv(csv_file_path):
    with open(csv_file_path, 'r') as file:
        reader = csv.DictReader(file)

        for row in reader:
            # Retrieve the Customers instance based on account (assuming account is unique)
            try:
                invoice = Customers.objects.get(account=row['party_name'])
            except Customers.DoesNotExist:
                # Handle if the corresponding invoice is not found
                continue  # Skip processing this row if invoice not found
            
            # Convert date strings to YYYY-MM-DD format
            try:
                date = datetime.strptime(row['invoice_date'], '%d-%b-%y').date().strftime('%Y-%m-%d')
                due_on = datetime.strptime(row['due_date'], '%d-%b-%y').date().strftime('%Y-%m-%d')
            except ValueError:
                # Handle invalid date format
                continue  # Skip processing this row if date conversion fails
            
            # Create Invoice instance and assign fields
            invoice_detail = Invoice.objects.create(
                invoice=invoice,
                date=date,
                ref_no=row['ref_no'],
                pending=float(row['pending_amount']),
                due_on=due_on,
                days_passed=int(row['days_passed'])
            )

if __name__ == '__main__':
    # Replace 'path/to/your/csv/file.csv' with your actual CSV file path
    csv_file_path = 'csv_generation/files/due_included.csv'
    import_data_from_csv(csv_file_path)
