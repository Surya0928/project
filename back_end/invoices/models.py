from django.db import models

class Users(models.Model):
    username = models.CharField(max_length=100)
    password = models.CharField(max_length=100)
    address = models.CharField(max_length=100)
    role = models.CharField(max_length=20)

class Customers(models.Model):
    user = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='customer_user', default=None)
    account = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    name = models.CharField(max_length=200, null=True, blank=True)
    optimal_due = models.DecimalField(default=0.00, max_digits=10, decimal_places=2)
    threshold_due = models.DecimalField(default=0.00, max_digits=10, decimal_places=2)
    over_due = models.DecimalField(default=0.00, max_digits=10, decimal_places=2)
    total_due = models.DecimalField(default=0.00, max_digits=10, decimal_places=2)
    invoices = models.CharField(max_length=100, null=False)
    promised_amount = models.DecimalField(default=0.00, max_digits=10, decimal_places=2)
    promised_date = models.DateField(null=True, blank=True)
    premium_user = models.BooleanField(default=False)
    

    def __str__(self):
        return f"{(self.account)}"
 
class Sales_Persons(models.Model):
    name = models.CharField(max_length=100, null=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    address = models.CharField(max_length=1000, null=True, blank=True)
    email = models.EmailField(max_length=100, null = True, blank=True)
    
    def __str__(self):
        return self.name if self.name else ''
    
class Invoice(models.Model):
    user = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='invoice_user', default=None)
    invoice = models.ForeignKey(Customers, on_delete=models.CASCADE, related_name='invoice_details', default=None)
    date = models.DateField(null=True, blank=True)
    ref_no = models.CharField(max_length=100)
    pending = models.DecimalField(default=0.00, max_digits=10, decimal_places=2)
    due_on = models.DateField(null=True, blank=True)
    days_passed = models.IntegerField(default=0)
    sales_person = models.ForeignKey(Sales_Persons,on_delete=models.SET_NULL, related_name='invoice_sales_p', default=None, null=True, blank=True)
    paid = models.BooleanField(default=False)
    paid_date = models.DateField(null=True, blank=True)
    new = models.BooleanField(default=False)
    old = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.invoice}"
    
class Comments(models.Model):
    user = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='comments_user', default=None)
    invoice = models.ForeignKey(Customers, on_delete=models.CASCADE, related_name='invoice_comments', default=None)
    date = models.DateField(null=True, blank=True)
    invoice_list = models.CharField(max_length=1000, null=True, blank=True)
    remarks = models.CharField(max_length=1000, null=True, blank=True)
    amount_promised = models.DecimalField(default=0.00, max_digits=10, decimal_places=2, null=True, blank=True)
    follow_up_date = models.DateField(null=True, blank=True)
    sales_person = models.ForeignKey(Sales_Persons,on_delete=models.SET_NULL, related_name='comments_sales_pz', default=None, null=True, blank=True)
    promised_date = models.DateField(null=True, blank=True)
    follow_up_time = models.TimeField(null=True, blank=True)
    comment_paid = models.BooleanField(default=False, null=True)

    

    def _str_(self):
        return f"{self.invoice}"
    
class Name(models.Model):
    user = models.ForeignKey(Users, on_delete=models.CASCADE, related_name='name_user', default=None)
    invoice = models.ForeignKey(Customers, on_delete=models.CASCADE, related_name='name_customer', default=None)
    name = models.CharField(max_length=200, null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)

    def _str_(self):
        return f"{self.invoice}"