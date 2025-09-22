from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("id", "username", "email", "user_type", "is_staff", "is_superuser")
    list_filter = ("user_type", "is_staff", "is_superuser")
    search_fields = ("username", "email")
