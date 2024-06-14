# invoices/admin.py

from django.contrib import admin
from .models import Customers, Invoice, Comments, Sales_Persons, Users


@admin.register(Users)
class InvoiceSalesPersonAdmin(admin.ModelAdmin):
    search_fields = ['username']

@admin.register(Sales_Persons)
class InvoiceSalesPersonAdmin(admin.ModelAdmin):
    search_fields = ['name']

@admin.register(Customers)
class InvoiceAdmin(admin.ModelAdmin):
    search_fields = ['account', 'name', 'phone_number']

@admin.register(Invoice)
class InvoiceDetailAdmin(admin.ModelAdmin):
    search_fields = ['ref_no']

@admin.register(Comments)
class InvoiceCommentAdmin(admin.ModelAdmin):
    search_fields = ['date']

# @admin.register(Name)
# class InvoiceNameAdmin(admin.ModelAdmin):
#     search_fields = ['name', 'invoice', 'phone_number']
    
