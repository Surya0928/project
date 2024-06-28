from rest_framework import viewsets
from .models import Customers
from .serializers import InvoiceSerializer

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Customers.objects.all()
    serializer_class = InvoiceSerializer


from django.http import JsonResponse
from django.utils import timezone
from django.db.models import OuterRef, Subquery, Case, When, Value, IntegerField
from .models import Customers, Invoice, Comments, Sales_Persons, Name
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
        # Subquery to get the  of the last comment for each customer
        last_comment = Comments.objects.filter(user = user_id ,invoice=OuterRef('pk')).order_by('-id')

        customers = Customers.objects.filter(user = user_id)
        #print(customers)
        # Annotate customers with the promised_date of the last comment
        if len(customers)>0:
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
            #print(customers)
            # Serialize the queryset
            customer_data = []

            for customer in customers:
                # Filter unpaid invoices
                named = Name.objects.filter(user = user_id, invoice = customer)
                names = NameSerializer(named, many = True).data
                #     name_dic[name.id] = [name.name, name.phone_number]
                customer_dict = InvoiceSerializer(customer).data
                comments = Comments.objects.filter(user = customer_dict['user'], invoice = customer_dict['id'])
                customer_dict['comments'] =CommentsSerializer(comments, many = True).data
                customer_dict['names'] = names
                invoices = Invoice.objects.filter(user = user_id , invoice=customer, old = False, new = False).order_by('date', 'id')
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
        user = get_object_or_404(Users, id=data.get('user'))
        invoice = data.get('invoice_id')
        paid_status = data.get('paid_status')
        paid_date = data.get('paid_date')

        # Fetch the comment
        invoice = get_object_or_404(Invoice, id=invoice)
        customer = get_object_or_404(Customers, id = invoice.invoice.id)
        # Update the paid field of the comment
        if '/' in invoice.ref_no:
            invoice.ref_no = invoice.ref_no.split('/p')[0]
        invoice.paid = paid_status
        invoice.paid_date = paid_date
        invoice.save()
        if data.get('paid_status') == True:
            query |= Q(invoice_list__icontains=invoice.ref_no)
            comments = Comments.objects.filter(user=user, invoice=customer).filter(query)
            for every in comments:
                every.comment_paid =  True
                every.save()
            if invoice.days_passed > customer.credit_period:
                customer.over_due = customer.over_due - invoice.pending
            customer.total_due = customer.total_due - invoice.pending
            customer.save()
        else:
            if invoice.days_passed > customer.credit_period:
                customer.over_due = customer.over_due + invoice.pending
            customer.total_due = customer.total_due + invoice.pending
            customer.save()

        return JsonResponse({'status': 'success', 'message': 'Comment updated successfully.'})

    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

import pandas as pd
from datetime import datetime as dt
from io import BytesIO
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.db import transaction
from .models import Users, Customers, Invoice  # Adjust the import based on your actual project structure

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
        today = pd.Timestamp(dt.today().date())

        # Calculate number of days passed from due date to today
        df['days_passed'] = (today - df['due_date']).dt.days

        # Revert 'due_date' column back to original format
        df['due_date'] = original_due_on

        # Remove the 'days_passed' column (if present)
        if 'Overdue' in df.columns:
            df.drop('Overdue', axis=1, inplace=True)

        # Convert DataFrame back to CSV data (as bytes)
        updated_csv_data = df.to_csv(index=False).encode('utf-8')

        return updated_csv_data
    except Exception as e:
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
        customer = Customers.objects.filter(user=user_instance, account=account)

        # Track invoices from the CSV
        csv_invoice_refs = set()

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
                elif len(customer) > 0:
                    name = customer[0].name

                if not phone_number_found and pd.notna(each['phone_number']):
                    phone_number = each['phone_number']
                    phone_number_found = True
                elif len(customer) > 0:
                    phone_number = customer[0].phone_number

                csv_invoice_refs.add(each['ref_no'])

        defaults = {
            'optimal_due': round(optimal_due),
            'threshold_due': round(threshold_due),
            'over_due': round(over_due),
            'total_due': round(total_due),
            'invoices': invoices,
            'promised_date': customer[0].promised_date if len(customer) > 0 else None,
            'promised_amount': customer[0].promised_amount if len(customer) > 0 else 0.0,
            'name': name if name else None,
            'phone_number': phone_number if phone_number else None,
            'credit_period' : 90
        }

        customer, created = Customers.objects.using('default').update_or_create(
            account=account,
            user=user_instance,  # Pass user_instance to the model
            defaults=defaults
        )

        # Retrieve existing customer and update only non-empty fields
        if not created:
            for field, value in defaults.items():
                if value is not None:
                    setattr(customer, field, value)
            customer.save()

        for _, row in df.iterrows():
            if row['party_name'] == company:
                try:
                    date = dt.strptime(row['invoice_date'], '%d-%b-%y').date().strftime('%Y-%m-%d')
                    due_on = dt.strptime(row['due_date'], '%d-%b-%y').date().strftime('%Y-%m-%d')
                except ValueError:
                    continue
                
                new = False
                new_invo = Invoice.objects.filter(user = user_instance, invoice = customer, ref_no = row['ref_no'], new= False, old=False)
                if len(new_invo) == 0:
                    new = True
                
                invoice_defaults = {
                    'date': date,
                    'pending': float(row['pending_amount']),
                    'due_on': due_on,
                    'days_passed': int(row['days_passed']),
                    'new': new,
                    'old': False,
                }

                invoice, created = Invoice.objects.using('default').update_or_create(
                    user=user_instance,  # Pass user_instance to the model
                    invoice=customer,
                    ref_no=row['ref_no'],
                    defaults=invoice_defaults
                )

                # Retrieve existing invoice and update only non-empty fields
                if not created:
                    for field, value in invoice_defaults.items():
                        if value is not None:
                            setattr(invoice, field, value)
                    invoice.save()

        # Update old invoices
        all_invoices = Invoice.objects.filter(user=user_instance, invoice=customer, new= False, old=False, paid=False)
        for invoice in all_invoices:
            if invoice.ref_no not in csv_invoice_refs:
                invoice.old = True
                invoice.save()


