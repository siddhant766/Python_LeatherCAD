from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import User, Product, Design, Order, Project, Material


class LeatherCADAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create Admin
        self.admin_user = User.objects.create_user(
            username='admin@leathercad.com',
            email='admin@leathercad.com',
            name='Admin User',
            role='admin',
            is_staff=True,
            is_superuser=True
        )
        self.admin_user.set_password('password123')
        self.admin_user.save()

        # Create Designer
        self.designer_user = User.objects.create_user(
            username='designer@leathercad.com',
            email='designer@leathercad.com',
            name='Designer User',
            role='designer'
        )
        self.designer_user.set_password('password123')
        self.designer_user.save()

        # Create Sample Product
        self.product = Product.objects.create(
            name='Classic Leather Jacket',
            category='jacket',
            price_base=299.00,
            model_url='jacket',
            thumbnail_url='/assets/jacket-thumb.jpg'
        )

        # Create Sample Material
        self.material = Material.objects.create(
            name='Tuscan Cognac Leather',
            type='leather',
            color='#78350f',
            price=30.00
        )

        # Create Sample Design
        self.design = Design.objects.create(
            user=self.designer_user,
            product=self.product,
            name='Biker Special',
            configuration={'body': '#111827', 'hardware': '#ecc94b'},
            status='pending'
        )

        # Create Sample Project
        self.project = Project.objects.create(
            name='Spring 2026 Collection',
            description='New collection testing',
            status='active',
            created_by=self.designer_user
        )

        # Create Sample Order
        self.order = Order.objects.create(
            user=self.designer_user,
            order_items=[{'name': 'Jacket', 'qty': 1, 'price': 299}],
            shipping_address={'city': 'New York'},
            total_price=299.00,
            is_paid=True
        )

    def test_root_health_check(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('status', response.json())

    def test_auth_login(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'admin@leathercad.com',
            'password': 'password123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['role'], 'admin')

    def test_auth_register(self):
        response = self.client.post('/api/auth/register/', {
            'name': 'New User',
            'email': 'newuser@leathercad.com',
            'password': 'password123',
            'role': 'user'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', response.data)

    def test_products_list(self):
        response = self.client.get('/api/products/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 1)
        # Check both id and _id compatibility
        self.assertIn('_id', response.data[0])
        self.assertIn('thumbnailUrl', response.data[0])

    def test_dev_admin_token_bypass(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dev-admin-token')
        response = self.client.get('/api/stats/admin/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('usersCount', response.data)
        self.assertIn('totalRevenue', response.data)

    def test_designer_designs_list(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dev-admin-token')
        response = self.client.get('/api/designs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 1)
        self.assertIn('_id', response.data[0])
        self.assertIn('configuration', response.data[0])

    def test_update_design_status(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dev-admin-token')
        response = self.client.put(f'/api/designs/{self.design.id}/status/', {'status': 'approved'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'approved')

    def test_export_tech_pack_pdf(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dev-admin-token')
        response = self.client.get(f'/api/designs/{self.design.id}/export/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertTrue(len(response.content) > 100)

    def test_cart_operations(self):
        self.client.credentials(HTTP_AUTHORIZATION='Bearer dev-admin-token')
        # Add item
        response = self.client.post('/api/cart/add/', {
            'item': {'id': str(self.product.id), 'name': 'Classic Jacket', 'price': 299}
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        # Get cart
        get_res = self.client.get('/api/cart/')
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(get_res.data), 1)

        # Clear cart
        clear_res = self.client.post('/api/cart/clear/', format='json')
        self.assertEqual(clear_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(clear_res.data), 0)

    def test_ai_fallback_generation(self):
        response = self.client.post('/api/ai/generate-design/', {
            'prompt': 'Sleek black cyber jacket with gold accents',
            'productType': 'jacket'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('config', response.data)
        self.assertIn('body', response.data['config'])
