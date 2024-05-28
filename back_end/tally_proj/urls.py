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
    path('comments/', views.get_all_comments, name='get_all_comments'),
    path('comment_paid/', views.update_comment_paid_status, name='update_comment_paid_status'),
    path('invoice_paid/', views.update_invoice_paid_status, name='update_invoice_paid_status'),
    path('paid_invoices/', views.get_paid_Invoice, name='get_paid_invoices'),
    path('to_do_invoices/', views.get_to_do_invoices, name='get_to_do_invoices'),
    path('pending_invoices/', views.get_pending_invoices, name='get_pending_invoices'),
]
