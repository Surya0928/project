from rest_framework import serializers
from .models import Users, Customers, Invoice, Comments, Sales_Persons, Name, Manager
from datetime import datetime

class ManagerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Manager
        fields = ['id', 'first_name', 'last_name', 'email', 'phone_number', 'username', 'password']

from rest_framework import serializers
from .models import Name, Users, Customers

class NameSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=Users.objects.all(), write_only=True)
    invoice = serializers.PrimaryKeyRelatedField(queryset=Customers.objects.all(), write_only=True)
    
    class Meta:
        model = Name
        fields = ['id', 'user', 'invoice', 'name', 'phone_number']


class UsersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Users
        fields = ['id', 'manager', 'name', 'phone_number', 'username', 'password', 'address', 'target_collection']
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if type(data['target_collection']) == str:
            data['target_collection'] = float(data['target_collection'])
        return data

class ManagerUsersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Users
        fields = ['id', 'username']

class CommentsQuerySerializer(serializers.Serializer):
    reference = serializers.CharField(max_length=100)

class CommentsSerializer(serializers.ModelSerializer):
    invoice = serializers.CharField(max_length=100)  # Use CharField for account (invoice) string
    user = serializers.IntegerField(write_only=True)

    class Meta:
        model = Comments
        fields = ['id', 'user', 'invoice', 'date', 'invoice_list', 'remarks', 'amount_promised', 'follow_up_date', 'promised_date', 'sales_person', 'comment_status', 'follow_up_time']

    def create(self, validated_data):
        # Extract and handle the invoice string value
        user_id = validated_data.pop('user')
        user = Users.objects.get(id=user_id)
        validated_data['user'] = user
        invoice_account = validated_data.pop('invoice', None)
        if invoice_account:
            customer = Customers.objects.get(account=invoice_account)
            validated_data['invoice'] = customer
        return super().create(validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        date_fields = ['date', 'follow_up_date', 'promised_date']
        for field in date_fields:
            if data[field]:
                data[field] = datetime.strptime(data[field], '%Y-%m-%d').strftime('%d-%m-%Y')
        if type(data['amount_promised']) == str:
            data['amount_promised'] = float(data['amount_promised'])
        return data

class CustomersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customers
        fields = ['account', 'user']

class InvoiceDetailSerializer(serializers.ModelSerializer):
    invoice = CustomersSerializer(read_only=True)

    class Meta:
        model = Invoice
        fields = ['id', 'user', 'invoice', 'date', 'ref_no', 'pending', 'due_on', 'days_passed', 'paid', 'paid_date', 'sales_person']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        date_fields = ['date', 'due_on', 'paid_date']
        for field in date_fields:
            if data[field]:
                data[field] = datetime.strptime(data[field], '%Y-%m-%d').strftime('%d-%m-%Y')
        if data['days_passed'] < 0:
            data['days_passed'] = 0
        integer_fields = ['pending', 'days_passed']
        for fieldin in integer_fields:
            if type(data[fieldin]) == str:
                data[fieldin] = float(data[fieldin])
        return data
    

class CustomerInvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = ['id', 'user', 'date', 'ref_no', 'pending', 'due_on', 'days_passed', 'paid', 'paid_date', 'sales_person']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        date_fields = ['date', 'due_on', 'paid_date']
        for field in date_fields:
            if data[field]:
                data[field] = datetime.strptime(data[field], '%Y-%m-%d').strftime('%d-%m-%Y')
        integer_fields = ['pending', 'days_passed']
        for fieldin in integer_fields:
            if type(data[fieldin]) == str:
                data[fieldin] = float(data[fieldin])
        if data['days_passed'] < 0:
            data['days_passed'] = 0
        return data



class InvoiceSerializer(serializers.ModelSerializer):

    class Meta:
        model = Customers
        fields = ['id', 'user', 'account', 'over_due', 'total_due', 'invoices','credit_period']
        
    def to_representation(self, instance):
        data = super().to_representation(instance)
        integer_fields = ['over_due', 'total_due', 'invoices','credit_period']
        for fieldin in integer_fields:
            if type(data[fieldin]) == str:
                data[fieldin] = float(data[fieldin])
        return data

class CustomerUpdateSerializer(serializers.Serializer):
    user = serializers.CharField(max_length=100, allow_null=False)
    account = serializers.CharField(max_length=100, allow_null=True)
    promised_amount = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    promised_date = serializers.DateField(allow_null=True)
    name = serializers.CharField(max_length=100, allow_null=True)
    phone_number = serializers.CharField(max_length=100, allow_null=True)
    sales_person = serializers.CharField(max_length=100, allow_null=True, required=False)

    def update(self, instance, validated_data):
        # Iterate over each field in validated_data
        for field_name, value in validated_data.items():
            if value or value == 0.00:
                setattr(instance, field_name, value)
        
        # Save the instance after all updates
        instance.save()
        return instance

class SalesPersonsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sales_Persons
        fields = ['id', 'name', 'phone_number', 'address', 'email']

class ManagerSalesPersonsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sales_Persons
        fields = ['id', 'name']

class InvoiceDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = ['id', 'user', 'invoice', 'date', 'ref_no', 'pending', 'due_on', 'days_passed', 'paid', 'paid_date', 'sales_person']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        date_fields = ['date', 'due_on', 'paid_date']
        for field in date_fields:
            if data[field]:
                data[field] = datetime.strptime(data[field], '%Y-%m-%d').strftime('%d-%m-%Y')
        data['sales_person'] = Sales_Persons.objects.get(id=data['sales_person']).name
        comments = Comments.objects.filter(user = data['user'], invoice = data['invoice'])
        commens_lis = []
        for comment in comments:
            inv_lis = comment.invoice_list.split(', ')
            if data['ref_no'] in inv_lis:
                commens_lis.append(comment)
        data['comments'] = commens_lis
        
        return data
