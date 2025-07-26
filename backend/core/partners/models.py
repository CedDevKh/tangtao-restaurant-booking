from django.db import models
from django.conf import settings
from django.utils import timezone
from marketplace.models import Restaurant


class PartnershipApplication(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('under_review', 'Under Review'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    business_name = models.CharField(max_length=255)
    business_email = models.EmailField()
    business_phone = models.CharField(max_length=20)
    business_address = models.TextField()
    business_description = models.TextField()
    business_type = models.CharField(max_length=100)
    years_in_business = models.IntegerField()
    
    # Documents
    business_license = models.CharField(max_length=255, blank=True)
    tax_id = models.CharField(max_length=50, blank=True)
    
    # Status and timestamps
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    applied_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewer_notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'partnership_applications'
        ordering = ['-applied_at']
    
    def __str__(self):
        return f'{self.business_name} - {self.status}'


class PartnerProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, null=True, blank=True)
    
    # Business information
    business_name = models.CharField(max_length=255)
    business_email = models.EmailField()
    business_phone = models.CharField(max_length=20)
    business_address = models.TextField()
    
    # Performance metrics
    total_bookings = models.IntegerField(default=0)
    total_revenue = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    
    # Settings
    notifications_enabled = models.BooleanField(default=True)
    auto_accept_bookings = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'partner_profiles'
    
    def __str__(self):
        return f'{self.business_name} - {self.user.username}'
