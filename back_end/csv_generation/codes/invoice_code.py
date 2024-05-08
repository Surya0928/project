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

# Now you can use your Django models in the script
# Example usage:
invoices = Customers.objects.all()
print(invoices)
def import_data_from_csv(csv_file_path):
    with open(csv_file_path, 'r') as file:
        reader = csv.DictReader(file)
        unique_list = []
        for row in reader:
            print(row)
            if row['party_name'] not in unique_list:
                unique_list.append(row['party_name'])
        file.seek(0)

        for company in unique_list:
            account = company
            file.seek(0)
            invoices, total_due, optimal_due, threshold_due, over_due = 0.0,0.0,0.0,0.0,0.0
            for each in reader:
                # print(int(each['days_passed']))
                if each['party_name'] == company:
                    invoices += 1
                    total_due += float(each['pending_amount'])
                    if int(each['days_passed']) <= 60:
                        optimal_due += float(each['pending_amount'])
                    elif int(each['days_passed']) > 60 and int(each['days_passed']) <= 90:
                        threshold_due += float(each['pending_amount'])
                    elif int(each['days_passed']) > 90:
                        over_due += float(each['pending_amount'])

            # print(company, over_due)
            invoice = Customers.objects.get_or_create(
                account=account,
                optimal_due=round(optimal_due),
                threshold_due=round(threshold_due),
                over_due=round(over_due),
                total_due=round(total_due),
                invoices=invoices
            )

if __name__ == '__main__':
    # Replace 'path/to/your/csv/file.csv' with your actual CSV file path
    csv_file_path = 'csv_generation/files/due_included.csv'
    import_data_from_csv(csv_file_path)
