import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('designer', 'Designer'),
        ('user', 'User'),
    )

    name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    company = models.CharField(max_length=255, blank=True, null=True)
    clerk_id = models.CharField(max_length=255, unique=True, blank=True, null=True)
    google_id = models.CharField(max_length=255, unique=True, blank=True, null=True)
    reset_password_token = models.CharField(max_length=255, blank=True, null=True)
    reset_password_expire = models.DateTimeField(blank=True, null=True)
    cart = models.JSONField(default=list, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.email
        if not self.name:
            self.name = f"{self.first_name} {self.last_name}".strip() or self.username
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name or self.email} ({self.role})"


class Material(models.Model):
    TYPE_CHOICES = (
        ('leather', 'Leather'),
        ('fabric', 'Fabric'),
        ('hardware', 'Hardware'),
        ('thread', 'Thread'),
        ('other', 'Other'),
    )

    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='leather')
    color = models.CharField(max_length=50)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    image_url = models.CharField(max_length=500, blank=True, default='')
    in_stock = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.type})"


class Product(models.Model):
    CATEGORY_CHOICES = (
        ('jacket', 'Jacket'),
        ('bag', 'Bag'),
        ('boot', 'Boot'),
        ('wallet', 'Wallet'),
        ('belt', 'Belt'),
    )

    name = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    price_base = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True, default='')
    thumbnail_url = models.CharField(max_length=500, blank=True, default='')
    model_url = models.CharField(max_length=500, blank=True, default='')
    camera_config = models.JSONField(default=dict, blank=True)
    customizable_zones = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Design(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='designs')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='designs')
    name = models.CharField(max_length=255)
    configuration = models.JSONField(default=dict)
    preview_image_url = models.TextField(blank=True, default='')
    is_public = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} by {self.user.name or self.user.email}"


class Project(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
        ('review', 'Review'),
    )

    name = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='projects')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    order_items = models.JSONField(default=list)
    shipping_address = models.JSONField(default=dict)
    payment_method = models.CharField(max_length=50, default='Card')
    payment_result = models.JSONField(default=dict, blank=True)
    items_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tax_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    shipping_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_paid = models.BooleanField(default=False)
    paid_at = models.DateTimeField(null=True, blank=True)
    is_delivered = models.BooleanField(default=False)
    delivered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.id} by {self.user.name or self.user.email}"
