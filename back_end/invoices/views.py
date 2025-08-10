from bs4 import BeautifulSoup
from rest_framework import viewsets
from .models import Customers
from .serializers import InvoiceSerializer
from django.views.decorators.csrf import csrf_exempt


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Customers.objects.all()
    serializer_class = InvoiceSerializer


from datetime import datetime as dt
from datetime import datetime
import requests
from bs4 import BeautifulSoup
import pandas as pd
from io import BytesIO
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.db import transaction
from .models import Users, Customers, Invoice

def fetch_html_data(url):
    url = url
    headers = {'Content-Type': 'text/xml'}
    xml_body = """
    <ENVELOPE>
        <HEADER>
            <TALLYREQUEST>Export Data</TALLYREQUEST>
        </HEADER>
        <BODY>
            <EXPORTDATA>
                <REQUESTDESC>
                    <STATICVARIABLES>
                        <SVFROMDATE>20250810</SVFROMDATE>
                        <SVTODATE>20250810</SVTODATE>
                        <SVEXPORTFORMAT>$$SysName:HTML</SVEXPORTFORMAT>
                    </STATICVARIABLES>
                    <REPORTNAME>Bills Receivable</REPORTNAME>
                </REQUESTDESC>
            </EXPORTDATA>
        </BODY>
    </ENVELOPE>
    """

    response = requests.post(url, headers=headers, data=xml_body)
    response.raise_for_status()  # Raise an exception for HTTP errors
    return response.text

def parse_html_to_csv(html_data):
    soup = BeautifulSoup(html_data, 'html.parser')

    outer_tables = soup.find_all('table', width="1297")
    if len(outer_tables) < 2:
        raise ValueError("The second outer table was not found")

    second_outer_table = outer_tables[1]
    inner_tables = second_outer_table.find_all('table', width="100%")
    if len(inner_tables) < 3:
        raise ValueError("The third inner table within the second outer table was not found")

    third_inner_table = inner_tables[2]
    final_tables = third_inner_table.find_all('table')

    column_names_td = final_tables[0].find_all('td')
    columns = []
    for column in column_names_td:
        cleaned_text = column.text.strip().replace('\xa0', '')
        if cleaned_text:  # Add to the list only if it's not empty
            columns.append(cleaned_text)

    rows_and_values = final_tables[2:-1]
    rows = []
    for row in rows_and_values:
        single_row = []
        row_value = row.find_all('td')
        for every in row_value:
            cleaned_text = every.text.strip().replace('\xa0', '')
            if cleaned_text:  # Add to the row only if it's not empty
                single_row.append(cleaned_text)
        single_row[3] = round(float(single_row[3].replace(',', '')))
        rows.append(single_row)

    # Convert data to CSV format using pandas
    df = pd.DataFrame(rows, columns=columns)
    csv_data = df.to_csv(index=False)
    return csv_data

def update_csv_file_format(csv_data):
    try:
        # Convert CSV data to a pandas DataFrame
        df = pd.read_csv(BytesIO(csv_data.encode('utf-8')))

        # Log the columns to debug
        print("Columns in the CSV data:", df.columns.tolist())

        # Define existing and new columns
        existing_columns = ['Date', 'Ref. No.', "Party's Name", 'Pending', 'Due on']
        new_columns = ['Name', 'Phone Number']
        
        # Ensure the DataFrame only contains the existing necessary columns
        df = df[existing_columns]

        # Rename columns to desired names
        new_column_names = {
            'Date': 'invoice_date',
            'Ref. No.': 'ref_no',
            'Party\'s Name': 'party_name',
            'Pending': 'pending_amount',
            'Due on': 'due_date'
        }
        df = df.rename(columns=new_column_names)

        # Add 'name' and 'phone_number' columns with default None values
        df['name'] = None
        df['phone_number'] = None

        # Convert 'due_date' column to datetime to calculate days passed
        df['due_date'] = pd.to_datetime(df['due_date'], format='%d-%b-%y', errors='coerce')

        # Filter out rows with invalid datetime values (e.g., 'NaT' values)
        df = df.dropna(subset=['due_date'])

        # Convert today's date to pandas Timestamp (to match 'due_date' datatype)
        today = pd.Timestamp(dt.today().date())

        # Calculate number of days passed from due date to today
        df['days_passed'] = (today - df['due_date']).dt.days

        # Convert DataFrame back to CSV data
        updated_csv_data = df.to_csv(index=False).encode('utf-8')

        return updated_csv_data
    except Exception as e:
        print("Error in update_csv_file_format:", e)
        raise e  # Reraise the exception to propagate it to the caller

def parse_date(date_str):
    date_formats = ["%d-%b-%y", "%d/%m/%Y", "%Y-%m-%d", "%m-%d-%Y", "%m/%d/%Y"]  # Add more formats as needed
    for fmt in date_formats:
        try:
            date_obj = datetime.strptime(date_str, fmt)
            formatted_date = date_obj.strftime("%Y-%m-%d")
            return {"success": True, "formatted_date": formatted_date}
        except ValueError:
            continue
    return {"success": False, "error": "Invalid date format"}

def import_data_from_csv(df, user_id):
    print("DataFrame content:")
    print(df)
    
    unique_list = df['party_name'].unique().tolist()
    user_instance = Users.objects.get(id=user_id)

    for company in unique_list:
        account = company
        name = ''
        phone_number = ''
        invoices, total_due, optimal_due, threshold_due, over_due = 0.0, 0.0, 0.0, 0.0, 0.0
        name_found = False
        phone_number_found = False
        customer = Customers.objects.filter(user=user_instance, account=account)
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
            'credit_period': 90
        }

        customer, created = Customers.objects.using('default').update_or_create(
            account=account,
            user=user_instance,
            defaults=defaults
        )

        if not created:
            for field, value in defaults.items():
                if value is not None:
                    setattr(customer, field, value)
            customer.save()

        for _, row in df.iterrows():
            if row['party_name'] == company:
                date = parse_date(row['invoice_date'])
                due_on = parse_date(row['due_date'])
                
                new = False
                new_invo = Invoice.objects.filter(user=user_instance, invoice=customer, ref_no=row['ref_no'], new=False, old=False)
                if len(new_invo) == 0:
                    new = True
                
                invoice_defaults = {
                    'date': date['formatted_date'],
                    'pending': float(row['pending_amount']),
                    'due_on': due_on['formatted_date'],
                    'days_passed': int(row['days_passed']),
                    'new': new,
                    'old': False,
                }

                invoice, created = Invoice.objects.using('default').update_or_create(
                    user=user_instance,
                    invoice=customer,
                    ref_no=row['ref_no'],
                    defaults=invoice_defaults
                )

                if not created:
                    for field, value in invoice_defaults.items():
                        if value is not None:
                            setattr(invoice, field, value)
                    invoice.save()

        all_invoices = Invoice.objects.filter(user=user_instance, invoice=customer, new=False, old=False, paid=False)
        for invoice in all_invoices:
            if invoice.ref_no not in csv_invoice_refs:
                invoice.old = True
                invoice.save()

