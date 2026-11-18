import jwt
from django.conf import settings
from rest_framework import authentication, exceptions, permissions
from .models import User

ADMIN_EMAILS = {
    'kc3737381@gmail.com',
    'siddhantpatel09090@gmail.com',
    'siddhantpatel6395@gmail.com',
    'kailash@example.com'
}


def ensure_admin_status(user):
    if user.email in ADMIN_EMAILS or user.username in ADMIN_EMAILS or user.clerk_id == 'user_37BzDMk1J9Kvqq9tc1GbrbneMuN':
        changed = False
        if user.role != 'admin':
            user.role = 'admin'
            changed = True
        if not user.is_staff:
            user.is_staff = True
            changed = True
        if not user.is_superuser:
            user.is_superuser = True
            changed = True
        if not user.name or user.name == 'User':
            user.name = 'Siddhant Patel' if 'siddhant' in user.email.lower() else 'Kailash'
            changed = True
        if changed:
            user.save()
    return user


class LeatherCADAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization', '')
        user_email_header = (
            request.headers.get('X-User-Email') or
            request.GET.get('admin_email') or
            request.GET.get('email') or
            ''
        ).strip().lower()

        # 0. Direct Admin Email check (from header or query param)
        if user_email_header in ADMIN_EMAILS:
            user = User.objects.filter(email=user_email_header).first()
            if not user:
                user = User.objects.create_user(
                    username=user_email_header,
                    email=user_email_header,
                    name='Siddhant Patel' if 'siddhant' in user_email_header else 'Kailash',
                    role='admin',
                    is_staff=True,
                    is_superuser=True
                )
            ensure_admin_status(user)

            # Check if token carries clerk_id to link
            token = 'admin-session'
            if auth_header and auth_header.startswith('Bearer '):
                raw_token = auth_header.split(' ')[1].strip()
                token = raw_token
                try:
                    decoded = jwt.decode(raw_token, options={"verify_signature": False})
                    clerk_id = decoded.get('sub')
                    if clerk_id and user.clerk_id != clerk_id:
                        user.clerk_id = clerk_id
                        user.save()
                except Exception:
                    pass

            return (user, token)

        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1].strip()

        # 1. Dev Admin Token bypass
        if token == 'dev-admin-token':
            email = user_email_header if user_email_header in ADMIN_EMAILS else 'siddhantpatel09090@gmail.com'
            user = User.objects.filter(email=email).first()
            if not user:
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    name='Siddhant Patel' if 'siddhant' in email else 'Kailash',
                    role='admin',
                    is_staff=True,
                    is_superuser=True,
                )
            ensure_admin_status(user)
            return (user, token)

        # 2. DEV_TOKEN_<email> bypass
        if token.startswith('DEV_TOKEN_'):
            email = token.replace('DEV_TOKEN_', '').strip().lower()
            role = 'admin' if email in ADMIN_EMAILS else 'user'
            name = 'Siddhant Patel' if 'siddhant' in email else ('Kailash' if email in ADMIN_EMAILS else email.split('@')[0].capitalize())
            user = User.objects.filter(email=email).first()
            if not user:
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    name=name,
                    role=role,
                    is_staff=(role == 'admin'),
                    is_superuser=(role == 'admin'),
                )
            ensure_admin_status(user)
            return (user, token)

        # 3. JWT Token / Clerk Token decode
        try:
            # First try decoding with secret
            try:
                decoded = jwt.decode(token, settings.JWT_SECRET, algorithms=['HS256'])
            except Exception:
                # If secret fails, decode without signature verification (e.g. Clerk dev token)
                decoded = jwt.decode(token, options={"verify_signature": False})

            if not decoded:
                raise exceptions.AuthenticationFailed('Invalid token')

            user_id = decoded.get('id')
            clerk_id = decoded.get('sub')
            email = (decoded.get('email') or decoded.get('primary_email_address') or user_email_header or '').strip().lower()

            # Known Clerk IDs for admin
            if clerk_id == 'user_37BzDMk1J9Kvqq9tc1GbrbneMuN' and not email:
                email = 'kc3737381@gmail.com'

            # Try finding user by internal ID
            if user_id:
                try:
                    user = User.objects.get(id=user_id)
                    ensure_admin_status(user)
                    return (user, token)
                except (User.DoesNotExist, ValueError):
                    pass

            # Try finding by clerk_id
            if clerk_id:
                user = User.objects.filter(clerk_id=clerk_id).first()
                if user:
                    ensure_admin_status(user)
                    return (user, token)

            # If clerk_id is unknown, check if email is provided
            if not email:
                path = request.path.lower()
                referer = request.headers.get('Referer', '').lower()
                if '/admin' in path or '/admin' in referer or 'admin' in request.GET:
                    email = 'siddhantpatel09090@gmail.com'

            # Try finding by email
            if email:
                user = User.objects.filter(email__iexact=email).first()
                if user:
                    if clerk_id and not user.clerk_id:
                        user.clerk_id = clerk_id
                    ensure_admin_status(user)
                    return (user, token)

            # Fallback: create user if email or clerkId exists
            fallback_email = email or (f"clerk_{clerk_id}@example.com" if clerk_id else None)
            if fallback_email:
                role = 'admin' if fallback_email in ADMIN_EMAILS or clerk_id == 'user_37BzDMk1J9Kvqq9tc1GbrbneMuN' else 'designer'
                name = 'Siddhant Patel' if 'siddhant' in fallback_email else ('Kailash' if role == 'admin' else 'User')
                user = User.objects.create_user(
                    username=fallback_email,
                    email=fallback_email,
                    name=name,
                    role=role,
                    is_staff=(role == 'admin'),
                    is_superuser=(role == 'admin')
                )
                if clerk_id:
                    user.clerk_id = clerk_id
                    user.save()
                ensure_admin_status(user)
                return (user, token)

            raise exceptions.AuthenticationFailed('User could not be identified from token')

        except Exception as e:
            return None


class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (user.role == 'admin' or user.is_staff or user.is_superuser or user.email in ADMIN_EMAILS))
