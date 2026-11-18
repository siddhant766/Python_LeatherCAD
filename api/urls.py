from django.urls import path, re_path
from . import views

urlpatterns = [
    # Auth
    re_path(r'^auth/register/?$', views.register, name='auth_register'),
    re_path(r'^auth/login/?$', views.login_view, name='auth_login'),
    re_path(r'^auth/profile/?$', views.profile_view, name='auth_profile'),
    re_path(r'^auth/forgotpassword/?$', views.forgot_password, name='auth_forgot_password'),
    re_path(r'^auth/resetpassword/(?P<resettoken>[a-zA-Z0-9]+)/?$', views.reset_password, name='auth_reset_password'),
    re_path(r'^auth/google/?$', views.google_login, name='auth_google'),

    # Products
    re_path(r'^products/?$', views.product_list_create, name='products_list_create'),
    re_path(r'^products/(?P<pk>\d+)/?$', views.product_detail, name='product_detail'),

    # Designs
    re_path(r'^designs/?$', views.design_list_create, name='designs_list_create'),
    re_path(r'^designs/(?P<pk>\d+)/status/?$', views.design_update_status, name='design_update_status'),
    re_path(r'^designs/(?P<pk>\d+)/export/?$', views.design_export_pdf, name='design_export_pdf'),
    re_path(r'^designs/(?P<pk>\d+)/?$', views.design_detail, name='design_detail'),

    # Orders
    re_path(r'^orders/?$', views.order_list_create, name='orders_list_create'),
    re_path(r'^orders/myorders/?$', views.order_my_orders, name='orders_my_orders'),
    re_path(r'^orders/(?P<pk>\d+)/deliver/?$', views.order_deliver, name='order_deliver'),
    re_path(r'^orders/(?P<pk>\d+)/?$', views.order_delete, name='order_delete'),

    # Projects
    re_path(r'^projects/?$', views.project_list_create, name='projects_list_create'),
    re_path(r'^projects/(?P<pk>\d+)/?$', views.project_detail, name='project_detail'),

    # Materials
    re_path(r'^materials/?$', views.material_list_create, name='materials_list_create'),
    re_path(r'^materials/(?P<pk>\d+)/?$', views.material_delete, name='material_delete'),

    # Cart
    re_path(r'^cart/?$', views.cart_get, name='cart_get'),
    re_path(r'^cart/add/?$', views.cart_add, name='cart_add'),
    re_path(r'^cart/remove/?$', views.cart_remove, name='cart_remove'),
    re_path(r'^cart/sync/?$', views.cart_sync, name='cart_sync'),
    re_path(r'^cart/clear/?$', views.cart_clear, name='cart_clear'),

    # Users
    re_path(r'^users/?$', views.user_list, name='user_list'),
    re_path(r'^users/(?P<pk>\d+)/?$', views.user_detail, name='user_detail'),

    # Stats
    re_path(r'^stats/admin/?$', views.admin_stats, name='admin_stats'),

    # Payment
    re_path(r'^payment/create-intent/?$', views.payment_create_intent, name='payment_create_intent'),

    # AI
    re_path(r'^ai/generate-design/?$', views.ai_generate_design, name='ai_generate_design'),
]