@csrf_exempt
@require_POST
@transaction.atomic
def process_uploaded_csv(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user_id = '1'
            url = data.get('url')

            # Step 1: Fetch HTML data
            html_data = fetch_html_data(url=url)

            # Step 2: Convert HTML data to CSV format
            csv_data = parse_html_to_csv(html_data)

            # Step 3: Update CSV data format
            updated_csv_data = update_csv_file_format(csv_data)

            # Step 4: Convert updated CSV data back to CSV file and process
            df = pd.read_csv(BytesIO(updated_csv_data))

            # Clear existing data for the user
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
@transaction.atomic
def process_update_csv(request):
    if request.method == 'POST':
        try:
            user_id = (request.POST.get('user_id'))
            url = (request.POST.get('url'))
            # Step 1: Fetch HTML data
            html_data = fetch_html_data(url=url)

            # Step 2: Convert HTML data to CSV format
            csv_data = parse_html_to_csv(html_data)

            # Step 3: Update CSV data format
            updated_csv_data = update_csv_file_format(csv_data)

            # Step 4: Convert updated CSV data back to CSV file and process
            df = pd.read_csv(BytesIO(updated_csv_data))

            # Step 5: Import data from the updated CSV DataFrame into PostgreSQL
            import_data_from_csv(df, user_id)

            return JsonResponse({'success': True, 'message': 'CSV data processed and imported successfully'})
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)}, status=500)
    else:
        return JsonResponse({'success': False, 'message': 'Invalid request or no file provided'}, status=400)

from django.http import JsonResponse
from django.utils import timezone
from django.db.models import OuterRef, Subquery, Case, When, Value, IntegerField
from .models import Customers, Invoice, Comments, Sales_Persons, Name
from .serializers import InvoiceSerializer, SalesPersonsSerializer
from rest_framework.decorators import api_view

@api_view(['POST'])
@csrf_exempt
def get_all_invoices(request):
    if request.method == 'POST':
        data = json.loads(request.body)

        user_id = Users.objects.get(id=data.get('id'))
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


            # Order the customers
            customers = customers.order_by( '-over_due', 'last_promised_date', 'id')
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
        return JsonResponse({'sales_data': data , 'sales': lis, 'customer_data': customer_data, 'len': len(customer_data)}, safe=False)
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
            comments = Comments.objects.filter(user=user, invoice=customer, invoice_list=invoice.ref_no)
            for every in comments:
                every.comment_status =  True
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
        manager = get_object_or_404(Manager, id=data.get('manager'))
        user_id = Users.objects.get(id=data.get('user'))
        invoice_list = (data.get('invoice_list')).split(', ')
        customer = Customers.objects.get(user=user_id, account=data.get('invoice'))
        if data.get('sales_person'):
            sales_person = get_object_or_404(Sales_Persons, name = data.get('sales_person'), manager = manager).id
        else:
            sales_person=None
        com = Comments.objects.filter(user = user_id, invoice = customer)
        for ref_no in invoice_list:
            for c in com:
                if ref_no in c.invoice_list.split(', '):
                    c.comment_status = True
                    c.save()
        if data.get('invoices_paid'):
            paid_amount = data.get('invoices_paid_amount')
            over_due = 0
            for each in invoice_list:
                invoice = get_object_or_404(Invoice, ref_no=each, user=user_id, invoice=customer.id)
                if invoice.days_passed >= customer.credit_period:
                    over_due+= invoice.pending
                if invoice.pending <= paid_amount:
                    if '/p' in invoice.ref_no:
                        invoice.ref_no = invoice.ref_no.split('/p')[0]
                        
                    invoice.paid = data.get('invoices_paid')
                    invoice.paid_date = data.get('invoices_paid_date')
                    invoice.save()
                    paid_amount -= invoice.pending
                else:
                    invoice.ref_no = f'{invoice.ref_no}/part'
                    invoice.pending -= paid_amount
                    invoice.save()
                    paid_amount = 0
            customer.over_due = customer.over_due - over_due
            customer.total_due = customer.total_due-data.get('invoices_paid_amount')
            customer.save()
            query = Q()
            for ref_no in invoice_list:
                query |= Q(invoice_list__icontains=ref_no)
                comments = Comments.objects.filter(user=user_id, invoice=customer).filter(query)
                for every in comments:
                    every.comment_status =  True
                    every.save()
        if data.get('sales_person'):
            for ref in invoice_list:
                invoice = get_object_or_404(Invoice, ref_no=ref, user=user_id, invoice=customer.id)
                invoice.sales_person = sales_person
                invoice.save()
        
        if data.get('amount_promised') == 0:
            prom_am = None
        else:
            prom_am = data.get('amount_promised')
        remark = data.get("remarks")
        if remark and remark.startswith("Other. "):
            remark = remark[7:]  # Strip "Other. " prefix
        comment_data = {
            'user': user_id.id,
            'invoice': customer.id,
            'date': data.get('date'),
            'invoice_list': data.get('invoice_list'),
            'remarks': remark,
            'amount_promised': prom_am,
            'sales_person': sales_person,
            'follow_up_date': data.get('follow_up_date'),
            'promised_date': data.get('promised_date'),
            'comment_status': data.get('invoices_paid'),
            'follow_up_time': data.get('follow_up_time')
        }
        print(7)

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
                comment_status= serializer.validated_data.get('comment_status'),
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
@csrf_exempt
def get_paid_invoices(request):
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

        return JsonResponse({'sales_data': sales_data, 'sales': lis, 'customer_data': customer_data, 'len' : len(customer_data)}, safe=False)
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
@csrf_exempt
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
        user_id = data.get('id')
        current_date = timezone.now().date()

        # Fetch the comments as per the logic you provided
        final = []
        customers = Customers.objects.filter(user=user_id)
        for cust in customers:
            all_com = Comments.objects.filter(user=user_id, invoice=cust).order_by("promised_date", "follow_up_date", "-follow_up_time")
            inv_lists = []
            for comment in all_com:
                if comment.invoice_list not in inv_lists:
                    inv_lists.append(comment.invoice_list)
            for inv in inv_lists:
                inv_comm = Comments.objects.filter(user=user_id, invoice=cust, invoice_list=inv, comment_status=False).order_by('-id')
                if inv_comm:
                    final.append(inv_comm[0])

        # Organize `final` data into a dictionary based on date classifications
        customer_data = OrderedDict()
        for comment in final:
            follow_up_date = comment.follow_up_date
            promised_date = comment.promised_date
            key_date = follow_up_date or promised_date  # Prioritize follow_up_date if available

            # Determine the key string based on the date comparison
            if key_date:
                if key_date < current_date:
                    key_str = 'Pending'
                elif key_date == current_date:
                    key_str = 'Today'
                else:
                    key_str = format_date(key_date)
            else:
                key_str = 'unknown_date'
            
            # Add comment to the dictionary under the corresponding date key
            comment_data = CommentsSerializer(comment).data
            comment_data["customer_name"] = comment_data["invoice"]
            comment_data.pop("invoice")
            if key_str in customer_data:
                customer_data[key_str].append(comment_data)
            else:
                customer_data[key_str] = [comment_data]

        # Sort the date keys and organize into an ordered dictionary
        ordered_customer_data = OrderedDict()
        for key in ['Pending', 'Today']:
            if key in customer_data:
                ordered_customer_data[key] = customer_data.pop(key)
        
        # Sort the remaining keys as dates, handling ordinal suffixes
        sorted_date_keys = sorted(
            (k for k in customer_data.keys() if k != 'unknown_date'),
            key=lambda x: datetime.strptime(re.sub(r'\b(\d+)(st|nd|rd|th)\b', r'\1', x), '%d %B, %A')
        )

        for key in sorted_date_keys:
            ordered_customer_data[key] = customer_data[key]

        if 'unknown_date' in customer_data:
            ordered_customer_data['unknown_date'] = customer_data['unknown_date']
        sales_data = SalesPersonsSerializer(Sales_Persons.objects.all(), many = True).data
        return JsonResponse({
            'dash': ordered_customer_data,
            'sales' : sales_data
        })