from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import json
from .models import Users, Customers, Comments
from .serializers import CommentsSerializer
from datetime import date


@api_view(['POST'])
def create_comment(request):
    try:
        data = json.loads(request.body)
        user_id = Users.objects.get(id=data.get('user'))
        #print(data.get('invoices_paid'))
        customer = Customers.objects.get(user=user_id, account=data.get('invoice'))
        
        if data.get('invoices_paid'):
            paid_amount = data.get('invoices_paid_amount')
            if data.get('invoice_list'):
                invoice_list = data.get('invoice_list').split(', ')
                over_due = 0
                for each in invoice_list:
                    com = Comments.objects.filter(user = user_id, invoice = customer, invoice_list = data.get('invoice_list'))
                    for c in com:
                        c.comment_paid = data.get('invoices_paid')
                        c.save()
                    invoice = get_object_or_404(Invoice, ref_no=each, user=user_id, invoice=customer.id)
                    if invoice.days_passed >= customer.credit_period:
                        over_due+= invoice.pending
                    if invoice.pending <= paid_amount:
                        if '/p' in invoice.ref_no:
                            invoice.ref_no = invoice.ref_no.split('/p')[0]
                            
                        invoice.paid = data.get('invoices_paid')
                        invoice.paid_date = data.get('invoices_paid_date')
                        print(1)
                        invoice.save()
                        paid_amount -= invoice.pending
                    else:
                        invoice.ref_no = f'{invoice.ref_no}/part'
                        invoice.pending -= paid_amount
                        print(2)
                        invoice.save()
                        paid_amount = 0
                customer.over_due = customer.over_due - over_due
                customer.total_due = customer.total_due-data.get('invoices_paid_amount')
                customer.save()
                
                # Build the query to filter comments based on invoice_list
                query = Q()
                for ref_no in invoice_list:
                    query |= Q(invoice_list__icontains=ref_no)
                    comments = Comments.objects.filter(user=user_id, invoice=customer).filter(query)
                    for every in comments:
                        every.comment_paid =  True
                        every.save()
                    
        # else:
            ##print('no')

        if data.get('remarks').split('.')[0] == 'No Response':
            prom_am = 0.0
        else:
            prom_am = data.get('amount_promised')
            
        comment_data = {
            'user': user_id.id,
            'invoice': customer.id,
            'date': data.get('date'),
            'invoice_list': data.get('invoice_list'),
            'remarks': data.get('remarks'),
            'amount_promised': prom_am,
            'sales_person': data.get('sales_person'),
            'follow_up_date': data.get('follow_up_date'),
            'promised_date': data.get('promised_date'),
            'comment_paid': data.get('invoices_paid'),
            'follow_up_time': data.get('follow_up_time')
        }

        serializer = CommentsSerializer(data=comment_data)
        #print(serializer)
        if serializer.is_valid():
            #print(serializer.validated_data)
            comment = Comments.objects.create(
                user=user_id,
                invoice=customer,
                date=serializer.validated_data.get('date'),
                invoice_list=serializer.validated_data.get('invoice_list'),
                remarks=serializer.validated_data.get('remarks'),
                amount_promised=serializer.validated_data.get('amount_promised'),
                sales_person=serializer.validated_data.get('sales_person'),
                follow_up_date=serializer.validated_data.get('follow_up_date'),  # Corrected key
                promised_date=serializer.validated_data.get('promised_date'),
                comment_paid= serializer.validated_data.get('comment_paid'),
                follow_up_time= serializer.validated_data.get('follow_up_time')
            )
            
            return Response(CommentsSerializer(comment).data, status=status.HTTP_201_CREATED)
        
        # Return errors if serializer data is invalid
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
    #print(comments_queryset)

    # Serialize filtered queryset
    serializer = CommentsSerializer(comments_queryset, many=True)
    return Response(serializer.data)


from django.http import JsonResponse
from .models import Invoice, Customers, Users, Sales_Persons, Name, Comments
from .serializers import InvoiceDetailSerializer, InvoiceSerializer, NameSerializer, SalesPersonsSerializer
from rest_framework.decorators import api_view
import json
from datetime import datetime
from collections import OrderedDict

@api_view(['POST'])
def get_paid_Invoice(request):
    if request.method == 'POST':
        data = json.loads(request.body)

        user_id = Users.objects.get(id=data.get('user_id'))
        lis = []
        sales = Sales_Persons.objects.all()
        sales_data = SalesPersonsSerializer(sales, many=True).data
        for sale in sales_data:
            lis.append(sale['name'])

        customers = Customers.objects.filter(user=user_id)
        
        if len(customers) > 0:
            customer_data = []
            for customer in customers:
                named = Name.objects.filter(user=user_id, invoice=customer)
                names = NameSerializer(named, many=True).data
                customer_dict = InvoiceSerializer(customer).data
                customer_dict['names'] = names
                invoices = Invoice.objects.filter(user=user_id, invoice=customer, paid=True, old=False, new=False).order_by('-paid_date', '-pending')
                paid_amount = 0
                for each in invoices:
                    paid_amount += each.pending
                if len(invoices) > 0:
                    last_invoice = invoices[0]
                    if last_invoice.paid_date:
                        customer_dict['last_payment_date'] = last_invoice.paid_date.strftime('%d-%m-%Y')
                    else:
                        customer_dict['last_payment_date'] = None
                    customer_dict['amount_paid'] = paid_amount
                    customer_dict['number_of_invoices'] = len(invoices)
                    customer_dict['invoice_details'] = InvoiceDetailSerializer(invoices, many=True).data
                    customer_data.append(customer_dict)
        else:
            customer_data = []

        customer_data.sort(key=lambda x: datetime.strptime(x['last_payment_date'], '%d-%m-%Y') if x['last_payment_date'] else datetime.max, reverse=True)

        return JsonResponse({'sales_data': sales_data, 'sales': lis, 'customer_data': customer_data}, safe=False)
    else:
        return JsonResponse({'error': 'Only POST method is allowed for this endpoint'}, status=405)
    
