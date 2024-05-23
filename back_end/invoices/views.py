from rest_framework import viewsets
from .models import Customers
from .serializers import InvoiceSerializer

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Customers.objects.all()
    serializer_class = InvoiceSerializer


import csv
from io import TextIOWrapper, BytesIO
from datetime import datetime
import pandas as pd
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.db import transaction
from invoices.models import Customers, Invoice

def update_csv_file_format(csv_data):
    # Convert CSV data (string) to a pandas DataFrame
    df = pd.read_csv(BytesIO(csv_data))

    # Store original 'Due on' column before converting to dateti""me
    original_due_on = df['Due on']

    # Rename columns to desired names
    new_column_names = {
        'Date': 'invoice_date',
        'Ref. No.': 'ref_no',
        'Party\'s Name': 'party_name',
        'Pending': 'pending_amount',
        'Due on': 'due_date',
        'Name' : 'name',
        'Phone Number' : 'phone_number'

    }
    df = df.rename(columns=new_column_names)

    # Convert 'due_date' column to datetime to calculate days passed
    df['due_date'] = pd.to_datetime(df['due_date'], format='%d-%b-%y', errors='coerce')

    # Filter out rows with invalid datetime values (e.g., 'NaT' values)
    df = df.dropna(subset=['due_date'])

    # Convert today's date to pandas Timestamp (to match 'due_date' datatype)
    today = pd.Timestamp(datetime.today().date())

    # Calculate number of days passed from due date to today
    df['days_passed'] = (today - df['due_date']).dt.days

    # Revert 'due_date' column back to original format
    df['due_date'] = original_due_on

    # Remove the 'days_passed' column (if present)
    if 'Overdue' in df.columns:
        df.drop('Overdue', axis=1, inplace=True)
        # Convert DataFrame back to CSV data (as bytes)
    updated_csv_data = df.to_csv(index=False).encode('utf-8')
    # print(updated_csv_data)
    
    print("CSV data updated successfully")
    return updated_csv_data

@csrf_exempt
@require_POST

@transaction.atomic
def process_uploaded_csv(request):
    if request.method == 'POST' and request.FILES.get('csv_file'):
        csv_file = request.FILES['csv_file']

        try:
            # Step 1: Update CSV data format
            updated_csv_data = update_csv_file_format(csv_file.read())

            # Step 2: Convert updated CSV data back to CSV file and process
            df = pd.read_csv(BytesIO(updated_csv_data))

            # Step 3: Delete existing Customers and Invoice instances from PostgreSQL
            Customers.objects.using('default').all().delete()
            Invoice.objects.using('default').all().delete()

            # Step 4: Import data from the updated CSV DataFrame into PostgreSQL
            import_data_from_csv(df)

            return JsonResponse({'success': True, 'message': 'CSV data processed and imported successfully'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)}, status=500)
    else:
        return JsonResponse({'success': False, 'message': 'Invalid request or no file provided'}, status=400)

def import_data_from_csv(df):
    unique_list = []
    for _, row in df.iterrows():
        if row['party_name'] not in unique_list:
            unique_list.append(row['party_name'])

    for company in unique_list:
        account = company
        invoices, total_due, optimal_due, threshold_due, over_due = 0.0, 0.0, 0.0, 0.0, 0.0
        for _, each in df.iterrows():
            if each['party_name'] == company:
                invoices += 1
                total_due += float(each['pending_amount'])
                if int(each['days_passed']) <= 60:
                    optimal_due += float(each['pending_amount'])
                elif int(each['days_passed']) > 60 and int(each['days_passed']) <= 90:
                    threshold_due += float(each['pending_amount'])
                elif int(each['days_passed']) > 90:
                    over_due += float(each['pending_amount'])

        invoice = Customers.objects.using('default').update_or_create(
            account=account,
            defaults={
                'optimal_due': round(optimal_due),
                'threshold_due': round(threshold_due),
                'over_due': round(over_due),
                'total_due': round(total_due),
                'invoices': invoices,
                'promised_date': None,
                'promised_amount': 0.0,
            }
        )

    for _, row in df.iterrows():
        try:
            customer = Customers.objects.using('default').get(account=row['party_name'])
        except Customers.DoesNotExist:
            continue

        try:
            date = datetime.strptime(row['invoice_date'], '%d-%b-%y').date().strftime('%Y-%m-%d')
            due_on = datetime.strptime(row['due_date'], '%d-%b-%y').date().strftime('%Y-%m-%d')
        except ValueError:
            continue

        Invoice.objects.using('default').create(
            invoice=customer,
            date=date,
            ref_no=row['ref_no'],
            pending=float(row['pending_amount']),
            due_on=due_on,
            days_passed=int(row['days_passed'])
        )


from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Customers
from .serializers import CustomerUpdateSerializer

class CustomerUpdateAPIView(APIView):
    def post(self, request):
        serializer = CustomerUpdateSerializer(data=request.data)
        if serializer.is_valid():
            account = serializer.validated_data['account']
            try:
                customer = Customers.objects.get(account=account)
                serializer.update(customer, serializer.validated_data)
                return Response("Customer record updated successfully", status=status.HTTP_200_OK)
            except Customers.DoesNotExist:
                return Response("Customer not found", status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import Customers, Comments
from .serializers import CommentsSerializer

@api_view(['POST'])
def create_comment(request):
    serializer = CommentsSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Comments
from .serializers import CommentsSerializer

from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Comments
from .serializers import CommentsSerializer

@api_view(['GET'])
def get_all_comments(request):

    # Filter comments based on provided parameters
    comments_queryset = Comments.objects.all()

    # Serialize filtered queryset
    serializer = CommentsSerializer(comments_queryset, many=True)
    return Response(serializer.data)


