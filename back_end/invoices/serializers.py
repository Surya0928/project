from rest_framework import serializers
from .models import Customers, Invoice, Comments

class CommentsQuerySerializer(serializers.Serializer):
    reference = serializers.CharField(max_length=100)

class CommentsSerializer(serializers.ModelSerializer):
    invoice = serializers.CharField(max_length=100)  # Use CharField for account (invoice) string

    class Meta:
        model = Comments
        fields = ['invoice', 'reference', 'comment', 'date']

    def create(self, validated_data):
        # Extract and handle the invoice string value
        invoice_account = validated_data.pop('invoice', None)
        if invoice_account:
            customer = Customers.objects.get(account=invoice_account)
            validated_data['invoice'] = customer
        return super().create(validated_data)


class InvoiceDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = ('id','invoice', 'date', 'ref_no', 'pending', 'due_on', 'days_passed')


class InvoiceSerializer(serializers.ModelSerializer):
    invoice_details = InvoiceDetailSerializer(many=True, read_only=True)

    class Meta:
        model = Customers
        fields = ('id', 'account', 'name', 'phone_number', 'optimal_due', 'threshold_due', 'over_due', 'total_due','promised_amount', 'promised_date' , 'sales_person', 'invoices', 'invoice_details' )


class CustomerUpdateSerializer(serializers.Serializer):
    account = serializers.CharField(max_length=100, allow_null=True)
    promised_amount = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    promised_date = serializers.DateField(allow_null=True)
    name = serializers.CharField(max_length=100, allow_null=True)
    phone_number = serializers.CharField(max_length=100, allow_null=True)
    sales_person = serializers.CharField(max_length=100, allow_null=True, required=False)

    def update(self, instance, validated_data):
        # Iterate over each field in validated_data
        for field_name, value in validated_data.items():
            if value or value==0.00:
                setattr(instance, field_name, value)
        
        # Save the instance after all updates
        instance.save()
        return instance