# @api_view(['POST'])
# @csrf_exempt
# def get_to_do_invoices(request):
#     if request.method == 'POST':
#         data = json.loads(request.body)
#         id = data.get('id')
#         user = get_object_or_404(Users, id = id)
#         customers = Customers.objects.filter(user = user)
#         for customer in customers:
#             comments = Comments.objects.filter(user = user, invoice = customer).order_by()
#         return JsonResponse({
#             # 'customer_data': ordered_customer_data,
#             # 'len' : length
#         })

from django.http import JsonResponse
from django.utils import timezone
from datetime import timedelta
from django.db.models import Subquery, OuterRef, Q
from .models import Customers, Comments, Invoice
from .serializers import InvoiceSerializer, InvoiceDetailSerializer

@api_view(['POST'])
@csrf_exempt
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
        last_comment = Comments.objects.filter(user=user_id, invoice=OuterRef('pk'), comment_status=False).order_by('-id')
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
        return JsonResponse({'sales_data': data, 'sales': lis, 'customer_data': customer_data, 'len' : len(customer_data)}, safe=False)
    else:
        # Handle other HTTP methods (e.g., POST, PUT, DELETE)
        return JsonResponse({'error': 'Only POST method is allowed for this endpoint'}, status=405)

from concurrent.futures import ThreadPoolExecutor, as_completed
from django.http import JsonResponse
from rest_framework.decorators import api_view
from django.test import RequestFactory
import json

# Function to fetch data using a mock request
def fetch_data(func, request):
    response = func(request)
    return json.loads(response.content.decode('utf-8'))

