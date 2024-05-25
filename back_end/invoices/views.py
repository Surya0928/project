from rest_framework import viewsets
from .models import Customers
from .serializers import InvoiceSerializer

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Customers.objects.all()
    serializer_class = InvoiceSerializer


from django.db.models import OuterRef, Subquery
from django.http import JsonResponse
from .models import Customers, Comments
from .serializers import InvoiceSerializer

from django.utils import timezone
from django.db.models import Q, F, Value
from django.db.models.functions import Coalesce
from django.db.models import Case, When, Value, IntegerField


def get_all_invoices(request):
    if request.method == 'GET':
        current_date = timezone.now().date()

        # Subquery to get the promised_date and paid date of the last comment for each customer
        last_comment = Comments.objects.filter(invoice=OuterRef('pk')).order_by('-id')
        # Annotate customers with the promised_date and paid date of the last comment
        customers = Customers.objects.annotate(
            last_promised_date=Subquery(last_comment.values('promised_date')[:1]),
            last_paid=Subquery(last_comment.values('paid')[:1])
        )

        customers = customers.annotate(
            premium_user_order=Case(
                When(premium_user=False, then=Value(0)),
                When(premium_user=None, then=Value(1)),
                When(premium_user=True, then=Value(2)),
                output_field=IntegerField(),
            ),
            last_paid_order=Case(
                When(last_paid=False, then=Value(0)),
                When(last_paid=None, then=Value(1)),
                When(last_paid=True, then=Value(2)),
                output_field=IntegerField(),
            ),
            last_promised_date_order=Case(
                When(last_promised_date__lte=current_date, then=Value(0)),
                When(last_promised_date=None, then=Value(1)),
                When(last_promised_date__gt=current_date, then=Value(2)),
                output_field=IntegerField(),
            )
        ).order_by(
            'premium_user_order',          # 1. premium_user: False, True
            'last_paid_order',             # 2. last_paid: False, True
            'last_promised_date_order',    # 3. last_promised_date: <= current date, is null, > current date
            '-over_due',                    # 4. over_due: highest to lowest
            'id'
        )

            # for each in  customers:   
        #     print(each.account, each.last_promised_date, each.last_paid)

        # Split customers into three groups
        # customers_with_past_or_today_comments = customers.filter(last_promised_date__lte=current_date)
        # customers_with_no_comments = customers.filter(last_promised_date__isnull=True)
        # customers_with_future_comments = customers.filter(last_promised_date__gt=current_date)

        # # Order each group
        # customers_with_past_or_today_comments = customers_with_past_or_today_comments.order_by(
        #     '-over_due', 'last_promised_date', 'id')
        
        # customers_with_no_comments = customers_with_no_comments.order_by(
        #     '-over_due', 'id')  # No last_promised_date to order by
        # customers_with_future_comments = customers_with_future_comments.order_by(
        #     '-over_due', 'last_promised_date', 'id')
        

        # Combine the querysets
        # ordered_customers = list(customers_with_past_or_today_comments) + \
        #                     list(customers_with_no_comments) + \
        #                     list(customers_with_future_comments)

        ordered_customers = customers

        # Serialize the combined list
        serializer = InvoiceSerializer(ordered_customers, many=True)

        # Return the ordered customers as JSON response
        return JsonResponse(serializer.data, safe=False)
    else:
        # Handle other HTTP methods (e.g., POST, PUT, DELETE)
        return JsonResponse({'error': 'Only GET method is allowed for this endpoint'}, status=405)


from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.views.decorators.csrf import csrf_exempt

import json

@csrf_exempt
@require_http_methods(["POST"])
def update_comment_paid_status(request):
    try:
        # Parse input parameters from JSON data
        data = json.loads(request.body)
        comment_id = data.get('comment_id')
        paid_status = data.get('paid_status')

        # Fetch the comment
        comment = get_object_or_404(Comments, id=comment_id)

        # Update the paid field of the comment
        comment.paid = paid_status
        comment.save()

        return JsonResponse({'status': 'success', 'message': 'Comment updated successfully.'})

    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)




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
    

@csrf_exempt
@require_POST
def process_update_csv(request):
    if request.method == 'POST' and request.FILES.get('csv_file'):
        csv_file = request.FILES['csv_file']

        try:
            # Step 1: Update CSV data format
            updated_csv_data = update_csv_file_format(csv_file.read())

            # Step 2: Convert updated CSV data back to CSV file and process
            df = pd.read_csv(BytesIO(updated_csv_data))

            # Step 4: Import data from the updated CSV DataFrame into PostgreSQL
            import_data_from_csv(df)

            return JsonResponse({'success': True, 'message': 'CSV data processed and imported successfully'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)}, status=500)
    else:
        return JsonResponse({'success': False, 'message': 'Invalid request or no file provided'}, status=400)

import pandas as pd
from django.db.models import F

def import_data_from_csv(df):
    unique_list = df['party_name'].unique().tolist()

    for company in unique_list:
        account = company
        name = ''
        phone_number = ''
        
        invoices, total_due, optimal_due, threshold_due, over_due = 0.0, 0.0, 0.0, 0.0, 0.0

        # Initialize flags to check for non-empty values
        name_found = False
        phone_number_found = False

        for _, each in df.iterrows():
            if each['party_name'] == company:
                invoices += 1
                total_due += float(each['pending_amount'])
                if int(each['days_passed']) <= 60:
                    optimal_due += float(each['pending_amount'])
                elif 60 < int(each['days_passed']) <= 90:
                    threshold_due += float(each['pending_amount'])
                elif int(each['days_passed']) > 90:
                    over_due += float(each['pending_amount'])

                if not name_found and pd.notna(each['name']):
                    name = each['name']
                    name_found = True

                if not phone_number_found and pd.notna(each['phone_number']):
                    phone_number = each['phone_number']
                    phone_number_found = True
        print(account, 1, name, phone_number)
        invoice, created = Customers.objects.using('default').update_or_create(
            account=account,
            defaults={
                'optimal_due': round(optimal_due),
                'threshold_due': round(threshold_due),
                'over_due': round(over_due),
                'total_due': round(total_due),
                'invoices': invoices,
                'promised_date': None,
                'promised_amount': 0.0,
                'name': name,
                'phone_number': phone_number,
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

        Invoice.objects.using('default').update_or_create(
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


