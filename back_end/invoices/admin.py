# invoices/admin.py

from django.contrib import admin
from .models import Customers, Invoice, Comments

@admin.register(Customers)
class InvoiceAdmin(admin.ModelAdmin):
    search_fields = ['account', 'name', 'phone_number']

@admin.register(Invoice)
class InvoiceDetailAdmin(admin.ModelAdmin):
    search_fields = ['invoice','ref_no']

@admin.register(Comments)
class InvoiceCommentAdmin(admin.ModelAdmin):
    search_fields = ['invoice', 'ref_no', 'date']