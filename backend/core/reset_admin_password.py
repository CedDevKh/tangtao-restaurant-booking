#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

try:
    admin_user = User.objects.get(username='admin')
    admin_user.set_password('admin')
    admin_user.save()
    print("Admin password set to 'admin'")
except User.DoesNotExist:
    admin_user = User.objects.create_superuser('admin', 'admin@example.com', 'admin')
    print("Admin user created with password 'admin'")
