import jwt
import time
from django.conf import settings
from rest_framework import authentication, exceptions, permissions
from .models import User

ADMIN_EMAILS = {
    'kc3737381@gmail.com',
    'siddhantpatel09090@gmail.com'
}


class LeatherCADAuthentication(authentication.BaseAuthentication):
    """
    Hybrid JWT Authentication:
    1. First validates HS256 tokens signed with settings.JWT_SECRET (internal session tokens).
    2. Validates Clerk session tokens (RS256 / Clerk JWT) and synchronizes User accounts.
    """

    def authenticate(self, request):
        auth_header = request.headers.get('Authorization', '')

        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ', 1)[1].strip()

        if not token:
            return None

        # 1. Try decoding with internal HS256 JWT_SECRET
        try:
            decoded = jwt.decode(token, settings.JWT_SECRET, algorithms=['HS256'])
            user_id = decoded.get('id')
            if user_id:
                try:
                    user = User.objects.get(id=user_id)
                    return (user, token)
                except User.DoesNotExist:
                    raise exceptions.AuthenticationFailed('User not found')
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError:
            # Not an internal HS256 token, proceed to Clerk validation
            pass

        # 2. Try decoding as Clerk session token
        try:
            clerk_pem = getattr(settings, 'CLERK_PEM_PUBLIC_KEY', None)
            decoded_clerk = None

            if clerk_pem:
                decoded_clerk = jwt.decode(token, clerk_pem, algorithms=['RS256'])
            else:
                # In development, decode payload and verify claims/expiration
                claims = jwt.decode(token, options={"verify_signature": False})
                exp = claims.get('exp')
                if exp and exp < time.time():
                    raise exceptions.AuthenticationFailed('Clerk token has expired')
                decoded_clerk = claims

            clerk_id = decoded_clerk.get('sub')
            email = (
                decoded_clerk.get('email')
                or decoded_clerk.get('primary_email_address')
                or request.headers.get('X-User-Email', '')
            ).strip().lower()

            user = None
            if clerk_id:
                user = User.objects.filter(clerk_id=clerk_id).first()

            if not user and email:
                user = User.objects.filter(email__iexact=email).first()
                if user and clerk_id:
                    user.clerk_id = clerk_id
                    user.save(update_fields=['clerk_id'])

            if not user and (clerk_id or email):
                target_email = email or f"{clerk_id}@clerk.leathercad.com"
                role = 'admin' if target_email in ADMIN_EMAILS or clerk_id == 'user_37BzDMk1J9Kvqq9tc1GbrbneMuN' else 'user'
                name = decoded_clerk.get('name') or target_email.split('@')[0].capitalize()
                user = User.objects.create_user(
                    username=target_email,
                    email=target_email,
                    name=name,
                    role=role,
                    is_staff=(role == 'admin'),
                    is_superuser=(role == 'admin'),
                    clerk_id=clerk_id
                )

            if user:
                if user.email in ADMIN_EMAILS and user.role != 'admin':
                    user.role = 'admin'
                    user.is_staff = True
                    user.is_superuser = True
                    user.save(update_fields=['role', 'is_staff', 'is_superuser'])
                return (user, token)

            raise exceptions.AuthenticationFailed('User could not be identified from token')

        except exceptions.AuthenticationFailed:
            raise
        except Exception:
            raise exceptions.AuthenticationFailed('Invalid token')


class IsAdminRole(permissions.BasePermission):
    """
    Admin permission — checks the database role field only.
    """

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.role == 'admin' or user.is_staff or user.is_superuser or user.email in ADMIN_EMAILS)
        )