from collections import OrderedDict
import json
from django.utils import timezone
from django.http import JsonResponse
from django.db.models import OuterRef, Subquery
from rest_framework.decorators import api_view
from rest_framework.response import Response
from datetime import datetime as dt  # Rename the datetime module to avoid conflicts
import datetime
import re



@api_view(['POST'])
def get_to_do_invoices(request):
    if request.method == 'POST':
        def add_ordinal_suffix(day):
            if 11 <= day <= 13:
                return f'{day}th'
            suffixes = {1: 'st', 2: 'nd', 3: 'rd'}
            return f'{day}{suffixes.get(day % 10, "th")}'
        
        def format_date(date):
            day_with_suffix = add_ordinal_suffix(date.day)
            formatted_date = date.strftime(f'{day_with_suffix} %B, %A')
            return formatted_date

        data = json.loads(request.body)
        user_id = data.get('user_id')
        current_date = timezone.now().date()
        
        # Subquery to get the promised_date and follow_up_date of the last comment for each customer
        last_comment = Comments.objects.filter(user=user_id, invoice=OuterRef('pk')).order_by('-id')
        lis = []
        sales = Sales_Persons.objects.all()
        sales_data = SalesPersonsSerializer(sales, many=True).data
        for sale in sales_data:
            lis.append(sale['name'])
        
        # Get list of customers for the user
        customers = Customers.objects.filter(user=user_id)
        
        # Annotate customers with the promised_date and follow_up_date of the last comment
        customers = customers.annotate(
            last_promised_date=Subquery(last_comment.values('promised_date')[:1]),
            follow_up_date=Subquery(last_comment.values('follow_up_date')[:1]),
        ).filter(user=user_id)
        
        full_data = OrderedDict()

        # Iterate through customers to classify them based on follow_up_date or promised_date
        for customer in customers:
            named = Name.objects.filter(user = user_id, invoice = customer)
            names = NameSerializer(named, many = True).data
            unpaid_invoices = Invoice.objects.filter(user=user_id, invoice=customer, paid=False, old = False, new = False)
            customer_dict = InvoiceSerializer(customer).data
            customer_dict['names'] = names
            customer_dict['invoice_details'] = InvoiceDetailSerializer(unpaid_invoices, many=True).data
            comments = Comments.objects.filter(
                user=user_id,
                invoice=customer,
                comment_paid=False,
            ).order_by('-id')
            if len(comments) > 0 and len(unpaid_invoices) > 0:
                comments_data = CommentsSerializer(comments, many=True).data
                customer_dict['comments'] = comments_data
                last_comment = comments[0]
                customer_dict['invoice_list'] = last_comment.invoice_list
                customer_dict['promised_amount'] = last_comment.amount_promised
                customer_dict['follow_up_date'] = dt.strptime(last_comment.follow_up_date.isoformat(), '%Y-%m-%d').strftime('%d-%m-%Y') if last_comment.follow_up_date else None
                customer_dict['follow_up_time'] = last_comment.follow_up_time
                customer_dict['promised_date'] = dt.strptime(last_comment.promised_date.isoformat(), '%Y-%m-%d').strftime('%d-%m-%Y') if last_comment.promised_date else None
                if last_comment.sales_person:
                    customer_dict['sales_person'] = Sales_Persons.objects.get(name=last_comment.sales_person).name
                else:
                    customer_dict['sales_person'] = ''
                
                # Determine the key date with follow_up_date taking priority
                key_date = customer_dict['follow_up_date'] or customer_dict['promised_date']
                if key_date:
                    key_date_obj = dt.strptime(key_date, '%d-%m-%Y').date()
                    if key_date_obj < current_date:
                        key_str = 'Pending'
                    elif key_date_obj == current_date:
                        key_str = 'Today'
                    else:
                        key_str = format_date(key_date_obj)
                else:
                    key_str = 'unknown_date'
                
                if key_str in full_data:
                    full_data[key_str].append(customer_dict)
                else:
                    full_data[key_str] = [customer_dict]
        
        # Sort the data within each key by follow_up_date or promised_date and then by follow_up_time
