from django.contrib import admin
from django.urls import path, include
from invoices import views

urlpatterns = [
    path('admin/', admin.site.urls),  # Django admin URL
    path('invoices/', views.get_all_invoices, name='get_all_invoices'),
    path('process_uploaded_csv/', views.process_uploaded_csv, name='process_uploaded_csv'),
    path('process_update_csv/', views.process_update_csv, name='process_update_csv'),
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
    path('login/', views.login, name='login'),
    path('sales/', views.get_all_sales, name='get_all_sales'),
    path('accountants/', views.get_all_accountants, name='get_all_accountants'),
    path('manager_1/', views.manager_1, name='manager_1'),
    path('manager_2/', views.manager_2, name='manager_2'),
    path('manager_3/', views.manager_3, name='manager_3'),
    path('manager_4/', views.manager_4, name='manager_4'),
    path('all_users/', views.all_users, name='all_users'),
    path('create_user/', views.create_user, name='create_user'),
    path('update_target_collections/', views.update_target_collections, name='update_target_collections'),
    path('get_customer/', views.get_customer, name='get_customer'),
]
