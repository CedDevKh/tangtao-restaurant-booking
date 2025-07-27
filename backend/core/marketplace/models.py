from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


class Restaurant(models.Model):
    CUISINE_CHOICES = (
        ('italian', 'Italian'),
        ('chinese', 'Chinese'),
        ('japanese', 'Japanese'),
        ('mexican', 'Mexican'),
        ('indian', 'Indian'),
        ('french', 'French'),
        ('american', 'American'),
        ('thai', 'Thai'),
        ('mediterranean', 'Mediterranean'),
        ('korean', 'Korean'),
        ('vietnamese', 'Vietnamese'),
        ('khmer', 'Khmer'),
        ('fine_dining', 'Fine Dining'),
        ('other', 'Other'),
    )
    
    PRICE_RANGE_CHOICES = (
        (1, '$'),
        (2, '$$'),
        (3, '$$$'),
        (4, '$$$$'),
    )

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='restaurants')
    name = models.CharField(max_length=255)
    address = models.TextField()
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    cuisine_type = models.CharField(max_length=100, choices=CUISINE_CHOICES, default='other')
    price_range = models.IntegerField(choices=PRICE_RANGE_CHOICES, default=2)
    capacity = models.IntegerField(default=50, help_text="Maximum number of guests")
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=Decimal('0.0'), validators=[MinValueValidator(Decimal('0.0')), MaxValueValidator(Decimal('5.0'))])
    image_url = models.TextField(blank=True, null=True, help_text="Main restaurant image")  # Allow any length
    opening_time = models.CharField(max_length=64, blank=True, null=True, help_text="Opening time (any format)")
    closing_time = models.CharField(max_length=64, blank=True, null=True, help_text="Closing time (any format)")
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False, help_text="Featured restaurants appear on homepage")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'Restaurant'
        verbose_name_plural = 'Restaurants'

class Offer(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='offers')
    title = models.CharField(max_length=255)
    description = models.TextField()
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    available_quantity = models.IntegerField(help_text="Number of bookings available for this offer")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.restaurant.name}"

    class Meta:
        verbose_name = 'Offer'
        verbose_name_plural = 'Offers'
        ordering = ['-created_at']

class Booking(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    )
    diner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')
    offer = models.ForeignKey(Offer, on_delete=models.CASCADE, related_name='bookings', null=True, blank=True)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='bookings', null=True, blank=True)
    booking_time = models.DateTimeField(help_text="The time the diner plans to arrive for the offer")
    number_of_people = models.IntegerField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        if self.offer:
            return f"Booking for {self.diner.username} at {self.offer.restaurant.name} ({self.offer.title})"
        elif self.restaurant:
            return f"Booking for {self.diner.username} at {self.restaurant.name} (Direct Booking)"
        else:
            return f"Booking for {self.diner.username} (No restaurant specified)"

    class Meta:
        verbose_name = 'Booking'
        verbose_name_plural = 'Bookings'
        unique_together = ('diner', 'offer', 'booking_time') # Prevent duplicate bookings for the same offer at the same time by the same diner
        ordering = ['booking_time']