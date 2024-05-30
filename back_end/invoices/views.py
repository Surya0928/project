from rest_framework import viewsets
from .models import Customers
from .serializers import InvoiceSerializer

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Customers.objects.all()
    serializer_class = InvoiceSerializer


from django.http import JsonResponse
from django.utils import timezone
from django.db.models import OuterRef, Subquery, Case, When, Value, IntegerField
from .models import Customers, Invoice, Comments, Sales_Persons
from .serializers import InvoiceSerializer, SalesPersonsSerializer
from rest_framework.decorators import api_view

@api_view(['POST'])
def get_all_invoices(request):
    if request.method == 'POST':
        data = json.loads(request.body)

        user_id = Users.objects.get(id=data.get('user_id'))
        lis = []
        sales = Sales_Persons.objects
        data = SalesPersonsSerializer(sales, many=True).data
        for sale in data:
            lis.append(sale['name'])
        # Subquery to get the promised_date of the last comment for each customer
        last_comment = Comments.objects.filter(user = user_id ,invoice=OuterRef('pk')).order_by('-id')

        customers = Customers.objects.filter(user = user_id)
        print(customers)
        # Annotate customers with the promised_date of the last comment
        if len(customers)>0:
            print
            customers = Customers.objects.annotate(
                last_promised_date=Subquery(last_comment.values('promised_date')[:1]),
            ).filter(user = user_id)

            # Annotate customers with custom order fields
            customers = customers.annotate(
                premium_user_order=Case(
                    When(premium_user=False, then=Value(0)),
                    When(premium_user=None, then=Value(1)),
                    When(premium_user=True, then=Value(2)),
                    output_field=IntegerField(),
                ),
            )

            # Order the customers
            customers = customers.order_by('premium_user_order', '-over_due', 'last_promised_date', 'id')
            print(customers)
            # Serialize the queryset
            customer_data = []
            for customer in customers:
                # Filter unpaid invoices
                customer_dict = InvoiceSerializer(customer).data
                invoices = Invoice.objects.filter(user = user_id , invoice=customer).order_by('date', 'id')
                if len(invoices) > 0:
                    customer_dict['invoice_details'] = InvoiceDetailSerializer(invoices, many=True).data
                else:
                    customer_dict['invoice_details'] =[]
                # for each in invoices:
                #     sales_person = Sales_Persons.objects.filter(name = each.sales_person)
                #     if len(sales_person) > 0:
                #         each.sales_person = sales_person[0].name
                
                
                

                customer_data.append(customer_dict)
        else:
            customer_data = []

        # Return the ordered customers as JSON response
        return JsonResponse({'sales_data': data , 'sales': lis, 'customer_data': customer_data}, safe=False)
    else:
        # Handle other HTTP methods (e.g., POST, PUT, DELETE)
        return JsonResponse({'error': 'Only POST method is allowed for this endpoint'}, status=405)
    

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.views.decorators.csrf import csrf_exempt

import json

@csrf_exempt
@require_http_methods(["POST"])
def update_invoice_paid_status(request):
    try:
        # Parse input parameters from JSON data
        data = json.loads(request.body)
        invoice = data.get('invoice_id')
        paid_status = data.get('paid_status')
        paid_date = data.get('paid_date')

        # Fetch the comment
        invoice = get_object_or_404(Invoice, id=invoice)

        # Update the paid field of the comment
        invoice.paid = paid_status
        invoice.paid_date = paid_date
        invoice.save()

        return JsonResponse({'status': 'success', 'message': 'Comment updated successfully.'})

    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    


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
        comment = data.get('comment_id')
        paid_status = data.get('paid_status')
        paid_date = data.get('paid_date')

        # Fetch the comment
        comment = get_object_or_404(Comments, id=comment)
        customer = Customers.objects.filter(account = comment.invoice)
        print(len(customer))
        
        # Update the paid field of the comment
        comment.paid = paid_status
        comment.paid_date = paid_date
        comment.save()

        comments = Comments.objects.filter(invoice = comment.invoice, paid = False).order_by('-id')
        print(len(comments))
        if len(comments) > 0:
            customer[0].promised_date = comments[0].promised_date
            customer[0].promised_amount = comments[0].amount_promised
            customer[0].save()
        else:
            customer[0].promised_date = None
            customer[0].promised_amount = 0.00
            customer[0].save()

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
    try:
        # Convert CSV data (bytes) to a pandas DataFrame
        df = pd.read_csv(BytesIO(csv_data))

        # Store original 'Due on' column before converting to datetime
        original_due_on = df['Due on']

        # Rename columns to desired names
        new_column_names = {
            'Date': 'invoice_date',
            'Ref. No.': 'ref_no',
            'Party\'s Name': 'party_name',
            'Pending': 'pending_amount',
            'Due on': 'due_date',
            'Name': 'name',
            'Phone Number': 'phone_number'
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

        print("CSV data updated successfully")
        return updated_csv_data
    except Exception as e:
        print("Error updating CSV data:", e)
        raise e  # Reraise the exception to propagate it to the caller

@csrf_exempt
@require_POST

@transaction.atomic
def process_uploaded_csv(request):
    if request.method == 'POST' and request.FILES.get('csv_file'):
        csv_file = request.FILES['csv_file']
        
        # Retrieve user_id from request
        user_id = int(request.POST.get('user_id'))


        try:
            # Step 1: Read the content of the CSV file
            csv_data = csv_file.read()

            # Step 2: Update CSV data format
            updated_csv_data = update_csv_file_format(csv_data)

            # Step 3: Convert updated CSV data back to CSV file and process
            df = pd.read_csv(BytesIO(updated_csv_data))

            # Step 4: Delete existing Customers and Invoice instances from PostgreSQL
            Customers.objects.using('default').filter(user=user_id).delete()
            Invoice.objects.using('default').filter(user=user_id).delete()

            # Step 5: Import data from the updated CSV DataFrame into PostgreSQL
            import_data_from_csv(df, user_id)

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
        user_id = int(request.POST.get('user_id'))
        try:
            # Step 1: Update CSV data format
            updated_csv_data = update_csv_file_format(csv_file.read())

            # Step 2: Convert updated CSV data back to CSV file and process
            df = pd.read_csv(BytesIO(updated_csv_data))

            # Step 4: Import data from the updated CSV DataFrame into PostgreSQL
            import_data_from_csv(df, user_id)

            return JsonResponse({'success': True, 'message': 'CSV data processed and imported successfully'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)}, status=500)
    else:
        return JsonResponse({'success': False, 'message': 'Invalid request or no file provided'}, status=400)

