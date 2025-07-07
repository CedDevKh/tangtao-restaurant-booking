from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator
from django.utils import timezone
import uuid

class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('diner', 'Diner'),
        ('restaurant_owner', 'Restaurant Owner'),
        ('admin', 'Admin'),
    )
    
    # User type and profile fields
    user_type = models.CharField(
        max_length=20,
        choices=USER_TYPE_CHOICES,
        default='diner',
        verbose_name='User Type'
    )
    
    # Enhanced profile fields
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    phone_number = models.CharField(
        validators=[phone_regex],
        max_length=17,
        blank=True,
        null=True,
        help_text="Phone number for contact and notifications"
    )
    
    date_of_birth = models.DateField(
        blank=True,
        null=True,
        help_text="Used for age verification and birthday offers"
    )
    
    profile_picture = models.ImageField(
        upload_to='profile_pictures/',
        blank=True,
        null=True,
        help_text="Profile picture"
    )
    
    # Security and verification fields
    email_verified = models.BooleanField(
        default=False,
        help_text="Whether the user's email has been verified"
    )
    
    email_verification_token = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
        help_text="Token for email verification"
    )
    
    phone_verified = models.BooleanField(
        default=False,
        help_text="Whether the user's phone has been verified"
    )
    
    # Account security
    failed_login_attempts = models.PositiveIntegerField(
        default=0,
        help_text="Number of consecutive failed login attempts"
    )
    
    account_locked_until = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Account locked until this time due to failed login attempts"
    )
    
    last_password_change = models.DateTimeField(
        default=timezone.now,
        help_text="When the password was last changed"
    )
    
    # Privacy and preferences
    marketing_consent = models.BooleanField(
        default=False,
        help_text="User consents to marketing communications"
    )
    
    notification_preferences = models.JSONField(
        default=dict,
        blank=True,
        help_text="User's notification preferences"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_diner(self):
        return self.user_type == 'diner'

    def is_restaurant_owner(self):
        return self.user_type == 'restaurant_owner'

    def is_admin(self):
        return self.user_type == 'admin'
    
    def is_account_locked(self):
        """Check if account is currently locked due to failed login attempts"""
        if self.account_locked_until:
            return timezone.now() < self.account_locked_until
        return False
    
    def reset_failed_login_attempts(self):
        """Reset failed login attempts and unlock account"""
        self.failed_login_attempts = 0
        self.account_locked_until = None
        self.save(update_fields=['failed_login_attempts', 'account_locked_until'])
    
    def increment_failed_login_attempts(self):
        """Increment failed login attempts and lock account if necessary"""
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= 5:  # Lock after 5 failed attempts
            self.account_locked_until = timezone.now() + timezone.timedelta(minutes=30)
        self.save(update_fields=['failed_login_attempts', 'account_locked_until'])

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