# Sort the data within each key by follow_up_date or promised_date and then by follow_up_time
        for key, customers_list in full_data.items():
            sorted_customers = sorted(customers_list, key=lambda x: (
                dt.strptime(x['follow_up_date'], '%d-%m-%Y') if x['follow_up_date'] else (
                    dt.strptime(x['promised_date'], '%d-%m-%Y') if x['promised_date'] else dt.max
                ),
                x['follow_up_time'] if x['follow_up_time'] else dt.min.time()  # Convert to datetime.time
            ))
            full_data[key] = sorted_customers


        # Create an ordered full_data dictionary with the specified key order
        ordered_full_data = OrderedDict()
        for key in ['Pending', 'Today']:
            if key in full_data:
                ordered_full_data[key] = full_data.pop(key)
        
        # Sort the remaining date keys and add them to the ordered_full_data
        sorted_date_keys = sorted(full_data.keys(), key=lambda x: (
            datetime.strptime(re.sub(r'\b(\d+)(st|nd|rd|th)\b', r'\1', x), '%d %B, %A') 
            if x != 'unknown_date' 
            else datetime.datetime.max
        ))



        for key in sorted_date_keys:
            ordered_full_data[key] = full_data[key]

        return Response({
            'sales_data': sales_data,
            'sales': lis,
            'full_data': ordered_full_data
        })

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
        last_comment = Comments.objects.filter(user=user_id, invoice=OuterRef('pk'), comment_paid=False).order_by('-id')
        customers = Customers.objects.filter(user=user_id)

        # Annotate customers with the promised_date of the last comment
        if len(customers) > 0:
            customers = customers.annotate(
                last_promised_date=Subquery(last_comment.values('promised_date')[:1]),
                follow_up_date=Subquery(last_comment.values('follow_up_date')[:1]),
            ).filter(user=user_id)

            # Filter customers where there are no comments or last_promised_date is less than yesterday
            customers = customers.filter(Q(last_promised_date__isnull=True) & Q(follow_up_date__isnull=True)).order_by('-over_due')

            # Serialize the queryset
            customer_data = []
            for customer in customers:
                customer_dict = InvoiceSerializer(customer).data
                comments = Comments.objects.filter(user=customer_dict['user'], invoice=customer_dict['id'], promised_date__isnull=False, follow_up_date__isnull=False)
                customer_dict['comments'] = CommentsSerializer(comments, many=True).data

                # Filter unpaid invoices
                unpaid_invoices = Invoice.objects.filter(user = user_id, invoice=customer, paid=False, old=False, new=False)

                if len(unpaid_invoices) > 0:
                    named = Name.objects.filter(user=user_id, invoice=customer)
                    names = NameSerializer(named, many=True).data
                    customer_dict['names'] = names  # Add names here
                    customer_dict['invoice_details'] = InvoiceDetailSerializer(unpaid_invoices, many=True).data
                    # print(customer_dict)
                    customer_data.append(customer_dict)
        else:   
            customer_data = []

        # Return the ordered customers as JSON response
        return JsonResponse({'sales_data': data, 'sales': lis, 'customer_data': customer_data}, safe=False)
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
            #print(f"Ref No: {ref_no}, Sales Person Name: {sales_person_name}")

            person = get_object_or_404(Invoice,user=user_id, ref_no=ref_no)
            sales_person_instance = get_object_or_404(Sales_Persons, name=sales_person_name)
            #print(f"Fetched Sales Person: {sales_person_instance}")

            person.sales_person = sales_person_instance
            person.save()
            #print(person.sales_person)

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
            print(1)
            customers = Customers.objects.filter(user = get_object_or_404(Users, id = users[0].id))
            if users[0].password == password:
                #print(''yes')
                return JsonResponse({'id': users[0].id, 'username': users[0].username,'user_role' : users[0].role, 'customers' : len(customers)})
            
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


import csv
from django.http import HttpResponse
from django.core.management.base import BaseCommand

def export_to_csv(model_class, file_path):
    # Open or create the CSV file
    with open(file_path, 'w', newline='') as csvfile:
        # Get the field names from the model
        field_names = [field.name for field in model_class._meta.fields]
        
        # Create a CSV writer
        writer = csv.writer(csvfile)
        
        # Write the header row
        writer.writerow(field_names)
        
        # Write data rows
        for instance in model_class.objects.all():
            writer.writerow([getattr(instance, field) for field in field_names])
    
    #print('f'Data exported successfully to {file_path}')

# export_to_csv(Sales_Persons, 'sales_persons.csv')
# export_to_csv(Users, 'users.csv')
# # export_to_csv(Customers, 'customers.csv')   
# export_to_csv(Comments, 'comments.csv')
# export_to_csv(Invoice, 'invoices.csv')


import csv
from django.core.exceptions import ObjectDoesNotExist
from django.utils.dateparse import parse_date, parse_datetime
from .serializers import UsersSerializer


def import_from_csv(model_class, file_path):
    # Open the CSV file
    with open(file_path, newline='') as csvfile:
        # Create a CSV reader
        reader = csv.DictReader(csvfile)
        
        for row in reader:
            # Create a dictionary to hold the field values
            if model_class == Users:
                user_values = {}
                for field in model_class._meta.fields:
                    field_name = field.name
                    field_value = row[field_name]
                    user_values[field_name]= field_value
                users = {
                    'username' : user_values['username'] or '',
                    'password' : user_values['password'] or '',
                    'address' : user_values['address'] or '',
                    'role' : user_values['role'] or ''
                }

                serializer = UsersSerializer(data=users)
                #print('serializer, 2)
                if serializer.is_valid():
                    #print('serializer.validated_data, 1)
                    user = Users.objects.create(
                        username = serializer.validated_data.get('username'),
                        password = serializer.validated_data.get('password'),
                        address = serializer.validated_data.get('address'),
                        role = serializer.validated_data.get('role'),
                    )
                    # return Response(UsersSerializer(user).data, status=status.HTTP_201_CREATED)
            if model_class == Sales_Persons:
                sales_values = {}
                for field in model_class._meta.fields:
                    field_name = field.name
                    field_value = row[field_name]
                    sales_values[field_name]= field_value
                    #print('sales_values)
                sales = {
                    'name' : sales_values['name'] or '',
                    'phone_number' : sales_values['phone_number'] or '',
                    'address' : sales_values['address'] or '',
                    'email' : sales_values['email'] or ''
                }

                serializer = SalesPersonsSerializer(data=sales)
                #print('serializer, 2)
                if serializer.is_valid():
                    #print('serializer.validated_data, 1)
                    sale = Sales_Persons.objects.create(
                        name = serializer.validated_data.get('name'),
                        phone_number = serializer.validated_data.get('phone_number'),
                        address = serializer.validated_data.get('address'),
                        email = serializer.validated_data.get('email'),
                    )
                    # return Response(SalesPersonsSerializer(sale).data, status=status.HTTP_201_CREATED)


from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import Name
from .serializers import NameSerializer