import pandas as pd
from django.db.models import F

def import_data_from_csv(df, user_id):
    unique_list = df['party_name'].unique().tolist()
    user_instance = Users.objects.get(id=user_id)

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
            user=user_instance,  # Pass user_id to the model
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
            customer = Customers.objects.using('default').get(account=row['party_name'], user=user_id)
        except Customers.DoesNotExist:
            continue

        try:
            date = datetime.strptime(row['invoice_date'], '%d-%b-%y').date().strftime('%Y-%m-%d')
            due_on = datetime.strptime(row['due_date'], '%d-%b-%y').date().strftime('%Y-%m-%d')
        except ValueError:
            continue

        Invoice.objects.using('default').update_or_create(
            user=user_instance,  # Pass user_id to the model
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

@api_view(['POST'])
def get_all_comments(request):
    data = json.loads(request.body)
    user_id = Users.objects.get(id=data.get('user_id'))
    # Filter comments based on provided parameters
    comments_queryset = Comments.objects.filter(user = user_id)
    print(comments_queryset)

    # Serialize filtered queryset
    serializer = CommentsSerializer(comments_queryset, many=True)
    return Response(serializer.data)


from django.http import JsonResponse
from .models import Invoice, Customers
from .serializers import InvoiceDetailSerializer
from rest_framework.decorators import api_view

@api_view(['POST'])
def get_paid_Invoice(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        user_id = Users.objects.get(id=data.get('user_id'))
        
        invoices = Invoice.objects.filter(user=user_id,paid=True).order_by('-paid_date')
        if len(invoices) > 0:
            for invoice in invoices:
                customer = Customers.objects.filter(user = user_id, account=invoice.invoice.account).first()
                if customer:
                    invoice.invoice.phone_number = customer.phone_number

            serializer = (InvoiceDetailSerializer(invoices, many=True)).data
        else:
            serializer = []

        return JsonResponse(serializer, safe=False)
    else:
        return JsonResponse({'error': 'Only POST method is allowed for this endpoint'}, status=405)
    
from django.http import JsonResponse
from django.utils import timezone
from datetime import timedelta
from django.db.models import Subquery, OuterRef
from .models import Customers, Comments
from .serializers import InvoiceSerializer, CommentsSerializer

@api_view(['POST'])
def get_to_do_invoices(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        user_id = Users.objects.get(id=data.get('user_id'))
        current_date = timezone.now().date()
        yesterday = current_date - timedelta(days=1)
        tomorrow = current_date + timedelta(days=1)
        # Subquery to get the promised_date of the last comment for each customer
        last_comment = Comments.objects.filter(user = user_id, invoice=OuterRef('pk'), paid=False).order_by('-id')
        lis = []
        sales = Sales_Persons.objects
        data = SalesPersonsSerializer(sales, many=True).data
        for sale in data:
            lis.append(sale['name'])
    
        customers =Customers.objects.filter(user=user_id)
        # Annotate customers with the promised_date of the last comment
        if len(customers) > 0:
            customers = Customers.objects.annotate(
                last_promised_date=Subquery(last_comment.values('promised_date')[:1]),
                follow_up_date=Subquery(last_comment.values('follow_up_date')[:1]),
            ).filter(user = user_id)

            customers = customers.filter(
                last_promised_date__in=[yesterday, current_date, tomorrow],
                follow_up_date__in=[yesterday, current_date, tomorrow]
            ).order_by('last_promised_date')


            # Serialize the queryset
            customer_data = []
            for customer in customers:
                unpaid_invoices = Invoice.objects.filter(user=user_id, invoice=customer, paid=False)
                customer_dict = InvoiceSerializer(customer).data
                customer_dict['invoice_details'] = InvoiceDetailSerializer(unpaid_invoices, many=True).data
                comments = Comments.objects.filter(
                    Q(user=user_id) &
                    Q(invoice__account=customer.account) &
                    Q(paid=False) &
                    (Q(promised_date__in=[yesterday, current_date, tomorrow]) |
                    Q(follow_up_date__in=[yesterday, current_date, tomorrow]))
                )
                comments_data = CommentsSerializer(comments, many=True).data
                customer_dict['comments'] = comments_data
                
                customer_data.append(customer_dict)
        else:
            customer_data = []

        # Return the ordered customers as JSON response
        return JsonResponse({'sales_data': data , 'sales': lis, 'customer_data': customer_data}, safe=False)
    else:
        # Handle other HTTP methods (e.g., POST, PUT, DELETE)
        return JsonResponse({'error': 'Only POST method is allowed for this endpoint'}, status=405)
    



from django.http import JsonResponse
from django.utils import timezone
from datetime import timedelta
from django.db.models import Subquery, OuterRef, Q
from .models import Customers, Comments, Invoice
from .serializers import InvoiceSerializer, InvoiceDetailSerializer

@api_view(['POST'])
def get_pending_invoices(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        user_id = Users.objects.get(id=data.get('user_id'))
        current_date = timezone.now().date()
        yesterday = current_date - timedelta(days=1)
        lis = []
        sales = Sales_Persons.objects
        data = SalesPersonsSerializer(sales, many=True).data
        for sale in data:
            lis.append(sale['name'])
        # Subquery to get the promised_date of the last comment for each customer
        last_comment = Comments.objects.filter(user=user_id, invoice=OuterRef('pk')).order_by('-id')
        customers = Customers.objects.filter(user=user_id)
        # Annotate customers with the promised_date of the last comment
        if len(customers) > 0:
            customers = Customers.objects.annotate(
                last_promised_date=Subquery(last_comment.values('promised_date')[:1]),
                follow_up_date=Subquery(last_comment.values('follow_up_date')[:1]),
                
            ).filter(user = user_id)

            # Filter customers where there are no comments or last_promised_date is less than yesterday
            customers = customers.filter(Q(last_promised_date__lt=yesterday) | Q(last_promised_date__isnull=True) | Q(follow_up_date__lt=yesterday))

            # Order the customers with last_promised_date < yesterday at the top and others at the bottom
            customers = customers.annotate(is_old=Case(When(last_promised_date__lt=yesterday, then=Value(1)), default=Value(0), output_field=IntegerField())).order_by('-is_old', '-over_due')


            # Serialize the queryset
            customer_data = []
            for customer in customers:
                # Filter unpaid invoices
                unpaid_invoices = Invoice.objects.filter(invoice=customer, paid=False)
                customer_dict = InvoiceSerializer(customer).data
                customer_dict['invoice_details'] = InvoiceDetailSerializer(unpaid_invoices, many=True).data
                customer_data.append(customer_dict)
        else:
            customer_data = []
        # Return the    ordered customers as JSON response
        return JsonResponse({'sales_data': data , 'sales': lis, 'customer_data': customer_data}, safe=False)
    else:
        # Handle other HTTP methods (e.g., POST, PUT, DELETE)
        return JsonResponse({'error': 'Only POST method is allowed for this endpoint'}, status=405)



from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.views.decorators.csrf import csrf_exempt

import json
from .models import Sales_Persons


@csrf_exempt
@require_http_methods(["POST"])
def update_invoice_sales_person(request):
    try:
        # Parse input parameters from JSON data
        data = json.loads(request.body)
        sales_data = data.get('sales_Data')
        user_id = Users.objects.get(id=data.get('user_id'))

        for each in sales_data:
            ref_no = each[0]
            sales_person_name = each[1]
            print(f"Ref No: {ref_no}, Sales Person Name: {sales_person_name}")

            person = get_object_or_404(Invoice,user=user_id, ref_no=ref_no)
            sales_person_instance = get_object_or_404(Sales_Persons, name=sales_person_name)
            print(f"Fetched Sales Person: {sales_person_instance}")

            person.sales_person = sales_person_instance
            person.save()
            print(person.sales_person)

        return JsonResponse({'status': 'success', 'message': 'Comment updated successfully.'})

    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

from django.http import JsonResponse
from django.utils import timezone
from datetime import timedelta
from .models import Users
from rest_framework.decorators import api_view

@api_view(['POST'])
def login(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        users = Users.objects.filter(username=username)
        if len(users) > 0:
            if users[0].password == password:
                print('yes')
                return JsonResponse({'id': users[0].id, 'username': users[0].username})
            
        return JsonResponse({'error': 'Incorrect password'}, status=400)

    else:
        # Handle other HTTP methods (e.g., POST, PUT, DELETE)
        return JsonResponse({'error': 'Only POST method is allowed for this endpoint'}, status=405)


from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import Sales_Persons
from .serializers import SalesPersonsSerializer

@api_view(['POST'])
def create_sales(request):
    serializer = SalesPersonsSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)