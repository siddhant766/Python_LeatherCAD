import json
import secrets
import hashlib
from datetime import timedelta
import jwt
from django.conf import settings
from django.utils import timezone
from django.http import HttpResponse
from django.contrib.auth import authenticate
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import User, Product, Design, Project, Order, Material
from .serializers import (
    UserSerializer, ProductSerializer, DesignSerializer,
    ProjectSerializer, OrderSerializer, MaterialSerializer
)
from .authentication import IsAdminRole, ADMIN_EMAILS
from .pdf_service import generate_tech_pack_pdf


def generate_token(user_id):
    payload = {
        'id': user_id,
        'exp': timezone.now() + timedelta(days=30),
        'iat': timezone.now()
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm='HS256')


# ==========================================
# AUTH VIEWS (/api/auth)
# ==========================================

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    data = request.data
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', 'designer')
    company = data.get('company', '')

    if not name:
        return Response({'message': 'Name is required'}, status=status.HTTP_400_BAD_REQUEST)
    if not email:
        return Response({'message': 'Please include a valid email'}, status=status.HTTP_400_BAD_REQUEST)
    if len(password) < 6:
        return Response({'message': 'Please enter a password with 6 or more characters'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({'message': 'User already exists'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        name=name,
        role=role,
        company=company
    )

    token = generate_token(user.id)
    return Response({
        '_id': str(user.id),
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'role': user.role,
        'token': token,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    data = request.data
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'message': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)

    if user.check_password(password):
        token = generate_token(user.id)
        return Response({
            '_id': str(user.id),
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role,
            'token': token,
        })
    else:
        return Response({'message': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET', 'PUT'])
@permission_classes([permissions.IsAuthenticated])
def profile_view(request):
    user = request.user
    if request.method == 'GET':
        return Response({
            '_id': str(user.id),
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role,
            'company': user.company
        })
    elif request.method == 'PUT':
        data = request.data
        if 'name' in data:
            user.name = data['name']
        if 'email' in data:
            user.email = data['email'].strip().lower()
            user.username = user.email
        if 'company' in data:
            user.company = data['company']
        if 'password' in data and data['password']:
            user.set_password(data['password'])
        user.save()

        token = generate_token(user.id)
        return Response({
            '_id': str(user.id),
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'role': user.role,
            'company': user.company,
            'token': token,
        })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def forgot_password(request):
    email = request.data.get('email', '').strip().lower()
    try:
        user = User.objects.get(email=email)
        reset_token = secrets.token_hex(20)
        token_hash = hashlib.sha256(reset_token.encode('utf-8')).hexdigest()

        user.reset_password_token = token_hash
        user.reset_password_expire = timezone.now() + timedelta(minutes=15)
        user.save()

        reset_url = f"http://localhost:5173/resetpassword/{reset_token}"
        print(f"\n[MOCK EMAIL SERVICE]\nTo: {email}\nSubject: Password Reset Token\nReset Link: {reset_url}\n")
        return Response({'success': True, 'data': 'Email sent'})
    except User.DoesNotExist:
        return Response({'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['PUT'])
@permission_classes([permissions.AllowAny])
def reset_password(request, resettoken):
    token_hash = hashlib.sha256(resettoken.encode('utf-8')).hexdigest()
    try:
        user = User.objects.get(
            reset_password_token=token_hash,
            reset_password_expire__gt=timezone.now()
        )
        new_password = request.data.get('password')
        if not new_password or len(new_password) < 6:
            return Response({'message': 'Password must be at least 6 characters'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.reset_password_token = None
        user.reset_password_expire = None
        user.save()

        return Response({
            'success': True,
            'data': 'Password reset success',
            'token': generate_token(user.id)
        })
    except User.DoesNotExist:
        return Response({'message': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def google_login(request):
    data = request.data
    email = data.get('email', '').strip().lower()
    name = data.get('name', 'Google User')
    google_id = data.get('googleId', '')

    user = User.objects.filter(email=email).first()
    if user:
        if not user.google_id and google_id:
            user.google_id = google_id
            user.save()
    else:
        user = User.objects.create_user(
            username=email,
            email=email,
            name=name,
            role='designer',
            google_id=google_id,
            password=secrets.token_hex(16)
        )

    return Response({
        '_id': str(user.id),
        'id': user.id,
        'name': user.name,
        'email': user.email,
        'role': user.role,
        'token': generate_token(user.id),
    })


# ==========================================
# PRODUCTS VIEWS (/api/products)
# ==========================================

@api_view(['GET', 'POST'])
def product_list_create(request):
    if request.method == 'GET':
        products = Product.objects.all().order_by('-created_at')
        serializer = ProductSerializer(products, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        if not (request.user and (request.user.role == 'admin' or request.user.is_staff)):
            return Response({'message': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        serializer = ProductSerializer(data=request.data)
        if serializer.is_valid():
            product = serializer.save()
            return Response(ProductSerializer(product).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def product_detail(request, pk):
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response({'message': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(ProductSerializer(product).data)

    if not (request.user and (request.user.role == 'admin' or request.user.is_staff)):
        return Response({'message': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'PUT':
        serializer = ProductSerializer(product, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response(ProductSerializer(updated).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        product.delete()
        return Response({'message': 'Product removed'})


# ==========================================
# DESIGNS VIEWS (/api/designs)
# ==========================================

@api_view(['GET', 'POST'])
def design_list_create(request):
    if not request.user or not request.user.is_authenticated:
        return Response({'message': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        if request.user.role == 'admin' or request.user.is_staff:
            designs = Design.objects.all().order_by('-updated_at')
        else:
            designs = Design.objects.filter(user=request.user).order_by('-updated_at')
        serializer = DesignSerializer(designs, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        data = request.data.copy()
        # Ensure product id is provided
        product_val = data.get('product')
        if isinstance(product_val, dict):
            data['product_id'] = product_val.get('id') or product_val.get('_id')
        elif product_val:
            data['product_id'] = product_val

        serializer = DesignSerializer(data=data)
        if serializer.is_valid():
            design = serializer.save(user=request.user)
            return Response(DesignSerializer(design).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'DELETE'])
def design_detail(request, pk):
    try:
        design = Design.objects.get(pk=pk)
    except Design.DoesNotExist:
        return Response({'message': 'Design not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(DesignSerializer(design).data)

    elif request.method == 'DELETE':
        if not request.user or not request.user.is_authenticated:
            return Response({'message': 'Not authorized'}, status=status.HTTP_401_UNAUTHORIZED)
        if design.user_id != request.user.id and request.user.role != 'admin' and not request.user.is_staff:
            return Response({'message': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        design.delete()
        return Response({'message': 'Design removed'})


@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def design_update_status(request, pk):
    if request.user.role != 'admin' and not request.user.is_staff:
        return Response({'message': 'Not authorized as admin'}, status=status.HTTP_403_FORBIDDEN)
    try:
        design = Design.objects.get(pk=pk)
    except Design.DoesNotExist:
        return Response({'message': 'Design not found'}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    if new_status:
        design.status = new_status
        design.save()
    return Response(DesignSerializer(design).data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def design_export_pdf(request, pk):
    try:
        design = Design.objects.get(pk=pk)
    except Design.DoesNotExist:
        return Response({'message': 'Design not found'}, status=status.HTTP_404_NOT_FOUND)

    if design.user_id != request.user.id and request.user.role != 'admin' and not request.user.is_staff:
        return Response({'message': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

    buffer = generate_tech_pack_pdf(design)
    response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="TechPack-{design.id}.pdf"'
    return response


# ==========================================
# ORDERS VIEWS (/api/orders)
# ==========================================

@api_view(['GET', 'POST'])
def order_list_create(request):
    if not request.user or not request.user.is_authenticated:
        return Response({'message': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

    if request.method == 'GET':
        if request.user.role != 'admin' and not request.user.is_staff:
            return Response({'message': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        orders = Order.objects.all().order_by('-created_at')
        return Response(OrderSerializer(orders, many=True).data)

    elif request.method == 'POST':
        data = request.data
        order_items = data.get('orderItems', [])
        if not order_items:
            return Response({'message': 'No order items'}, status=status.HTTP_400_BAD_REQUEST)

        order = Order.objects.create(
            user=request.user,
            order_items=order_items,
            shipping_address=data.get('shippingAddress', {}),
            payment_method=data.get('paymentMethod', 'Credit Card'),
            items_price=data.get('itemsPrice', 0.0),
            tax_price=data.get('taxPrice', 0.0),
            shipping_price=data.get('shippingPrice', 0.0),
            total_price=data.get('totalPrice', 0.0),
            is_paid=True,
            paid_at=timezone.now()
        )
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def order_my_orders(request):
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    return Response(OrderSerializer(orders, many=True).data)


@api_view(['PUT'])
@permission_classes([permissions.IsAuthenticated])
def order_deliver(request, pk):
    if request.user.role != 'admin' and not request.user.is_staff:
        return Response({'message': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    try:
        order = Order.objects.get(pk=pk)
        order.is_delivered = True
        order.delivered_at = timezone.now()
        order.save()
        return Response(OrderSerializer(order).data)
    except Order.DoesNotExist:
        return Response({'message': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def order_delete(request, pk):
    if request.user.role != 'admin' and not request.user.is_staff:
        return Response({'message': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    try:
        order = Order.objects.get(pk=pk)
        order.delete()
        return Response({'message': 'Order removed'})
    except Order.DoesNotExist:
        return Response({'message': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)


# ==========================================
# PROJECTS VIEWS (/api/projects)
# ==========================================

@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def project_list_create(request):
    if request.method == 'GET':
        projects = Project.objects.all().order_by('-created_at')
        return Response(ProjectSerializer(projects, many=True).data)
    elif request.method == 'POST':
        serializer = ProjectSerializer(data=request.data)
        if serializer.is_valid():
            project = serializer.save(created_by=request.user)
            return Response(ProjectSerializer(project).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def project_detail(request, pk):
    try:
        project = Project.objects.get(pk=pk)
    except Project.DoesNotExist:
        return Response({'message': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        serializer = ProjectSerializer(project, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response(ProjectSerializer(updated).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'DELETE':
        project.delete()
        return Response({'message': 'Project removed'})


# ==========================================
# MATERIALS VIEWS (/api/materials)
# ==========================================

@api_view(['GET', 'POST'])
def material_list_create(request):
    if request.method == 'GET':
        materials = Material.objects.all().order_by('-created_at')
        return Response(MaterialSerializer(materials, many=True).data)
    elif request.method == 'POST':
        if not (request.user and (request.user.role == 'admin' or request.user.is_staff)):
            return Response({'message': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
        serializer = MaterialSerializer(data=request.data)
        if serializer.is_valid():
            material = serializer.save()
            return Response(MaterialSerializer(material).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def material_delete(request, pk):
    if request.user.role != 'admin' and not request.user.is_staff:
        return Response({'message': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    try:
        material = Material.objects.get(pk=pk)
        material.delete()
        return Response({'message': 'Material removed'})
    except Material.DoesNotExist:
        return Response({'message': 'Material not found'}, status=status.HTTP_404_NOT_FOUND)


# ==========================================
# CART VIEWS (/api/cart)
# ==========================================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def cart_get(request):
    return Response(request.user.cart or [])


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cart_add(request):
    user = request.user
    item = request.data.get('item', {})
    cart = list(user.cart or [])

    existing = next((c for c in cart if str(c.get('productId')) == str(item.get('id'))), None)
    if existing:
        existing['quantity'] = existing.get('quantity', 1) + 1
    else:
        cart.append({
            '_id': f"cart_{secrets.token_hex(6)}",
            'productId': str(item.get('id', '')),
            'name': item.get('name', ''),
            'price': item.get('price', 0),
            'image': item.get('image', ''),
            'quantity': 1,
            'config': item.get('config', {})
        })

    user.cart = cart
    user.save()
    return Response(user.cart)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cart_remove(request):
    user = request.user
    item_id = str(request.data.get('itemId', ''))
    cart = [c for c in (user.cart or []) if str(c.get('_id')) != item_id and str(c.get('productId')) != item_id]
    user.cart = cart
    user.save()
    return Response(user.cart)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cart_sync(request):
    user = request.user
    items = request.data.get('items', [])
    cart = list(user.cart or [])

    for local_item in items:
        pid = str(local_item.get('id', ''))
        exists = any(str(c.get('productId')) == pid for c in cart)
        if not exists:
            cart.append({
                '_id': f"cart_{secrets.token_hex(6)}",
                'productId': pid,
                'name': local_item.get('name', ''),
                'price': local_item.get('price', 0),
                'image': local_item.get('image', ''),
                'quantity': local_item.get('quantity', 1),
                'config': local_item.get('config', {})
            })

    user.cart = cart
    user.save()
    return Response(user.cart)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cart_clear(request):
    user = request.user
    user.cart = []
    user.save()
    return Response([])


# ==========================================
# USERS VIEWS (/api/users)
# ==========================================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_list(request):
    if request.user.role != 'admin' and not request.user.is_staff:
        return Response({'message': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    users = User.objects.all().order_by('-id')
    return Response(UserSerializer(users, many=True).data)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def user_detail(request, pk):
    if request.user.role != 'admin' and not request.user.is_staff:
        return Response({'message': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)
    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({'message': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(UserSerializer(user).data)
    elif request.method == 'PUT':
        data = request.data
        if 'name' in data:
            user.name = data['name']
        if 'email' in data:
            user.email = data['email'].strip().lower()
            user.username = user.email
        if 'role' in data:
            user.role = data['role']
        user.save()
        return Response(UserSerializer(user).data)
    elif request.method == 'DELETE':
        user.delete()
        return Response({'message': 'User removed'})


# ==========================================
# STATS VIEWS (/api/stats/admin)
# ==========================================

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_stats(request):
    if request.user.role != 'admin' and not request.user.is_staff and request.user.email not in ADMIN_EMAILS:
        return Response({'message': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

    # Pure, 100% true database counts
    users_count = User.objects.count()
    products_count = Product.objects.count()
    orders_count = Order.objects.count()
    delivered_count = Order.objects.filter(is_delivered=True).count()
    pending_review_count = Design.objects.filter(status='pending').count()

    paid_orders = Order.objects.filter(is_paid=True)
    total_revenue = round(sum([float(o.total_price) for o in paid_orders]), 2)

    # 1. Pure Last 7 Days Revenue Breakdown (Daily)
    today = timezone.now().date()
    revenue_data_7d = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_orders = Order.objects.filter(is_paid=True, created_at__date=day)
        day_rev = sum(float(o.total_price) for o in day_orders)
        revenue_data_7d.append({
            'name': day.strftime('%a'),
            'date': day.strftime('%b %d'),
            'fullDate': day.strftime('%Y-%m-%d'),
            'revenue': round(day_rev, 2),
            'orders': day_orders.count()
        })

    # 2. Pure Last 30 Days Revenue Breakdown (Daily)
    revenue_data_30d = []
    for i in range(29, -1, -1):
        day = today - timedelta(days=i)
        day_orders = Order.objects.filter(is_paid=True, created_at__date=day)
        day_rev = sum(float(o.total_price) for o in day_orders)
        revenue_data_30d.append({
            'name': day.strftime('%d %b'),
            'date': day.strftime('%b %d'),
            'fullDate': day.strftime('%Y-%m-%d'),
            'revenue': round(day_rev, 2),
            'orders': day_orders.count()
        })

    # 3. Pure Live Recent Activity Stream (Designs + Orders from real database records)
    recent_designs = Design.objects.select_related('user', 'product').order_by('-created_at')[:8]
    recent_orders_list = Order.objects.select_related('user').order_by('-created_at')[:8]

    activities = []
    for d in recent_designs:
        user_name = d.user.name or d.user.email if d.user else 'Designer'
        activities.append({
            'id': f'act_des_{d.id}',
            'type': 'design',
            'title': f'{user_name} submitted "{d.name}"',
            'subtitle': d.product.name if d.product else 'Custom Design',
            'status': d.status,
            'amount': None,
            'time': d.created_at.isoformat() if d.created_at else None,
            'date': d.created_at.strftime('%m/%d/%Y') if d.created_at else '',
            'avatar': user_name[0].upper()
        })

    for o in recent_orders_list:
        user_name = o.user.name or o.user.email if o.user else 'Customer'
        activities.append({
            'id': f'act_ord_{o.id}',
            'type': 'order',
            'title': f'{user_name} placed Order #{o.id}',
            'subtitle': f"${float(o.total_price):.2f} • {o.payment_method}",
            'status': 'Delivered' if o.is_delivered else 'Paid',
            'amount': float(o.total_price),
            'time': o.created_at.isoformat() if o.created_at else None,
            'date': o.created_at.strftime('%m/%d/%Y') if o.created_at else '',
            'avatar': user_name[0].upper()
        })

    # Sort descending by real ISO timestamp
    activities.sort(key=lambda x: x.get('time') or '', reverse=True)

    recent_orders = Order.objects.all().order_by('-created_at')[:5]

    return Response({
        'usersCount': users_count,
        'productsCount': products_count,
        'ordersCount': orders_count,
        'deliveredCount': delivered_count,
        'pendingReviewCount': pending_review_count,
        'totalRevenue': total_revenue,
        'revenueData': revenue_data_7d,
        'revenueData7d': revenue_data_7d,
        'revenueData30d': revenue_data_30d,
        'recentOrders': OrderSerializer(recent_orders, many=True).data,
        'recentActivity': activities[:8]
    })


# ==========================================
# PAYMENT VIEWS (/api/payment)
# ==========================================

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def payment_create_intent(request):
    return Response({
        'clientSecret': f"mock_client_secret_{int(timezone.now().timestamp())}",
        'amount': 14900
    })


# ==========================================
# AI GENERATION VIEWS (/api/ai)
# ==========================================

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def ai_generate_design(request):
    prompt = request.data.get('prompt', '').strip()
    product_type = request.data.get('productType', 'jacket').lower()

    if not prompt:
        return Response({'message': 'Prompt is required'}, status=status.HTTP_400_BAD_REQUEST)

    # Fallback palette
    fallbacks = {
        'jacket': {'body': '#333333', 'sleeves': '#000000', 'hardware': '#C0C0C0'},
        'bag': {'body': '#8B4513', 'handle': '#654321', 'hardware': '#FFD700'},
        'boots': {'body': '#5C4033', 'sole': '#1A1A1A', 'hardware': '#B87333'},
        'boot': {'body': '#5C4033', 'sole': '#1A1A1A', 'hardware': '#B87333'},
        'wallet': {'body': '#2c1810', 'hardware': '#d4af37'},
        'belt': {'body': '#3d2314', 'hardware': '#c0c0c0'}
    }

    config = None
    api_key = settings.GEMINI_API_KEY

    if api_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")

            system_prompt = f"""
You are a fashion design assistant for a leather product configurator.
The user wants a description of a {product_type}.
Return ONLY a valid JSON object with hex colors for the parts.
For jacket: body, sleeves, hardware
For bag: body, handle, hardware
For boots/boot: body, sole, hardware
For wallet: body, hardware
For belt: body, hardware

User prompt: "{prompt}"
Return format:
{{"body": "#...", "hardware": "#..."}}
"""
            result = model.generate_content(system_prompt)
            raw_text = result.text.strip()
            clean_text = raw_text.replace('```json', '').replace('```', '').strip()
            config = json.loads(clean_text)
        except Exception as e:
            print(f"[AI Generation Error]: {e}")

    if not config:
        config = fallbacks.get(product_type, fallbacks['jacket']).copy()
        config['isFallback'] = True

    return Response({'config': config})
