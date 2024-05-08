from django.contrib import admin
from django.urls import path, include
from invoices import views

urlpatterns = [
    path('admin/', admin.site.urls),  # Django admin URL
    path('invoices/', include('invoices.urls')),  # Include invoices app URLs
    # Add more app URLs here if needed
    path('process_uploaded_csv/', views.process_uploaded_csv, name='process_uploaded_csv'),
    path('update-customer/', views.CustomerUpdateAPIView.as_view(), name='update_customer'),
    path('create-comment/', views.create_comment, name='create-comment'),
    path('comments/', views.get_all_comments, name='get_all_comments'),
]
