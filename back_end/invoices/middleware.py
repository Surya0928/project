from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

class DisableCsrfMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        setattr(request, '_dont_enforce_csrf_checks', True)
        response = self.get_response(request)
        return response