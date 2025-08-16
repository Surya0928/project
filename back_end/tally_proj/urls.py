from django.contrib import admin
from django.urls import path, include
from invoices import views

urlpatterns = [
    path('admin/', admin.site.urls),  # Django admin URL
    path('api/', include('invoices.urls')),
]
