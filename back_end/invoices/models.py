from django.db import models

class Customers(models.Model):
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
    sales_person = models.CharField(max_length=100 , null=True, blank=True)


    def __str__(self):
        return f"{(self.account)}"

class Invoice(models.Model):
    invoice = models.ForeignKey(Customers, on_delete=models.CASCADE, related_name='invoice_details', default=None)
    date = models.DateField(null=True, blank=True)
    ref_no = models.CharField(max_length=100)
    pending = models.DecimalField(default=0.00, max_digits=10, decimal_places=2)
    due_on = models.DateField(null=True, blank=True)
    days_passed = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.invoice}"
    
class Comments(models.Model):
    invoice = models.ForeignKey(Customers, on_delete=models.CASCADE, related_name='invoice_comments', default=None)
    date = models.DateField(null=True, blank=True)
    invoice_list = models.CharField(max_length=1000, null=True, blank=True)
    remarks = models.CharField(max_length=1000, null=True, blank=True)
    amount_promised = models.DecimalField(default=0.00, max_digits=10, decimal_places=2)
    sales_follow_msg = models.CharField(max_length=1000, null=True, blank=True)
    sales_follow_response = models.CharField(max_length=1000, null=True, blank=True)
    sales_up_date = models.DateField(null=True, blank=True)
    

    def _str_(self):
        return f"comment on {self.invoice}"
    