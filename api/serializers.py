from rest_framework import serializers
from .models import User, Product, Design, Project, Order, Material


class UserSerializer(serializers.ModelSerializer):
    _id = serializers.CharField(source='id', read_only=True)

    class Meta:
        model = User
        fields = ['id', '_id', 'name', 'email', 'role', 'company', 'cart', 'date_joined']
        extra_kwargs = {'password': {'write_only': True}}


class MaterialSerializer(serializers.ModelSerializer):
    _id = serializers.CharField(source='id', read_only=True)
    imageUrl = serializers.CharField(source='image_url', required=False, allow_blank=True)
    inStock = serializers.BooleanField(source='in_stock', required=False)

    class Meta:
        model = Material
        fields = ['id', '_id', 'name', 'type', 'color', 'price', 'imageUrl', 'inStock', 'created_at']


class ProductSerializer(serializers.ModelSerializer):
    _id = serializers.CharField(source='id', read_only=True)
    thumbnailUrl = serializers.CharField(source='thumbnail_url', required=False, allow_blank=True)
    modelUrl = serializers.CharField(source='model_url', required=False, allow_blank=True)
    cameraConfig = serializers.JSONField(source='camera_config', required=False)
    customizableZones = serializers.JSONField(source='customizable_zones', required=False)

    class Meta:
        model = Product
        fields = [
            'id', '_id', 'name', 'category', 'price_base', 'description',
            'thumbnailUrl', 'modelUrl', 'cameraConfig', 'customizableZones',
            'created_at', 'updated_at'
        ]


class DesignUserSerializer(serializers.ModelSerializer):
    _id = serializers.CharField(source='id', read_only=True)

    class Meta:
        model = User
        fields = ['id', '_id', 'name', 'email']


class DesignProductSerializer(serializers.ModelSerializer):
    _id = serializers.CharField(source='id', read_only=True)
    thumbnailUrl = serializers.CharField(source='thumbnail_url', read_only=True)
    modelUrl = serializers.CharField(source='model_url', read_only=True)

    class Meta:
        model = Product
        fields = ['id', '_id', 'name', 'category', 'thumbnailUrl', 'modelUrl', 'price_base']


class DesignSerializer(serializers.ModelSerializer):
    _id = serializers.CharField(source='id', read_only=True)
    user = DesignUserSerializer(read_only=True)
    product = DesignProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source='product', write_only=True
    )
    previewImageUrl = serializers.CharField(source='preview_image_url', required=False, allow_blank=True)
    isPublic = serializers.BooleanField(source='is_public', required=False)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)

    class Meta:
        model = Design
        fields = [
            'id', '_id', 'user', 'product', 'product_id', 'name',
            'configuration', 'previewImageUrl', 'isPublic', 'status',
            'createdAt', 'updatedAt'
        ]


class ProjectSerializer(serializers.ModelSerializer):
    _id = serializers.CharField(source='id', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Project
        fields = ['id', '_id', 'name', 'description', 'status', 'created_by', 'createdAt']


class OrderSerializer(serializers.ModelSerializer):
    _id = serializers.CharField(source='id', read_only=True)
    user = DesignUserSerializer(read_only=True)
    orderItems = serializers.JSONField(source='order_items', required=False)
    shippingAddress = serializers.JSONField(source='shipping_address', required=False)
    paymentMethod = serializers.CharField(source='payment_method', required=False)
    paymentResult = serializers.JSONField(source='payment_result', required=False)
    itemsPrice = serializers.DecimalField(source='items_price', max_digits=10, decimal_places=2, required=False)
    taxPrice = serializers.DecimalField(source='tax_price', max_digits=10, decimal_places=2, required=False)
    shippingPrice = serializers.DecimalField(source='shipping_price', max_digits=10, decimal_places=2, required=False)
    totalPrice = serializers.DecimalField(source='total_price', max_digits=10, decimal_places=2, required=False)
    total = serializers.DecimalField(source='total_price', max_digits=10, decimal_places=2, read_only=True)
    isPaid = serializers.BooleanField(source='is_paid', required=False)
    paidAt = serializers.DateTimeField(source='paid_at', required=False, allow_null=True)
    isDelivered = serializers.BooleanField(source='is_delivered', required=False)
    deliveredAt = serializers.DateTimeField(source='delivered_at', required=False, allow_null=True)
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    date = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', '_id', 'user', 'orderItems', 'shippingAddress',
            'paymentMethod', 'paymentResult', 'itemsPrice', 'taxPrice',
            'shippingPrice', 'totalPrice', 'total', 'isPaid', 'paidAt',
            'isDelivered', 'deliveredAt', 'createdAt', 'date'
        ]

    def get_date(self, obj):
        return obj.created_at.strftime('%Y-%m-%d') if obj.created_at else ''
