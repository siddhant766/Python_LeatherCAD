from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Product, Design, Project, Order, Material


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'name', 'role', 'company', 'is_staff', 'is_superuser')
    list_filter = ('role', 'is_staff', 'is_superuser')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('LeatherCAD Profile', {'fields': ('name', 'role', 'company', 'clerk_id', 'google_id', 'cart')}),
    )
    search_fields = ('email', 'name', 'company')
    ordering = ('email',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price_base', 'model_url', 'created_at')
    list_filter = ('category',)
    search_fields = ('name', 'description')


@admin.register(Design)
class DesignAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'product', 'status', 'is_public', 'updated_at')
    list_filter = ('status', 'is_public', 'product__category')
    search_fields = ('name', 'user__name', 'user__email')


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'status', 'created_by', 'created_at')
    list_filter = ('status',)
    search_fields = ('name', 'description')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total_price', 'payment_method', 'is_paid', 'is_delivered', 'created_at')
    list_filter = ('is_paid', 'is_delivered', 'payment_method')
    search_fields = ('user__name', 'user__email', 'id')


@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'color', 'price', 'in_stock')
    list_filter = ('type', 'in_stock')
    search_fields = ('name', 'color')
