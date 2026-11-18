from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


def root_health_check(request):
    return JsonResponse({
        'status': 'LeatherCAD Django API is running',
        'version': '2.0.0',
        'framework': 'Python Django 6.1 + Django REST Framework',
        'api_root': '/api/',
        'admin_panel': '/admin/'
    })


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('', root_health_check, name='root_health_check'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
