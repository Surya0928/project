from rest_framework import serializers
from .models import Users, Customers, Invoice, Comments, Sales_Persons

class UsersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Users
        fields = ['username', 'password', 'address', 'role']

class CommentsQuerySerializer(serializers.Serializer):
    reference = serializers.CharField(max_length=100)

class CommentsSerializer(serializers.ModelSerializer):
    invoice = serializers.CharField(max_length=100)  # Use CharField for account (invoice) string
    user = serializers.IntegerField(write_only=True)

    class Meta:
        model = Comments
        fields = ['id','user', 'invoice', 'date', 'invoice_list', 'remarks', 'amount_promised', 'follow_up_date', 'promised_date', 'sales_person', 'comment_paid', 'follow_up_time']

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


class CustomersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customers
        fields = ['account','user', 'phone_number']

class InvoiceDetailSerializer(serializers.ModelSerializer):
    invoice = CustomersSerializer(read_only=True)

    class Meta:
        model = Invoice
        fields = ['id','user', 'invoice', 'date', 'ref_no', 'pending', 'due_on', 'days_passed', 'paid', 'paid_date', 'sales_person']


class InvoiceSerializer(serializers.ModelSerializer):
    invoice_details = InvoiceDetailSerializer(many=True, read_only=True)
    comments = CommentsSerializer(many=True, read_only=True)  # Add comments field

    class Meta:
        model = Customers
        fields = ('id','user', 'account', 'name', 'phone_number', 'optimal_due', 'threshold_due', 'over_due', 'total_due','promised_amount', 'promised_date' , 'invoices', 'invoice_details', 'comments' )

    def to_representation(self, instance):
        data = super().to_representation(instance)
        comments = Comments.objects.filter(invoice__account=instance.account)
        comments_data = CommentsSerializer(comments, many=True).data
        data['comments'] = comments_data
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

class SalesPersonsDetailSerializer(serializers.ModelSerializer):
    # Assuming you want to include related invoices and comments for each sales person
    invoice_sales_p = InvoiceDetailSerializer(many=True, read_only=True)
    comments_sales_pz = CommentsSerializer(many=True, read_only=True)

    class Meta:
        model = Sales_Persons
        fields = ['id', 'name', 'phone_number', 'address', 'email', 'invoice_sales_p', 'comments_sales_pz']