@api_view(['POST'])
def create_customer_name(request):
    data = json.loads(request.body)
    user = get_object_or_404(Users, id = data.get('user')).id
    invoice = get_object_or_404(Customers, user = data.get('user'), account = data.get('invoice'))
    credit = data.get('credit_period')
    if credit:
        print(credit)
        invoice.credit_period = credit
        over_due = 0
        invoice_list = Invoice.objects.filter(user=data.get('user'), days_passed__gt=credit)
        for each in invoice_list:
            over_due+= each.pending
        invoice.over_due = over_due
        invoice.save()
        print(invoice.credit_period)
    name = data.get('name')
    phone_number = data.get('phone_number')
    if name and phone_number:
        form = {
            'user': user,
            'invoice': invoice.account,
            'name': name,
            'phone_number': phone_number,

        }
        serializer = NameSerializer(data=request.data)
        if serializer.is_valid():
            name = Name.objects.create(
                user = get_object_or_404(Users, id=serializer.validated_data.get('user')),
                invoice = get_object_or_404(Customers,user =serializer.validated_data.get('user'), account = serializer.validated_data.get('invoice')),
                name = serializer.validated_data.get('name'),
                phone_number = serializer.validated_data.get('phone_number'),
                
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    return Response('default')

@api_view(['POST'])
def get_review_invoices(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        user_id = Users.objects.get(id=data.get('user_id'))
        
        invoices_new = Invoice.objects.filter(user = user_id, new = True)
        invoices_old = Invoice.objects.filter(user = user_id, old = True)
        
        new = InvoiceDetailSerializer(invoices_new, many = True).data
        old = InvoiceDetailSerializer(invoices_old, many = True).data

        # Return the ordered customers as JSON response
        return JsonResponse({'invoices_new' : new, 'invoices_old': old}, safe=False)
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
def new_invoice_acceptance(request):
    try:
        # Parse input parameters from JSON data
        data = json.loads(request.body)
        id = data.get('id')
        acceptance = data.get('acceptance')

        # Fetch the comment
        invoice = get_object_or_404(Invoice, id=id)
        if acceptance == True:
            invoice.new = False
            invoice.old = False
            invoice.save()
        else:
            invoice.delete()

        # Update the paid field of the comment


        return JsonResponse({'status': 'success', 'message': 'Acceptance done properly.'})

    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def old_invoice_acceptance(request):
    try:
        # Parse input parameters from JSON data
        data = json.loads(request.body)
        id = data.get('id')
        user = get_object_or_404(Users, id = data.get('user'))
        paid_status = data.get('paid_status')
        paid_date =  data.get('paid_date')

        # Fetch the comment
        invoice = get_object_or_404(Invoice, id=id)
        customer = get_object_or_404(Customers, id=invoice.invoice.id)
        invoice.new = False
        invoice.old = False
        invoice.paid = paid_status
        if paid_status == True:
            query = Q()
            query |= Q(invoice_list__icontains=invoice.ref_no)
            comments = Comments.objects.filter(user=user, invoice=customer).filter(query)
            for every in comments:
                every.comment_paid =  True
                every.save()
            invoice.paid_date = paid_date
        invoice.save()
        if invoice.days_passed > customer.credit_period:
            customer.over_due = customer.over_due - invoice.pending
        customer.total_due = customer.total_due - invoice.pending
        customer.save()

        # Update the paid field of the comment


        return JsonResponse({'status': 'success', 'message': 'paid status done properly.'})

    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    

from django.http import JsonResponse
from django.shortcuts import get_object_or_404
import json
from .models import Invoice

@csrf_exempt
@require_http_methods(["POST"])
def bulk_invoice_acceptance(request):
    try:
        # Parse input parameters from JSON data
        data = json.loads(request.body)
        invoice_ids = data.get('invoice_ids')
        acceptance = data.get('acceptance')

        if not isinstance(invoice_ids, list):
            return JsonResponse({'status': 'error', 'message': 'invoice_ids should be a list'}, status=400)

        for invoice_id in invoice_ids:
            invoice = get_object_or_404(Invoice, id=invoice_id)
            if acceptance:
                invoice.new = False
                invoice.old = False
                invoice.save()
            else:
                invoice.delete()

        return JsonResponse({'status': 'success', 'message': 'Invoices processed successfully.'})

    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

# def bulk_credit_period_change():
#     customers =  Customers.objects.all()
#     for customer in customers:
#         customer.credit_period = 90
#         customer.save()
# bulk_credit_period_change()


@api_view(['POST'])
def get_all_sales(request):
    if request.method == 'POST':
        data = json.loads(request.body)

        sales = Sales_Persons.objects
        data = SalesPersonsSerializer(sales, many=True).data
        return JsonResponse({'sales_data': data}, safe=False)
    else:
        # Handle other HTTP methods (e.g., POST, PUT, DELETE)
        return JsonResponse({'error': 'Only POST method is allowed for this endpoint'}, status=405)
    

@api_view(['POST'])
def get_all_accountants(request):
    if request.method == 'POST':
        data = json.loads(request.body)

        accountants = Users.objects.filter(role = 'Accountant')
        data = UsersSerializer(accountants, many=True).data
        return JsonResponse({'accountants': data}, safe=False)
    else:
        # Handle other HTTP methods (e.g., POST, PUT, DELETE)
        return JsonResponse({'error': 'Only POST method is allowed for this endpoint'}, status=405)
    
from django.http import JsonResponse
from rest_framework.decorators import api_view
import json
from datetime import datetime, timedelta
from .models import Users, Customers, Comments

@api_view(['POST'])
def manager_1(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        

        total_outstanding = 0
        total_over_due = 0
        projected_all_col = 0
        projected_this_month_col = 0
        projected_this_week_col = 0
        projected_today_col = 0

        # Define date ranges
        today = datetime.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        end_of_week = start_of_week + timedelta(days=6)
        start_of_month = today.replace(day=1)
        end_of_month = (start_of_month.replace(month=(start_of_month.month % 12) + 1, day=1) - timedelta(days=1))

        if data.get('accountant') == 'all':
            accountants = Users.objects.filter(role = 'Accountant')
            for each in accountants:
                customers = Customers.objects.filter(user=each)
                for customer in customers:
                    total_outstanding += customer.total_due
                    total_over_due += customer.over_due
                    comments = Comments.objects.filter(user=each, invoice=customer, comment_paid=False).order_by('-id')
                    

                    if comments.exists():
                        comment = comments.first()
                        if comment.remarks.split('.')[0] != "No Response":
                            projected_all_col += comment.amount_promised

                            # Parse dates if they are in string format, otherwise use them directly
                            if isinstance(comment.promised_date, str):
                                try:
                                    promised_date = datetime.strptime(comment.promised_date, '%Y-%m-%d').date()
                                except ValueError:
                                    promised_date = None
                            else:
                                promised_date = comment.promised_date

                            if isinstance(comment.follow_up_date, str):
                                try:
                                    follow_up_date = datetime.strptime(comment.follow_up_date, '%Y-%m-%d').date()
                                except ValueError:
                                    follow_up_date = None
                            else:
                                follow_up_date = comment.follow_up_date

                            # Check for this month
                            if (promised_date and start_of_month <= promised_date <= end_of_month) or \
                            (follow_up_date and start_of_month <= follow_up_date <= end_of_month):
                                projected_this_month_col += comment.amount_promised

                            # Check for this week
                            if (promised_date and start_of_week <= promised_date <= end_of_week) or \
                            (follow_up_date and start_of_week <= follow_up_date <= end_of_week):
                                projected_this_week_col += comment.amount_promised

                            # Check for today
                            if (promised_date == today) or (follow_up_date == today):
                                projected_today_col += comment.amount_promised

        else:
            accountant = Users.objects.get(username=data.get('accountant'))
            customers = Customers.objects.filter(user=accountant)
            for customer in customers:
                total_outstanding += customer.total_due
                total_over_due += customer.over_due
                comments = Comments.objects.filter(user=accountant, invoice=customer, comment_paid=False).order_by('-id')
                

                if comments.exists():
                    comment = comments.first()
                    if comment.remarks.split('.')[0] != "No Response":
                        projected_all_col += comment.amount_promised

                        # Parse dates if they are in string format, otherwise use them directly
                        if isinstance(comment.promised_date, str):
                            try:
                                promised_date = datetime.strptime(comment.promised_date, '%Y-%m-%d').date()
                            except ValueError:
                                promised_date = None
                        else:
                            promised_date = comment.promised_date

                        if isinstance(comment.follow_up_date, str):
                            try:
                                follow_up_date = datetime.strptime(comment.follow_up_date, '%Y-%m-%d').date()
                            except ValueError:
                                follow_up_date = None
                        else:
                            follow_up_date = comment.follow_up_date

                        # Check for this month
                        if (promised_date and start_of_month <= promised_date <= end_of_month) or \
                        (follow_up_date and start_of_month <= follow_up_date <= end_of_month):
                            projected_this_month_col += comment.amount_promised

                        # Check for this week
                        if (promised_date and start_of_week <= promised_date <= end_of_week) or \
                        (follow_up_date and start_of_week <= follow_up_date <= end_of_week):
                            projected_this_week_col += comment.amount_promised

                        # Check for today
                        if (promised_date == today) or (follow_up_date == today):
                            projected_today_col += comment.amount_promised

        projected_collection = {
            'projected_all_col': projected_all_col,
            'projected_this_month_col': projected_this_month_col,
            'projected_this_week_col': projected_this_week_col,
            'projected_today_col': projected_today_col,
        }

        return JsonResponse({'total_outstanding': total_outstanding, 'total_over_due': total_over_due, 'projected_collection': projected_collection}, safe=False)
    else:
        return JsonResponse({'error': 'Only POST method is allowed for this endpoint'}, status=405)

from django.http import JsonResponse
from rest_framework.decorators import api_view
import json
from datetime import datetime, timedelta
from .models import Users, Invoice

@api_view(['POST'])
def manager_2(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        
        account_details = {
            'today': [],
            'yesterday': [],
            'last_seven_days': [],
            'this_month': [],
        }
        accounts_reached = {
            'total': 0,
            'today': 0,
            'yesterday': 0,
            'last_seven_days': 0,
            'this_month': 0,
        }

        # Define date ranges
        today = datetime.now().date()
        yesterday = today - timedelta(days=1)
        last_seven_days_start = today - timedelta(days=7)
        start_of_month = today.replace(day=1)

        if data.get('accountant') == 'all':
            accountants = Users.objects.filter(role = 'Accountant')
            
            for each in accountants:
                customers = Customers.objects.filter(user = each)
                for customer in customers:
                    comments = Comments.objects.filter(user = each, invoice = customer, comment_paid=False).order_by('-id')
                    if len(comments) > 0:
                        comment = comments[0]
                        accounts_reached['total'] += 1

                        date =comment.date

                        if date and  isinstance(date, str):
                            date = datetime.strptime(date, '%Y-%m-%d').date()

                        if date:
                            if comment.sales_person:
                                sales_person = comment.sales_person.name
                            else:
                                sales_person = comment.sales_person
                            if (date and date == today):
                                accounts_reached['today'] += 1
                                account_details['today'].append({'account' :comment.invoice.account, 'invoices' :comment.invoice_list, 'amount' :comment.amount_promised, 'remarks' : comment.remarks, 'sales_person' : sales_person, 'date' :comment.date, 'follow_up_date' : comment.follow_up_date, 'promised_payment_date' : comment.promised_date})

                            # Check for yesterday
                            if (date and date == yesterday):
                                accounts_reached['yesterday'] += 1
                                account_details['yesterday'].append({'account' :comment.invoice.account, 'invoices' :comment.invoice_list, 'amount' :comment.amount_promised, 'remarks' : comment.remarks, 'sales_person' : sales_person, 'date' :comment.date, 'follow_up_date' : comment.follow_up_date, 'promised_payment_date' : comment.promised_date})

                            # Check for last seven days
                            if (date and last_seven_days_start <= date <= today):
                                accounts_reached['last_seven_days'] += 1
                                account_details['last_seven_days'].append({'account' :comment.invoice.account, 'invoices' :comment.invoice_list, 'amount' :comment.amount_promised, 'remarks' : comment.remarks, 'sales_person' : sales_person, 'date' :comment.date, 'follow_up_date' : comment.follow_up_date, 'promised_payment_date' : comment.promised_date})

                            # Check for this month
                            if (date and start_of_month <= date <= today):
                                accounts_reached['this_month'] += 1
                                account_details['this_month'].append({'account' :comment.invoice.account, 'invoices' :comment.invoice_list, 'amount' :comment.amount_promised, 'remarks' : comment.remarks, 'sales_person' : sales_person, 'date' :comment.date, 'follow_up_date' : comment.follow_up_date, 'promised_payment_date' : comment.promised_date})

        else:
            accountant = Users.objects.get(username=data.get('accountant'))
            customers = Customers.objects.filter(user=accountant)
            for customer in customers:
                comments = Comments.objects.filter(user = accountant, invoice = customer, comment_paid = False).order_by('-id')
                if len(comments) > 0:
                    comment = comments[0]
                    accounts_reached['total'] += 1

                    date =comment.date

                    if date and  isinstance(date, str):
                        date = datetime.strptime(date, '%Y-%m-%d').date()

                    if date:
                        if comment.sales_person:
                            sales_person = comment.sales_person.name
                        else:
                            sales_person = comment.sales_person
                        if (date and date == today):
                            accounts_reached['today'] += 1
                            account_details['today'].append({'account' :comment.invoice.account, 'invoices' :comment.invoice_list, 'amount' :comment.amount_promised, 'remarks' : comment.remarks, 'sales_person' : sales_person, 'date' :comment.date, 'follow_up_date' : comment.follow_up_date, 'promised_payment_date' : comment.promised_date})

                        # Check for yesterday
                        if (date and date == yesterday):
                            accounts_reached['yesterday'] += 1
                            account_details['yesterday'].append({'account' :comment.invoice.account, 'invoices' :comment.invoice_list, 'amount' :comment.amount_promised, 'remarks' : comment.remarks, 'sales_person' : sales_person, 'date' :comment.date, 'follow_up_date' : comment.follow_up_date, 'promised_payment_date' : comment.promised_date})

                        # Check for last seven days
                        if (date and last_seven_days_start <= date <= today):
                            accounts_reached['last_seven_days'] += 1
                            account_details['last_seven_days'].append({'account' :comment.invoice.account, 'invoices' :comment.invoice_list, 'amount' :comment.amount_promised, 'remarks' : comment.remarks, 'sales_person' : sales_person, 'date' :comment.date, 'follow_up_date' : comment.follow_up_date, 'promised_payment_date' : comment.promised_date})

                        # Check for this month
                        if (date and start_of_month <= date <= today):
                            accounts_reached['this_month'] += 1
                            account_details['this_month'].append({'account' :comment.invoice.account, 'invoices' :comment.invoice_list, 'amount' :comment.amount_promised, 'remarks' : comment.remarks, 'sales_person' : sales_person, 'date' :comment.date, 'follow_up_date' : comment.follow_up_date, 'promised_payment_date' : comment.promised_date})

        response_data = {
            'accounts_reached': accounts_reached,
            'account_details': account_details
        }
        return JsonResponse(response_data, safe=False)
    else:
        return JsonResponse({'error': 'Only POST method is allowed for this endpoint'}, status=405)


from django.http import JsonResponse
from rest_framework.decorators import api_view
import json
from datetime import datetime, timedelta
from .models import Users, Invoice

@api_view(['POST'])
def manager_3(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        
        account_details = {
            'today': [],
            'yesterday': [],
            'last_seven_days': [],
            'this_month': [],
        }
        amount_collected = {
            'total': 0,
            'today': 0,
            'yesterday': 0,
            'last_seven_days': 0,
            'this_month': 0,
        }

        # Define date ranges
        today = datetime.now().date()
        yesterday = today - timedelta(days=1)
        last_seven_days_start = today - timedelta(days=7)
        start_of_month = today.replace(day=1)

        if data.get('accountant') == 'all':
            accountants = Users.objects.filter(role = 'Accountant')
            for each in accountants:
                customers = Customers.objects.filter(user = each)
                for customer in customers:
                    invoices = Invoice.objects.filter(user = each,invoice = customer,paid=True).order_by('-paid_date')
                    for invoice in invoices:
                        amount_collected['total'] += invoice.pending

                        paid_date = invoice.paid_date
                        if isinstance(paid_date, str):
                            paid_date = datetime.strptime(paid_date, '%Y-%m-%d').date()

                        # Check for today
                        if paid_date == today:
                            amount_collected['today'] += invoice.pending
                            account_details['today'].append({'account' : invoice.invoice.account, 'invoice' : invoice.ref_no, 'payment_date' : invoice.paid_date, 'amount' : invoice.pending})

                        # Check for yesterday
                        if paid_date == yesterday:
                            amount_collected['yesterday'] += invoice.pending
                            account_details['yesterday'].append({'account' : invoice.invoice.account, 'invoice' : invoice.ref_no, 'payment_date' : invoice.paid_date, 'amount' : invoice.pending})

                        # Check for last seven days
                        if last_seven_days_start <= paid_date <= today:
                            amount_collected['last_seven_days'] += invoice.pending
                            account_details['last_seven_days'].append({'account' : invoice.invoice.account, 'invoice' : invoice.ref_no, 'payment_date' : invoice.paid_date, 'amount' : invoice.pending})

                        # Check for this month
                        if start_of_month <= paid_date <= today:
                            amount_collected['this_month'] += invoice.pending
                            account_details['this_month'].append({'account' : invoice.invoice.account, 'invoice' : invoice.ref_no, 'payment_date' : invoice.paid_date, 'amount' : invoice.pending})

        else:
            accountant = Users.objects.get(username=data.get('accountant'))
            customers = Customers.objects.filter(user = accountant)
            for customer in customers:
                invoices = Invoice.objects.filter(user=accountant,invoice=customer, paid=True).order_by('-paid_date')
                for invoice in invoices:
                    amount_collected['total'] += invoice.pending

                    paid_date = invoice.paid_date
                    if isinstance(paid_date, str):
                        paid_date = datetime.strptime(paid_date, '%Y-%m-%d').date()

                    # Check for today
                    if paid_date == today:
                        amount_collected['today'] += invoice.pending
                        account_details['today'].append({'account' : invoice.invoice.account, 'invoice' : invoice.ref_no, 'payment_date' : invoice.paid_date, 'amount' : invoice.pending})

                    # Check for yesterday
                    if paid_date == yesterday:
                        amount_collected['yesterday'] += invoice.pending
                        account_details['yesterday'].append({'account' : invoice.invoice.account, 'invoice' : invoice.ref_no, 'payment_date' : invoice.paid_date, 'amount' : invoice.pending})

                    # Check for last seven days
                    if last_seven_days_start <= paid_date <= today:
                        amount_collected['last_seven_days'] += invoice.pending
                        account_details['last_seven_days'].append({'account' : invoice.invoice.account, 'invoice' : invoice.ref_no, 'payment_date' : invoice.paid_date, 'amount' : invoice.pending})

                    # Check for this month
                    if start_of_month <= paid_date <= today:
                        amount_collected['this_month'] += invoice.pending
                        account_details['this_month'].append({'account' : invoice.invoice.account, 'invoice' : invoice.ref_no, 'payment_date' : invoice.paid_date, 'amount' : invoice.pending})



        response_data = {
            'amount_collected': amount_collected,
            'account_details': account_details
        }

        return JsonResponse(response_data, safe=False)
    else:
        return JsonResponse({'error': 'Only POST method is allowed for this endpoint'}, status=405)

from django.http import JsonResponse
import json

@api_view(['POST'])
def manager_4(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        conditions = data.get('data')
        customers_to_include = []
        def code(conditions, condition_counts):
            overall = ''
            for condition in range(len(conditions)):
                if condition != len(conditions) -1:
                    overall += f'{str(condition_counts[conditions[condition]["condition"]])} > {conditions[condition]["count"]} {conditions[condition]["conjunction"].lower()} '
                else:
                    overall += f'{str(condition_counts[conditions[condition]["condition"]])} > {conditions[condition]["count"]}'
            return(eval(overall))
        if data.get('accountant') == 'all':
            accountants = Users.objects.filter(role='Accountant')
            for accountant in accountants:
                customers = Customers.objects.filter(user=accountant)

                for customer in customers:
                    comments = Comments.objects.filter(user=accountant, invoice=customer, comment_paid=False)
                    condition_counts = {'No Response' : 0, 'Requested Call Back' : 0, 'Other' : 0}
                    for comment in comments:
                        if '.' in comment.remarks:
                            remark = comment.remarks.split('.')[0]
                            print(remark, customer)
                            print(condition_counts[remark])  # Get the first part of remarks, convert to lowercase
                            if remark in condition_counts.keys():
                                condition_counts[remark] += 1
                            else:
                                condition_counts['Other'] +=1
                        else:
                            condition_counts['Other'] +=1
                    # print(condition_counts, customer.account)
                    is_in = code(conditions, condition_counts)
                    if is_in:
                        # Account name, person name & contact number, number of comments, amount overdue, days overdue
                        formated = {
                            'account' : customer.account,
                            'names' : NameSerializer(Name.objects.filter(user = accountant, invoice = customer), many = True).data,
                            'number_of_comments' : len(comments),
                            'amount_over_due' : customer.over_due,
                            'days_overdue' : Invoice.objects.filter(user = accountant, invoice = customer).order_by('-days_passed')[0].days_passed
                        }
                        customers_to_include.append(formated)
            
        else:
            accountant = get_object_or_404(Users, username = data.get('accountant'))
            customers = Customers.objects.filter(user=accountant)

            for customer in customers:
                comments = Comments.objects.filter(user=accountant, invoice=customer, comment_paid=False)
                condition_counts = {'No Response' : 0, 'Requested Call Back' : 0, 'Other' : 0}
                for comment in comments:
                    if '.' in comment.remarks:
                        remark = comment.remarks.split('.')[0]
                        print(remark, customer)
                        print(condition_counts[remark])  # Get the first part of remarks, convert to lowercase
                        if remark in condition_counts.keys():
                            condition_counts[remark] += 1
                        else:
                            condition_counts['Other'] +=1
                    else:
                        condition_counts['Other'] +=1
                # print(condition_counts, customer.account)
                is_in = code(conditions, condition_counts)
                if is_in:
                    # Account name, person name & contact number, number of comments, amount overdue, days overdue
                    formated = {
                        'account' : customer.account,
                        'names' : NameSerializer(Name.objects.filter(user = accountant, invoice = customer), many = True).data,
                        'number_of_comments' : len(comments),
                        'amount_over_due' : customer.over_due,
                        'days_overdue' : Invoice.objects.filter(user = accountant, invoice = customer, paid = False).order_by('-days_passed')[0].days_passed
                    }
                    customers_to_include.append(formated)
        
        return JsonResponse({'customers_to_include': customers_to_include, 'number_of_customers' : len(customers_to_include)}, safe=False)
    else:
        return JsonResponse({'error': 'Only POST method is allowed for this endpoint'}, status=405)

@api_view(['POST'])
def all_users(request):
    if request.method == 'POST':
        data = UsersSerializer(Users.objects.exclude(role='Manager'), many=True).data

        return JsonResponse({'Users': data}, safe=False)
    else:
        return JsonResponse({'error': 'Only POST method is allowed for this endpoint'}, status=405)


@api_view(['POST'])
def create_user(request):
    data = json.loads(request.body)
    username = data.get('username')
    password = data.get('password')
    address = data.get('address')
    role = data.get('role')
    if username and password and role:
        form = {
            'username': username,
            'password': password,
            'address': address,
            'role': role,

        }
        serializer = UsersSerializer(data=request.data)
        if serializer.is_valid():
            users = Users.objects.create(
                username = serializer.validated_data.get('username'),
                password = serializer.validated_data.get('password'),
                address = serializer.validated_data.get('address'),
                role = serializer.validated_data.get('role'),
                
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    return Response('default')