from django.contrib import admin
from django.urls import path, include
from invoices import views

urlpatterns = [
    path('admin/', admin.site.urls),  # Django admin URL
    path('invoices/', views.get_all_invoices, name='get_all_invoices'),
    path('process_uploaded_csv/', views.process_uploaded_csv, name='process_uploaded_csv'),
    path('process_update_csv/', views.process_update_csv, name='process_update_csv'),
    path('update-customer/', views.CustomerUpdateAPIView.as_view(), name='update_customer'),
    path('create-comment/', views.create_comment, name='create-comment'),
    path('create-sales/', views.create_sales, name='create-sales'),
    path('create_customer_name/', views.create_customer_name, name='create_customer_name'),
    path('comments/', views.get_all_comments, name='get_all_comments'),
    path('invoice_paid/', views.update_invoice_paid_status, name='update_invoice_paid_status'),
    path('invoice_acceptance/', views.new_invoice_acceptance, name='new_invoice_acceptance'),
    path('bulk_invoice_acceptance/', views.bulk_invoice_acceptance, name='bulk_invoice_acceptance'),
    path('invoice_old_paid/', views.old_invoice_acceptance, name='old_invoice_acceptance'),
    path('paid_invoices/', views.get_paid_Invoice, name='get_paid_invoices'),
    path('to_do_invoices/', views.get_to_do_invoices, name='get_to_do_invoices'),
    path('pending_invoices/', views.get_pending_invoices, name='get_pending_invoices'),
    path('review_invoices/', views.get_review_invoices, name='get_review_invoices'),
    path('invoice_sales_p/', views.update_invoice_sales_person, name='invoice_sales_person'),
    path('login/', views.login, name='login')
]
