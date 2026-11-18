from datetime import timedelta
import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import User, Product, Material, Project, Design, Order


class Command(BaseCommand):
    help = 'Seeds initial products, users, materials, projects, designs, and orders for LeatherCAD'

    def handle(self, *args, **options):
        self.stdout.write("Starting LeatherCAD data seeding...")

        # 1. Users
        users_to_seed = [
            {'name': 'Kailash', 'email': 'kc3737381@gmail.com', 'password': 'password123', 'role': 'admin', 'is_staff': True, 'is_superuser': True},
            {'name': 'Siddhant Patel', 'email': 'siddhantpatel09090@gmail.com', 'password': 'password123', 'role': 'admin', 'is_staff': True, 'is_superuser': True},
            {'name': 'Kailash', 'email': 'kailash@example.com', 'password': 'password123', 'role': 'admin', 'is_staff': True, 'is_superuser': True},
            {'name': 'Siddhant', 'email': 'siddhant@example.com', 'password': 'password123', 'role': 'designer'},
            {'name': 'Varsha', 'email': 'varsha@example.com', 'password': 'password123', 'role': 'user'},
            {'name': 'Jane Designer', 'email': 'designer@example.com', 'password': 'password123', 'role': 'designer'}
        ]

        seeded_users = {}
        for u in users_to_seed:
            user = User.objects.filter(email=u['email']).first()
            if not user:
                user = User.objects.create_user(
                    username=u['email'],
                    email=u['email'],
                    name=u['name'],
                    role=u['role'],
                    is_staff=u.get('is_staff', False),
                    is_superuser=u.get('is_superuser', False)
                )
                user.set_password(u['password'])
                user.save()
                self.stdout.write(f"Created user: {u['name']} ({u['role']})")
            else:
                user.name = u['name']
                user.role = u['role']
                if u.get('is_superuser'):
                    user.is_staff = True
                    user.is_superuser = True
                user.set_password(u['password'])
                user.save()
                self.stdout.write(f"Updated user: {u['name']}")
            seeded_users[u['email']] = user

        kailash = seeded_users['kailash@example.com']
        siddhant = seeded_users['siddhant@example.com']
        varsha = seeded_users['varsha@example.com']

        # 2. Products
        products_data = [
            {
                'name': 'Classic Leather Jacket',
                'category': 'jacket',
                'price_base': 14999.00,
                'model_url': 'jacket',
                'thumbnail_url': '/assets/jacket-thumb.jpg',
                'description': 'Handcrafted premium grain motorcycle jacket with customizable panels and hardware.'
            },
            {
                'name': 'Premium Tote Bag',
                'category': 'bag',
                'price_base': 4999.00,
                'model_url': 'bag',
                'thumbnail_url': '/assets/bag-thumb.jpg',
                'description': 'Spacious everyday tote made from veg-tanned full-grain leather.'
            },
            {
                'name': 'Motorcycle Boots',
                'category': 'boot',
                'price_base': 6999.00,
                'model_url': 'boots',
                'thumbnail_url': '/assets/boots-thumb.jpg',
                'description': 'Durable riding boots reinforced with Goodyear welt construction.'
            },
            {
                'name': 'Heritage Belt',
                'category': 'belt',
                'price_base': 1899.00,
                'model_url': 'belt',
                'thumbnail_url': '/assets/belt-thumb.jpg',
                'description': 'Solid brass buckle with 100% thick saddle leather.'
            },
            {
                'name': 'Slim Wallet',
                'category': 'wallet',
                'price_base': 1299.00,
                'model_url': 'wallet',
                'thumbnail_url': '/assets/wallet-thumb.jpg',
                'description': 'Minimalist front-pocket bifold with RFID blocking lining.'
            },
            {
                'name': 'Weekender Duffle',
                'category': 'bag',
                'price_base': 7499.00,
                'model_url': 'bag',
                'thumbnail_url': '/assets/duffle-thumb.jpg',
                'description': 'Heavy-duty travel duffle featuring hand-stitched leather handles.'
            }
        ]

        seeded_products = []
        for p in products_data:
            prod, created = Product.objects.get_or_create(
                name=p['name'],
                defaults=p
            )
            seeded_products.append(prod)
        self.stdout.write(f"Seeded {len(seeded_products)} Products.")

        # 3. Materials
        materials_data = [
            {'name': 'Obsidian Matte Leather', 'type': 'leather', 'color': '#111827', 'price': 25.00, 'in_stock': True},
            {'name': 'Cognac Tuscan Leather', 'type': 'leather', 'color': '#78350f', 'price': 30.00, 'in_stock': True},
            {'name': 'Oxblood Calfskin', 'type': 'leather', 'color': '#450a0a', 'price': 35.00, 'in_stock': True},
            {'name': 'Antique Brass Hardware', 'type': 'hardware', 'color': '#d97706', 'price': 15.00, 'in_stock': True},
            {'name': 'Polished Nickel Hardware', 'type': 'hardware', 'color': '#9ca3af', 'price': 12.00, 'in_stock': True},
        ]
        for m in materials_data:
            Material.objects.get_or_create(name=m['name'], defaults=m)
        self.stdout.write(f"Seeded Materials.")

        # 4. Projects
        projects_data = [
            {'name': 'Leather Jacket 2026', 'description': 'Advanced biker jacket with smart heating panels.', 'status': 'active', 'created_by': siddhant},
            {'name': 'Luxury Handbag Line', 'description': 'Gold-plated hardware collection for spring.', 'status': 'active', 'created_by': siddhant},
            {'name': 'Automotive Interiors', 'description': 'Custom vegan leather seat covers for luxury EV.', 'status': 'review', 'created_by': kailash},
            {'name': 'Winter Boots Archive', 'description': 'Archived winter bestsellers collection.', 'status': 'archived', 'created_by': varsha}
        ]
        for prj in projects_data:
            Project.objects.get_or_create(name=prj['name'], defaults=prj)
        self.stdout.write(f"Seeded Projects.")

        # 5. Designs
        jacket_prod = seeded_products[0]
        bag_prod = seeded_products[1]
        wallet_prod = seeded_products[4]

        designs_data = [
            {
                'user': siddhant,
                'product': jacket_prod,
                'name': 'Cyberpunk Biker Edition',
                'configuration': {'body': '#1a1a1a', 'sleeves': '#2d3748', 'hardware': '#ecc94b'},
                'preview_image_url': 'https://images.unsplash.com/photo-1551028919-ac66c5f8b6b9?w=500&auto=format&fit=crop&q=60',
                'is_public': True,
                'status': 'pending'
            },
            {
                'user': varsha,
                'product': bag_prod,
                'name': 'Floral Autumn Tote',
                'configuration': {'body': '#78350f', 'handle': '#451a03', 'hardware': '#d97706'},
                'preview_image_url': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500&auto=format&fit=crop&q=60',
                'is_public': True,
                'status': 'approved'
            },
            {
                'user': kailash,
                'product': wallet_prod,
                'name': 'Minimalist Charcoal Wallet',
                'configuration': {'body': '#111827', 'hardware': '#9ca3af'},
                'preview_image_url': 'https://images.unsplash.com/photo-1627123424574-7147e6978f3c?w=500&auto=format&fit=crop&q=60',
                'is_public': True,
                'status': 'approved'
            }
        ]
        for d in designs_data:
            Design.objects.get_or_create(name=d['name'], user=d['user'], defaults=d)
        self.stdout.write(f"Seeded Designs.")

        # 6. Orders (Historical data for revenue charts)
        if Order.objects.count() == 0:
            for i in range(15):
                user = random.choice([siddhant, varsha, kailash])
                prod = random.choice(seeded_products)
                days_ago = random.randint(1, 28)
                created_dt = timezone.now() - timedelta(days=days_ago)

                qty = random.randint(1, 2)
                item_price = float(prod.price_base)
                items_total = item_price * qty
                tax = items_total * 0.1
                shipping = 15.0
                total = items_total + tax + shipping

                order = Order.objects.create(
                    user=user,
                    order_items=[{
                        'productId': str(prod.id),
                        'name': prod.name,
                        'qty': qty,
                        'price': item_price,
                        'image': prod.thumbnail_url
                    }],
                    shipping_address={
                        'firstName': user.name.split(' ')[0],
                        'lastName': 'User',
                        'address': '123 Maker Street',
                        'city': 'San Francisco',
                        'postalCode': '94103',
                        'country': 'USA'
                    },
                    payment_method='Credit Card',
                    payment_result={'id': f"mock_pay_{int(created_dt.timestamp())}", 'status': 'completed'},
                    items_price=items_total,
                    tax_price=tax,
                    shipping_price=shipping,
                    total_price=total,
                    is_paid=True,
                    paid_at=created_dt,
                    is_delivered=days_ago > 7,
                    delivered_at=created_dt + timedelta(days=4) if days_ago > 7 else None
                )
                order.created_at = created_dt
                order.save()

            self.stdout.write(f"Seeded Orders with historical dates.")

        self.stdout.write(self.style.SUCCESS("LeatherCAD Admin & Catalog Data Seeded Successfully!"))