@api_view(['POST'])
def get_full_data(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        user_id = data.get('user_id')

        # Create a new HttpRequest object with the required parameters
        factory = RequestFactory()
        mock_request = factory.post('/', json.dumps({'user_id': user_id}), content_type='application/json')

        # Use ThreadPoolExecutor to run the functions concurrently
        with ThreadPoolExecutor() as executor:
            futures = {
                executor.submit(fetch_data, get_all_invoices, mock_request): 'all_invoices',
                executor.submit(fetch_data, get_pending_invoices, mock_request): 'pending_invoices',
                executor.submit(fetch_data, get_to_do_invoices, mock_request): 'to_do_invoices',
                executor.submit(fetch_data, get_paid_invoices, mock_request): 'paid_invoices',
            }

            results = {}
            for future in as_completed(futures):
                key = futures[future]
                try:
                    results[key] = future.result()
                except Exception as e:
                    results[key] = {'error': str(e)}

        return JsonResponse(results, safe=False)
    else:
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
        invoices = Invoice.objects.all()
        for invoice in invoices:
            today = datetime.today().date()
            invoice.days_passed = (today - invoice.due_on).days
            invoice.save()
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        role = data.get('role')
        if role == 'Accountant':
            users = get_object_or_404(Users, username = username)
        else:
            users = get_object_or_404(Manager, username=username)
        if users:
            if users.password == password:
                #print(''yes')
                return JsonResponse({'id': users.id, 'username': users.username})
            
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
                every.comment_status =  True
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
        manager = get_object_or_404(Manager, id = data.get('id'))
        accountants = Users.objects.filter(manager = manager)
        accountants_data = UsersSerializer(accountants, many=True).data
        return JsonResponse(accountants_data, safe=False)
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
        target_collection = 0

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
                    comments = Comments.objects.filter(user=each, invoice=customer, comment_status=False).order_by('-id')
                    

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
            target_collection = accountant.target_collection
            for customer in customers:
                total_outstanding += customer.total_due
                total_over_due += customer.over_due
                comments = Comments.objects.filter(user=accountant, invoice=customer, comment_status=False).order_by('-id')
                

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

        return JsonResponse({'total_outstanding': total_outstanding, 'total_over_due': total_over_due, 'projected_collection': projected_collection, 'target_collection' : target_collection,}, safe=False)
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
                    comments = Comments.objects.filter(user = each, invoice = customer, comment_status=False).order_by('-id')
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
                                account_details['today'].append({'user' : comment.user.username,'account' :comment.invoice.account, 'invoices' :comment.invoice_list, 'amount' :comment.amount_promised, 'remarks' : comment.remarks, 'sales_person' : sales_person, 'date' :comment.date, 'follow_up_date' : comment.follow_up_date, 'promised_payment_date' : comment.promised_date})

                            # Check for yesterday
                            if (date and date == yesterday):
                                accounts_reached['yesterday'] += 1
                                account_details['yesterday'].append({'user' : comment.user.username,'account' :comment.invoice.account, 'invoices' :comment.invoice_list, 'amount' :comment.amount_promised, 'remarks' : comment.remarks, 'sales_person' : sales_person, 'date' :comment.date, 'follow_up_date' : comment.follow_up_date, 'promised_payment_date' : comment.promised_date})

                            # Check for last seven days
                            if (date and last_seven_days_start <= date <= today):
                                accounts_reached['last_seven_days'] += 1
                                account_details['last_seven_days'].append({'user' : comment.user.username,'account' :comment.invoice.account, 'invoices' :comment.invoice_list, 'amount' :comment.amount_promised, 'remarks' : comment.remarks, 'sales_person' : sales_person, 'date' :comment.date, 'follow_up_date' : comment.follow_up_date, 'promised_payment_date' : comment.promised_date})

                            # Check for this month
                            if (date and start_of_month <= date <= today):
                                accounts_reached['this_month'] += 1
                                account_details['this_month'].append({'user' : comment.user.username,'account' :comment.invoice.account, 'invoices' :comment.invoice_list, 'amount' :comment.amount_promised, 'remarks' : comment.remarks, 'sales_person' : sales_person, 'date' :comment.date, 'follow_up_date' : comment.follow_up_date, 'promised_payment_date' : comment.promised_date})

        else:
            accountant = Users.objects.get(username=data.get('accountant'))
            customers = Customers.objects.filter(user=accountant)
            for customer in customers:
                comments = Comments.objects.filter(user = accountant, invoice = customer, comment_status = False).order_by('-id')
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
                            account_details['today'].append({'user' : comment.user.username,'account' :comment.invoice.account, 'invoices' :comment.invoice_list, 'amount' :comment.amount_promised, 'remarks' : comment.remarks, 'sales_person' : sales_person, 'date' :comment.date, 'follow_up_date' : comment.follow_up_date, 'promised_payment_date' : comment.promised_date})

                        # Check for yesterday
                        if (date and date == yesterday):
                            accounts_reached['yesterday'] += 1
                            account_details['yesterday'].append({'user' : comment.user.username,'account' :comment.invoice.account, 'invoices' :comment.invoice_list, 'amount' :comment.amount_promised, 'remarks' : comment.remarks, 'sales_person' : sales_person, 'date' :comment.date, 'follow_up_date' : comment.follow_up_date, 'promised_payment_date' : comment.promised_date})

                        # Check for last seven days
                        if (date and last_seven_days_start <= date <= today):
                            accounts_reached['last_seven_days'] += 1
                            account_details['last_seven_days'].append({'user' : comment.user.username,'account' :comment.invoice.account, 'invoices' :comment.invoice_list, 'amount' :comment.amount_promised, 'remarks' : comment.remarks, 'sales_person' : sales_person, 'date' :comment.date, 'follow_up_date' : comment.follow_up_date, 'promised_payment_date' : comment.promised_date})

                        # Check for this month
                        if (date and start_of_month <= date <= today):
                            accounts_reached['this_month'] += 1
                            account_details['this_month'].append({'user' : comment.user.username,'account' :comment.invoice.account, 'invoices' :comment.invoice_list, 'amount' :comment.amount_promised, 'remarks' : comment.remarks, 'sales_person' : sales_person, 'date' :comment.date, 'follow_up_date' : comment.follow_up_date, 'promised_payment_date' : comment.promised_date})

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
                            account_details['today'].append({'user' : invoice.user.username,'account' : invoice.invoice.account, 'invoice' : invoice.ref_no, 'payment_date' : invoice.paid_date, 'amount' : invoice.pending})

                        # Check for yesterday
                        if paid_date == yesterday:
                            amount_collected['yesterday'] += invoice.pending
                            account_details['yesterday'].append({'user' : invoice.user.username,'account' : invoice.invoice.account, 'invoice' : invoice.ref_no, 'payment_date' : invoice.paid_date, 'amount' : invoice.pending})

                        # Check for last seven days
                        if last_seven_days_start <= paid_date <= today:
                            amount_collected['last_seven_days'] += invoice.pending
                            account_details['last_seven_days'].append({'user' : invoice.user.username,'account' : invoice.invoice.account, 'invoice' : invoice.ref_no, 'payment_date' : invoice.paid_date, 'amount' : invoice.pending})

                        # Check for this month
                        if start_of_month <= paid_date <= today:
                            amount_collected['this_month'] += invoice.pending
                            account_details['this_month'].append({'user' : invoice.user.username,'account' : invoice.invoice.account, 'invoice' : invoice.ref_no, 'payment_date' : invoice.paid_date, 'amount' : invoice.pending})

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
                        account_details['today'].append({'user' : invoice.user.username,'account' : invoice.invoice.account, 'invoice' : invoice.ref_no, 'payment_date' : invoice.paid_date, 'amount' : invoice.pending})

                    # Check for yesterday
                    if paid_date == yesterday:
                        amount_collected['yesterday'] += invoice.pending
                        account_details['yesterday'].append({'user' : invoice.user.username,'account' : invoice.invoice.account, 'invoice' : invoice.ref_no, 'payment_date' : invoice.paid_date, 'amount' : invoice.pending})

                    # Check for last seven days
                    if last_seven_days_start <= paid_date <= today:
                        amount_collected['last_seven_days'] += invoice.pending
                        account_details['last_seven_days'].append({'user' : invoice.user.username,'account' : invoice.invoice.account, 'invoice' : invoice.ref_no, 'payment_date' : invoice.paid_date, 'amount' : invoice.pending})

                    # Check for this month
                    if start_of_month <= paid_date <= today:
                        amount_collected['this_month'] += invoice.pending
                        account_details['this_month'].append({'user' : invoice.user.username,'account' : invoice.invoice.account, 'invoice' : invoice.ref_no, 'payment_date' : invoice.paid_date, 'amount' : invoice.pending})



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
                    comments = Comments.objects.filter(user=accountant, invoice=customer, comment_status=False)
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
                            'days_overdue' : Invoice.objects.filter(user = accountant, invoice = customer).order_by('-days_passed')[0].days_passed,
                            'user' : accountant.username
                        }
                        customers_to_include.append(formated)
            
        else:
            accountant = get_object_or_404(Users, username = data.get('accountant'))
            customers = Customers.objects.filter(user=accountant)

            for customer in customers:
                comments = Comments.objects.filter(user=accountant, invoice=customer, comment_status=False)
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
                        'days_overdue' : Invoice.objects.filter(user = accountant, invoice = customer, paid = False).order_by('-days_passed')[0].days_passed,
                        'user' : accountant.username
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
def create_accountant(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return Response({"error": "Invalid JSON data"}, status=status.HTTP_400_BAD_REQUEST)

    method = data.get('method')
    if not method:
        return Response({"error": "Method not provided"}, status=status.HTTP_400_BAD_REQUEST)

    manager = get_object_or_404(Manager, id=data.get('manager'))

    if method == 'Create':
        try:
            data.pop('method')
            data.pop('id', None)  # id might not be in data

            if data.get('username') and data.get('password'):
                serializer = UsersSerializer(data=data)
                if serializer.is_valid():
                    users = Users.objects.create(
                        manager=serializer.validated_data.get('manager'),
                        name=serializer.validated_data.get('name'),
                        phone_number=serializer.validated_data.get('phone_number'),
                        username=serializer.validated_data.get('username'),
                        password=serializer.validated_data.get('password'),
                        address=serializer.validated_data.get('address'),
                        target_collection=serializer.validated_data.get('target_collection')
                    )
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({"error": "Username and password are required"}, status=status.HTTP_400_BAD_REQUEST)
        except KeyError as e:
            return Response({"error": f"Missing field: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    elif method == 'Update':
        if data.get('id') and data.get('password'):
            accountant = get_object_or_404(Users, id=data.get('id'))
            for key, value in data.items():
                if key in ['name', 'phone_number', 'username', 'password', 'address', 'target_collection']:
                    setattr(accountant, key, value)
            accountant.save()
            return Response({"message": "Accountant updated successfully"}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "ID and password are required for update"}, status=status.HTTP_400_BAD_REQUEST)

    elif method == 'Target Collection':
        if data.get('id') and data.get('target_collection') != None:
            accountant = get_object_or_404(Users, id=data.get('id'))
            accountant.target_collection = data.get('target_collection')
            accountant.save()
            return Response({"message": "Target collection updated successfully"}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "ID and target_collection are required"}, status=status.HTTP_400_BAD_REQUEST)

    return Response({"error": "Invalid method"}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def update_target_collections(request):
    data = json.loads(request.body)
    accountant = get_object_or_404(Users, username = data.get('accountant'))
    target_collection = data.get('target_collections')
    
    accountant.target_collection = target_collection
    accountant.save()
    return Response('success')


# URL = "https://abac-2401-4900-1cb4-5398-f960-32ec-95d4-fa89.ngrok-free.app"

# from django.shortcuts import render
# from django.http import JsonResponse
# import requests
# import xml.etree.ElementTree as ET

# class VoucherModel:
#     def __init__(self, date, v_type, v_no, party_ledger, amount):
#         self.date = date
#         self.v_type = v_type
#         self.v_no = v_no
#         self.party_ledger = party_ledger
#         self.amount = amount

#     def __str__(self):
#         return f"{self.date} | {self.v_type} | {self.v_no} | {self.party_ledger} | {self.amount}"

# def parse_vouchers(vouchers_data):
#     vouchers = []
#     root = ET.fromstring(vouchers_data)
    
#     for voucher in root.findall('.//VOUCHER'):
#         date = voucher.find('DATE').text
#         v_type = voucher.find('VOUCHERTYPENAME').text
#         v_no = voucher.find('VOUCHERNUMBER').text
#         party_ledger = voucher.find('PARTYLEDGERNAME').text
#         amount = None
        
#         for entry in voucher.findall('ALLLEDGERENTRIES.LIST'):
#             ledger_name = entry.find('LEDGERNAME').text
#             if ledger_name == party_ledger:
#                 amount = entry.find('AMOUNT').text
#                 break
        
#         if date and v_type and v_no and party_ledger and amount:
#             vouchers.append(VoucherModel(date, v_type, v_no, party_ledger, amount))
    
#     return vouchers

# def fetch_vouchers(request):
#     # Tally XML request to get all vouchers
#     xml_request = """
#     <ENVELOPE>
#         <HEADER>
#             <TALLYREQUEST>Export Data</TALLYREQUEST>
#         </HEADER>
#         <BODY>
#             <EXPORTDATA>
#                 <REQUESTDESC>
#                     <REPORTNAME>Voucher Register</REPORTNAME>
#                     <STATICVARIABLES>
#                         <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
#                     </STATICVARIABLES>
#                 </REQUESTDESC>
#             </EXPORTDATA>
#         </BODY>
#     </ENVELOPE>
#     """

#     # Send the request to Tally
#     response = requests.post(URL, data=xml_request)

#     # Check if the request was successful
#     if response.status_code == 200:
#         # Parse the XML response
#         vouchers_data = response.text
#         vouchers = parse_vouchers(vouchers_data)

#         # Prepare data for JSON response
#         vouchers_list = [
#             {
#                 "date": voucher.date,
#                 "v_type": voucher.v_type,
#                 "v_no": voucher.v_no,
#                 "party_ledger": voucher.party_ledger,
#                 "amount": voucher.amount
#             }
#             for voucher in vouchers
#         ]

#         return JsonResponse({"vouchers": vouchers_list})
#     else:
#         return JsonResponse({"error": f"Failed to fetch data: {response.status_code}"}, status=response.status_code)

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serializers import ManagerSerializer
from .models import Manager
from django.shortcuts import get_object_or_404

@api_view(['POST'])
def create_manager(request):
    if request.method == 'POST':
        data = request.data
        manager_data = data.get('manager_data')
        # Serialize and validate manager data
        manager_serializer = ManagerSerializer(data=manager_data)
        if manager_serializer.is_valid():
            manager = manager_serializer.save()
            manager_username = get_object_or_404(Manager, id = manager.id)
            return Response({'username' : manager_username.username, 'id' : manager_username.id}, status=status.HTTP_201_CREATED)
        else:
            return Response(manager_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    return Response({"detail": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serializers import ManagerSerializer, ManagerUsersSerializer, ManagerSalesPersonsSerializer
from .models import Manager
from django.shortcuts import get_object_or_404

@api_view(['POST'])
def get_manager_data(request):
    if request.method == 'POST':
        data = request.data
        manager = get_object_or_404(Manager, id =data.get('id'))
        manager_data = ManagerSerializer(manager).data
        manager_data.popitem('password')
        print(manager_data)


        return Response({'manager_data' : manager_data}, status=status.HTTP_201_CREATED)

    return Response({"detail": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

@api_view(['POST'])
def get_manager_customer_data(request):
    if request.method == 'POST':
        data = request.data
        manager = get_object_or_404(Manager, id=data.get('id'))
        customers_data = []
        accountants = Users.objects.filter(manager=manager)
        accountants_data = ManagerUsersSerializer(accountants, many=True).data
        sales_person = Sales_Persons.objects.filter(manager=manager)
        sales_person_data = ManagerSalesPersonsSerializer(sales_person, many=True).data
        # Remove password and address fields from the serialized data
        for accountant in accountants_data:
            customers = Customers.objects.filter(user = accountant['id'])
            customers_data += InvoiceSerializer(customers, many=True).data

        # Rename fields in customers_data
        for customer in customers_data:
            customer['customer_name'] = customer.pop('account', None)
            customer['ar_accountant'] = customer.pop('user', None)
            customer['total_balance'] = customer.pop('total_due', None)
            customer['total_balance'] =float(customer['total_balance'])
            customer['over_due'] = float(customer['over_due'])

        return Response({'accountants': accountants_data, 'customers': customers_data, 'sales_persons': sales_person_data}, status=status.HTTP_200_OK)

    return Response({"detail": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

@api_view(['POST'])
def get_accountant_customer_data(request):
    if request.method == 'POST':
        data = request.data
        accountant = get_object_or_404(Users, id=data.get('id'))
        sales_person = Sales_Persons.objects.filter(manager = accountant.manager)
        sales_person_data = ManagerSalesPersonsSerializer(sales_person, many=True).data
        customers = Customers.objects.filter(user = accountant)
        customers_data = InvoiceSerializer(customers, many=True).data

        # Rename fields in customers_data
        for customer in customers_data:
            customer['customer_name'] = customer.pop('account', None)
            customer.pop('user', None)
            customer['total_balance'] = customer.pop('total_due', None)
            customer['total_balance'] =float(customer['total_balance'])
            customer['over_due'] = float(customer['over_due'])

        return Response({'customers': customers_data, 'sales_persons': sales_person_data}, status=status.HTTP_200_OK)

    return Response({"detail": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

@api_view(['POST'])
def get_accountant_pending_customer_data(request):
    if request.method == 'POST':
        data = request.data
        accountant = get_object_or_404(Users, id=data.get('id'))
        sales_person = Sales_Persons.objects.filter(manager = accountant.manager)
        sales_person_data = ManagerSalesPersonsSerializer(sales_person, many=True).data
        customers = Customers.objects.filter(user = accountant).order_by("-over_due")
        customers_data = []
        for customer in customers:
            invoice_length = len(Invoice.objects.filter(user = accountant, invoice = customer, paid = False))
            if invoice_length > 0:
                comments = len(Comments.objects.filter(user = accountant, invoice = customer, comment_status = False))
                if comments==0:
                    customer = InvoiceSerializer(customer).data
                    customer['customer_name'] = customer.pop('account', None)
                    customer.pop('user', None)
                    customer['total_balance'] = customer.pop('total_due', None)
                    customer['total_balance'] =float(customer['total_balance'])
                    customer['over_due'] = float(customer['over_due'])
                    customers_data.append(customer)
        return Response({'customers': customers_data, 'sales_persons': sales_person_data}, status=status.HTTP_200_OK)

    return Response({"detail": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

@api_view(['POST'])
def get_manager_invoice_data(request):
    if request.method == 'POST':
        data = request.data
        manager = get_object_or_404(Manager, id=data.get('id'))        
        accountants = Users.objects.filter(manager=manager)
        accountants_data = ManagerUsersSerializer(accountants, many=True).data
        sales_person_objects = Sales_Persons.objects.filter(manager=manager)
        sales_person_data = ManagerSalesPersonsSerializer(sales_person_objects, many=True).data
        invoice_data = []
        # Remove password and address fields from the serialized data
        for accountant in accountants_data:
            invoices = Invoice.objects.filter(user = accountant['id'])
            invoice_data += InvoiceDetailSerializer(invoices, many=True).data

        keys = invoice_data[0].keys()
        for invoice in invoice_data:
            invoice['customer_name'] = invoice['invoice']['account']
            invoice.pop('invoice', None)
            invoice['ar_accountant'] = invoice.pop('user', None)
            if invoice['sales_person']:
                sales_person = get_object_or_404(Sales_Persons, id=invoice['sales_person']).name
                invoice['sales_person'] = sales_person
            for key in keys:
                if type(invoice[key]) == str:
                    try:
                        if float(invoice[key]):
                            invoice[key] = float(invoice[key])
                    except ValueError:
                        continue
        return Response({'accountants': accountants_data, 'invoices': invoice_data, 'sales_persons': sales_person_data}, status=status.HTTP_200_OK)

    return Response({"detail": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

@api_view(['POST'])
def get_accountant_invoice_data(request):
    if request.method == 'POST':
        data = request.data        
        accountant = get_object_or_404(Users, id = data.get("id"))
        invoice_data = []
        # Remove password and address fields from the serialized data
        invoices = Invoice.objects.filter(user = accountant)
        invoice_data = InvoiceDetailSerializer(invoices, many=True).data
        sales_person_objects = Sales_Persons.objects.filter(manager=accountant.manager)
        sales_person_data = ManagerSalesPersonsSerializer(sales_person_objects, many=True).data
        keys = invoice_data[0].keys()
        for invoice in invoice_data:
            invoice['customer_name'] = invoice['invoice']['account']
            invoice.pop('invoice', None)
            invoice.pop('user', None)
            if invoice['sales_person']:
                sales_person = get_object_or_404(Sales_Persons, id=invoice['sales_person']).name
                invoice['sales_person'] = sales_person
            for key in keys:
                if type(invoice[key]) == str:
                    try:
                        if float(invoice[key]):
                            invoice[key] = float(invoice[key])
                    except ValueError:
                        continue
        return Response({'invoices': invoice_data, 'sales_persons': sales_person_data}, status=status.HTTP_200_OK)


    return Response({"detail": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

@api_view(['POST'])
def get_accountant_pending_invoice_data(request):
    if request.method == 'POST':
        data = request.data        
        accountant = get_object_or_404(Users, id = data.get("id"))
        invoice_data = []
        # Remove password and address fields from the serialized data
        invoices = Invoice.objects.filter(user = accountant, paid = False)
        invoice_data = []
        sales_person_objects = Sales_Persons.objects.filter(manager=accountant.manager)
        sales_person_data = ManagerSalesPersonsSerializer(sales_person_objects, many=True).data
        for invoice in invoices:
            comments = Comments.objects.filter(user = accountant, invoice = invoice.invoice, comment_status = False)
            inv_status = True
            for comment in comments:
                if invoice.ref_no in comment.invoice_list.split(", "):
                    inv_status = False
            if inv_status == True:
                invoice = InvoiceDetailSerializer(invoice).data
                invoice['customer_name'] = invoice['invoice']['account']
                invoice.pop('invoice', None)
                invoice.pop('user', None)
                if invoice['sales_person']:
                    sales_person = get_object_or_404(Sales_Persons, id=invoice['sales_person']).name
                    invoice['sales_person'] = sales_person
                keys = invoice.keys()
                for key in keys:
                    if type(invoice[key]) == str:
                        try:
                            if float(invoice[key]):
                                invoice[key] = float(invoice[key])
                        except ValueError:
                            continue
                invoice_data.append(invoice)
        return Response({'invoices': invoice_data, 'sales_persons': sales_person_data}, status=status.HTTP_200_OK)


    return Response({"detail": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

@api_view(['POST'])
def get_accountant_paid_invoice_data(request):
    if request.method == 'POST':
        data = request.data        
        accountant = get_object_or_404(Users, id = data.get("id"))
        invoice_data = []
        # Remove password and address fields from the serialized data
        invoices = Invoice.objects.filter(user = accountant, paid = True)
        invoice_data = InvoiceDetailSerializer(invoices, many=True).data
        sales_person_objects = Sales_Persons.objects.filter(manager=accountant.manager)
        sales_person_data = ManagerSalesPersonsSerializer(sales_person_objects, many=True).data
        
        for invoice in invoice_data:
            invoice['customer_name'] = invoice['invoice']['account']
            invoice.pop('invoice', None)
            invoice.pop('user', None)
            if invoice['sales_person']:
                sales_person = get_object_or_404(Sales_Persons, id=invoice['sales_person']).name
                invoice['sales_person'] = sales_person
        if len(invoice_data) > 0:
            keys = invoice_data[0].keys()
            for key in keys:
                if type(invoice[key]) == str:
                    try:
                        if float(invoice[key]):
                            invoice[key] = float(invoice[key])
                    except ValueError:
                        continue
        return Response({'invoices': invoice_data, 'sales_persons': sales_person_data}, status=status.HTTP_200_OK)


    return Response({"detail": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

@api_view(['POST'])
def get_accountant_comment_data(request):
    if request.method == 'POST':
        data = request.data
        accountant = get_object_or_404(Users, id=data.get('user'))
        comment = get_object_or_404(Comments, id = data.get("id"), user = accountant)
        com = CommentsSerializer(comment).data
        if comment.sales_person:
            sales_person = SalesPersonsSerializer(comment.sales_person).data
            com['sales_person'] = sales_person['name']
        sales_data = SalesPersonsSerializer(Sales_Persons.objects.all(), many = True).data
        com['customer_name'] = com.pop('invoice', None)
        all_comments = Comments.objects.filter(user=data.get('user'), invoice=comment.invoice).order_by('-date')
        filtered_comments  = []
        for inv in comment.invoice_list.split(', '):
            for comment in all_comments:
                if comment.invoice_list and (inv in (comment.invoice_list.split(', '))) and (comment not in filtered_comments):
                    filtered_comments.append(comment)
            # Serialize the filtered comments
        comments = CommentsSerializer(filtered_comments, many=True).data
        com['invoice_list'] = com['invoice_list'].split(', ')
        com['invoice_data'] = []
        for invoice in com['invoice_list']:
            com['invoice_data'].append(CustomerInvoiceSerializer(get_object_or_404(Invoice, user = accountant, invoice = comment.invoice, ref_no = invoice)).data)
        com.pop('user', None)
        com['sales'] = sales_data
        com['comments'] = comments
        return Response({'comment_data': com}, status=status.HTTP_200_OK)

    return Response({"detail": "Method not allowed"}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


from .serializers import CustomerInvoiceSerializer, InvoiceDetailSerializer

@api_view(['POST'])
def get_customer_info(request):
    data = json.loads(request.body)
    
    user = get_object_or_404(Users, id = data.get('user'))
    customer = get_object_or_404(Customers, user = user, account = data.get('customer'))
    invoices = CustomerInvoiceSerializer(Invoice.objects.filter(user = user,  invoice = customer).order_by('-days_passed'), many=True).data
    comments = CommentsSerializer(Comments.objects.filter(user = user, invoice = customer).order_by('-date'), many = True).data
    names = NameSerializer(Name.objects.filter(user = user, invoice = customer), many = True).data
    customer = InvoiceSerializer(customer).data
    keys = customer.keys()
    for key in keys:
        if type(customer[key]) == str:
            try:
                if float(customer[key]):
                    customer[key] = float(customer[key])
            except ValueError:
                continue
    customer['invoice_details'] = invoices
    customer['comments'] = comments
    customer['names'] = names
    customer['customer_name'] = customer.pop('account', None)
    customer['ar_accountant'] = customer.pop('user', None)
    customer['total_balance'] = customer.pop('total_due', None)


    return Response({'Customer': customer})

@api_view(['POST'])
def get_create_comment_info(request):
    data = json.loads(request.body)
    invoice_list = data.get('invoice_list')
    user = get_object_or_404(Users, id = data.get('user'))
    customer = get_object_or_404(Customers, user = user, account = data.get('customer'))
    invoices = CustomerInvoiceSerializer(Invoice.objects.filter(user = user,  invoice = customer).order_by('-days_passed'), many=True).data
    comments = CommentsSerializer(Comments.objects.filter(user = user, invoice = customer).order_by('-date'), many = True).data
    names = NameSerializer(Name.objects.filter(user = user, invoice = customer), many = True).data
    customer = InvoiceSerializer(customer).data
    keys = customer.keys()
    for key in keys:
        if type(customer[key]) == str:
            try:
                if float(customer[key]):
                    customer[key] = float(customer[key])
            except ValueError:
                continue
    customer['invoice_details'] = []
    customer['comments'] = []
    invoice_list = [d['ref_no'] for d in invoice_list]
    for invoice in invoices:
        if invoice['ref_no'] in invoice_list:
            customer['invoice_details'].append(invoice)
        for comment in comments:
            if invoice['ref_no'] in comment['invoice_list'].split(', '):
                if comment not in customer['comments']:
                    customer['comments'].append(comment)
    customer['names'] = names
    customer['customer_name'] = customer.pop('account', None)
    customer['ar_accountant'] = customer.pop('user', None)
    customer['total_balance'] = customer.pop('total_due', None)


    return Response({'Customer': customer})

@api_view(['POST'])
def customer_credit_period(request):
    data = json.loads(request.body)
    customer = get_object_or_404(Customers, id=data.get('customer_id'))
    new_credit_period = data.get('new_credit_period')

    customer.credit_period = new_credit_period
    customer.save()

    return Response('success')

from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import Customers, Users
from .serializers import NameSerializer
from django.shortcuts import get_object_or_404

@api_view(['POST'])
def customer_name_number(request):
    data = request.data
    
    # Validate and get objects
    try:
        customer = get_object_or_404(Customers, id=data.get('customer_id'))
        user = get_object_or_404(Users, id=data.get('user'))
    except Exception as e:
        return Response({'error': str(e)}, status=400)

    # Create data for serializer with primary key values
    create = {
        'user': user.id,  # Pass the ID of the Users instance
        'invoice': customer.id,  # Pass the ID of the Customers instance
        'name': data.get('name'),
        'phone_number': data.get('phone_number')
    }

    # Initialize and validate serializer
    serializer = NameSerializer(data=create)
    if serializer.is_valid():
        serializer.save()
        return Response({'status': 'success'})
    else:
        return Response(serializer.errors, status=400)

@api_view(['POST'])
def get_invoice_info(request):
    data = json.loads(request.body)
    
    user = get_object_or_404(Users, id = data.get('user'))
    customer = get_object_or_404(Customers, user = user, account = data.get('customer'))
    invoice = get_object_or_404(Invoice, user = user, invoice = customer ,ref_no = data.get('invoice'))
    all_comments = Comments.objects.filter(user=user, invoice=customer).order_by('-date')
    filtered_comments  = []
    for comment in all_comments:
        if comment.invoice_list and (invoice.ref_no in (comment.invoice_list.split(', '))):
            filtered_comments.append(comment)
    # Serialize the filtered comments
    comments = CommentsSerializer(filtered_comments, many=True).data
    invoice = InvoiceDetailSerializer(invoice).data
    keys = invoice.keys()
    for key in keys:
        if type(invoice[key]) == str:
            try:
                if float(invoice[key]):
                    invoice[key] = float(invoice[key])
            except ValueError:
                continue
    invoice['comments'] = comments
    invoice['customer_name'] = invoice['invoice']['account']
    invoice.pop('invoice', None)
    invoice['ar_accountant'] = invoice.pop('user', None)


    return Response({'Invoice': invoice})

from datetime import datetime, timedelta
from django.db.models import Sum, F
from django.utils.timezone import now
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Comments, Invoice

@api_view(['POST'])
def manager_dashboard_data(request):
    data = json.loads(request.body)
    manager_id = data.get('manager_id')
    accountant_id = data.get('accountant_id')
    print(accountant_id)

    # Get all accountants under this manager
    accountants = Users.objects.filter(manager=manager_id)
    accountants_data = ManagerUsersSerializer(accountants, many=True).data

    # If accountant_id provided, limit to that accountant
    if accountant_id:
        accounts = accountants.filter(id=accountant_id)
        print(accounts[0].username, accounts[0].id)
    else:
        accounts = accountants

    manager_data = get_object_or_404(Manager, id=manager_id)

    dashboard_data = {
        'customers': 0,
        'invoices': 0,
        'over_due': 0,
        'total_balance': 0,
        'customers_reached': {'All': 0, 'This_Month': 0, 'This_Week': 0, 'Today': 0},
        'expected_payments': {'All': 0, 'This_Month': 0, 'This_Week': 0, 'Today': 0},
        'amounts_received': {'All': 0, 'This_Month': 0, 'This_Week': 0, 'Today': 0},
        'top_customers': [],
        'accountants': accountants_data
    }

    all_customers = []
    
    # Fetch customer and invoice data
    for account in accounts:
        print(account.username, account.id, 2)
        customers = Customers.objects.filter(user=account).order_by('-over_due')
        dashboard_data['customers'] += customers.count()
        dashboard_data['invoices'] += Invoice.objects.filter(user=account).count()
        dashboard_data['over_due'] += sum(c.over_due for c in customers)
        dashboard_data['total_balance'] += sum(c.total_due for c in customers)
        
        for customer in customers:
            invoices = Invoice.objects.filter(user=account, invoice=customer).order_by('-days_passed')
            age = invoices[0].days_passed if invoices else 0
            over_due_invoices = invoices.filter(days_passed__gt=0).count()
            customer_data = {
                'customer_name': customer.account,
                'age': age,
                'over_due_invoices': over_due_invoices,
                'over_due_amount': customer.over_due
            }
            all_customers.append(customer_data)

    dashboard_data['top_debtors'] = sorted(all_customers, key=lambda x: x['over_due_amount'], reverse=True)[:5]

    today = now().date()
    start_of_week = today - timedelta(days=today.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    start_of_month = today.replace(day=1)
    end_of_month = (start_of_month.replace(month=start_of_month.month % 12 + 1, day=1) - timedelta(days=1)
                    if start_of_month.month < 12 else
                    start_of_month.replace(year=start_of_month.year + 1, month=1, day=1) - timedelta(days=1))

    for account in accounts:
        one_month_ago = today - timedelta(days=30)
        comments = Comments.objects.filter(user=account).order_by('-date')
        
        # Dictionary to track latest comment per customer
        latest_comment_per_customer = {}

        for comment in comments:
            customer = comment.invoice  # Assuming this relates to the customer
            if customer not in latest_comment_per_customer:
                latest_comment_per_customer[customer] = comment

        # Categorize based on the latest comment per customer
        for comment in latest_comment_per_customer.values():
            date = comment.date
            dashboard_data['customers_reached']['All'] += 1
            if start_of_month <= date <= end_of_month:
                dashboard_data['customers_reached']['This_Month'] += 1
            if start_of_week <= date <= end_of_week:
                dashboard_data['customers_reached']['This_Week'] += 1
            if date == today:
                dashboard_data['customers_reached']['Today'] += 1

        comments = Comments.objects.filter(user=account, promised_date__isnull=False).order_by('-promised_date')
        latest_comments = {}
        for comment in comments:
            inv = comment.invoice_list
            if inv not in latest_comments or comment.promised_date > latest_comments[inv].promised_date:
                latest_comments[inv] = comment

        for comment in latest_comments.values():
            amt = comment.amount_promised
            date = comment.promised_date
            dashboard_data['expected_payments']['All'] += amt
            if start_of_month <= date <= end_of_month:
                dashboard_data['expected_payments']['This_Month'] += amt
            if start_of_week <= date <= end_of_week:
                dashboard_data['expected_payments']['This_Week'] += amt
            if date == today:
                dashboard_data['expected_payments']['Today'] += amt

        # Amounts Received
        paid_invoices = Invoice.objects.filter(user=account, paid=True, paid_date__isnull=False)
        for inv in paid_invoices:
            amt = inv.pending
            date = inv.paid_date
            dashboard_data['amounts_received']['All'] += amt
            if start_of_month <= date <= end_of_month:
                dashboard_data['amounts_received']['This_Month'] += amt
            if start_of_week <= date <= end_of_week:
                dashboard_data['amounts_received']['This_Week'] += amt
            if date == today:
                dashboard_data['amounts_received']['Today'] += amt

    return Response(dashboard_data)

@api_view(['POST'])
def get_all_sales_persons(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        manager = get_object_or_404(Manager, id = data.get('id'))
        sales_persons = Sales_Persons.objects.filter(manager = manager)
        sales_persons_data = SalesPersonsSerializer(sales_persons, many=True).data
        return JsonResponse(sales_persons_data, safe=False)
    else:
        # Handle other HTTP methods (e.g., POST, PUT, DELETE)
        return JsonResponse({'error': 'Only POST method is allowed for this endpoint'}, status=405)
    
@api_view(['POST'])
def create_sales_person(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return Response({"error": "Invalid JSON data"}, status=status.HTTP_400_BAD_REQUEST)

    method = data.get('method')
    if not method:
        return Response({"error": "Method not provided"}, status=status.HTTP_400_BAD_REQUEST)

    manager = get_object_or_404(Manager, id=data.get('manager'))

    if method == 'Create':
        try:
            data.pop('method')
            data.pop('id', None)  # id might not be in data

            if data.get('name') and data.get('phone_number'):
                serializer = SalesPersonsSerializer(data=data)
                if serializer.is_valid():
                    users = Sales_Persons.objects.create(
                        manager=serializer.validated_data.get('manager'),
                        name=serializer.validated_data.get('name'),
                        phone_number=serializer.validated_data.get('phone_number'),
                        address=serializer.validated_data.get('address'),
                        email=serializer.validated_data.get('email'),
                    )
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({"error": "Name and Phone Number are required"}, status=status.HTTP_400_BAD_REQUEST)
        except KeyError as e:
            return Response({"error": f"Missing field: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

    elif method == 'Update':
        if data.get('id') and data.get('name'):
            sales_person = get_object_or_404(Sales_Persons, id=data.get('id'))
            for key, value in data.items():
                if key in ['name', 'phone_number', 'address', 'email']:
                    setattr(sales_person, key, value)
            sales_person.save()
            return Response({"message": "Sales Person updated successfully"}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "ID and name are required for update"}, status=status.HTTP_400_BAD_REQUEST)

    return Response({"error": "Invalid method"}, status=status.HTTP_400_BAD_REQUEST)
