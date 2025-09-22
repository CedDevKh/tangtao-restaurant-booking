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

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='restaurants')
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
    # Stored local copy of cover image (auto-downloaded from image_url if provided)
    image_file = models.ImageField(upload_to='restaurants/covers/', blank=True, null=True)
    opening_time = models.CharField(max_length=64, blank=True, null=True, help_text="Opening time (any format)")
    closing_time = models.CharField(max_length=64, blank=True, null=True, help_text="Closing time (any format)")
    # Geolocation (optional). Increase precision to allow more decimals
    latitude = models.DecimalField(max_digits=18, decimal_places=12, blank=True, null=True)
    longitude = models.DecimalField(max_digits=18, decimal_places=12, blank=True, null=True)
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
    OFFER_TYPE_CHOICES = (
        ('percentage', 'Percentage Discount'),
        ('amount', 'Fixed Amount Discount'),
        ('special', 'Special Offer'),
    )
    
    RECURRING_CHOICES = (
        ('none', 'One-time offer'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    )
    
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='offers')
    title = models.CharField(max_length=255)
    description = models.TextField()
    offer_type = models.CharField(max_length=20, choices=OFFER_TYPE_CHOICES, default='percentage')
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, help_text="Discount percentage (0-100)")
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text="Fixed discount amount")
    original_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text="Original price before discount")
    
    # Time-based offer settings
    start_date = models.DateField(help_text="Start date for the offer")
    end_date = models.DateField(help_text="End date for the offer")
    start_time = models.TimeField(help_text="Daily start time for the offer (e.g., 18:00 for 6 PM)")
    end_time = models.TimeField(help_text="Daily end time for the offer (e.g., 21:00 for 9 PM)")
    
    # Recurring settings
    recurring = models.CharField(max_length=20, choices=RECURRING_CHOICES, default='none')
    days_of_week = models.CharField(
        max_length=20, 
        blank=True, 
        null=True,
        help_text="Days of week (0=Monday, 6=Sunday). E.g., '0,1,2,3,4' for weekdays"
    )
    
    # Availability settings
    available_quantity = models.IntegerField(help_text="Number of bookings available for this offer per day")
    max_people_per_booking = models.IntegerField(default=6, help_text="Maximum people per booking for this offer")
    min_advance_booking = models.IntegerField(default=1, help_text="Minimum hours in advance for booking")
    
    # Status and metadata
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False, help_text="Show on featured offers")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.restaurant.name}"

    @property
    def discounted_price(self):
        """Calculate the final price after discount"""
        if not self.original_price:
            return None
        
        if self.offer_type == 'percentage' and self.discount_percentage:
            return self.original_price * (1 - self.discount_percentage / 100)
        elif self.offer_type == 'amount' and self.discount_amount:
            return max(0, self.original_price - self.discount_amount)
        
        return self.original_price

    @property
    def savings_amount(self):
        """Calculate the amount saved"""
        if not self.original_price:
            return None
        
        discounted = self.discounted_price
        if discounted is not None:
            return self.original_price - discounted
        
        return None

    @property
    def is_available_today(self):
        """Check if offer is available today"""
        from django.utils import timezone
        today = timezone.now().date()
        
        if not (self.start_date <= today <= self.end_date):
            return False
        
        if self.days_of_week:
            weekday = today.weekday()  # 0=Monday, 6=Sunday
            allowed_days = [int(d.strip()) for d in self.days_of_week.split(',') if d.strip().isdigit()]
            if weekday not in allowed_days:
                return False
        
        return self.is_active

    class Meta:
        verbose_name = 'Offer'
        verbose_name_plural = 'Offers'
        ordering = ['-created_at']

class OfferTimeSlot(models.Model):
    """A 30-minute timeslot discount attached to an Offer.

    This allows configuring multiple discounts per half-hour across a day.
    The slots are date-agnostic and repeat on days the parent Offer is active
    (within its date range and optional days_of_week constraints).
    """
    offer = models.ForeignKey(Offer, on_delete=models.CASCADE, related_name='time_slots')
    # Optional denormalization for easier querying together with BookingSlot merges
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='offer_time_slots')
    start_time = models.TimeField(help_text="Start time for this half-hour slot (minutes must be 00 or 30)")
    end_time = models.TimeField(help_text="End time for this half-hour slot (typically start+30m)")
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Offer Time Slot'
        verbose_name_plural = 'Offer Time Slots'
        ordering = ['start_time']
        unique_together = ('offer', 'start_time')

    def __str__(self):
        return f"{self.offer.restaurant.name} {self.offer.title} @ {self.start_time}"

    def clean(self):
        # Flexible duration: only require end > start
        dur = self.end_time.hour * 60 + self.end_time.minute - (self.start_time.hour * 60 + self.start_time.minute)
        if dur <= 0:
            from django.core.exceptions import ValidationError
            raise ValidationError("Timeslot end_time must be after start_time")

    # NOTE: Remember to run makemigrations/migrate after adding this model.

class Booking(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
    )
    diner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings', null=True, blank=True)
    offer = models.ForeignKey(Offer, on_delete=models.CASCADE, related_name='bookings', null=True, blank=True)
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='bookings', null=True, blank=True)
    slot = models.ForeignKey('BookingSlot', on_delete=models.SET_NULL, null=True, blank=True, related_name='slot_bookings', help_text="The concrete BookingSlot reserved (if using slot system)")
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

class BookingSlot(models.Model):
    """Discrete time slot for restaurant discounting and capacity management.

    Slots can be pre-created (e.g. daily cron) or ad-hoc via admin/owner UI.
    The system aggregates bookings to determine remaining capacity.
    """
    STATUS_CHOICES = (
        ('open', 'Open'),
        ('closed', 'Closed'),
        ('full', 'Full'),
    )
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='slots')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    capacity = models.PositiveIntegerField(default=0, help_text="Max total guests for this slot (0 = unlimited)")
    min_party_size = models.PositiveIntegerField(default=1)
    max_party_size = models.PositiveIntegerField(default=20)
    rules = models.JSONField(default=dict, blank=True, help_text="Arbitrary rule metadata e.g. {'excludes': 'alcohol'}")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='open')
    lead_time_minutes = models.PositiveIntegerField(default=60, help_text="Minimum minutes before start required for booking")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Booking Slot'
        verbose_name_plural = 'Booking Slots'
        unique_together = ('restaurant', 'date', 'start_time')
        ordering = ['date', 'start_time']

    def __str__(self):
        return f"{self.restaurant.name} {self.date} {self.start_time}-{self.end_time}"

    @property
    def remaining_capacity(self):
        """Remaining capacity considering confirmed bookings and active holds.

        Holds are counted if status='active' and not expired.
        """
        if self.capacity == 0:
            return None  # Unlimited
        from django.db.models import Sum
        from django.utils import timezone
        booked = self.slot_bookings.aggregate(total=Sum('number_of_people'))['total'] or 0
        # Subtract active holds that haven't expired
        try:
            active_holds = self.holds.filter(status='active', expires_at__gt=timezone.now())
            held = active_holds.aggregate(total=Sum('party_size'))['total'] or 0
        except Exception:
            held = 0
        return max(0, self.capacity - booked - held)

    def is_full(self):
        rc = self.remaining_capacity
        return rc is not None and rc <= 0

    def effective_status(self):
        from django.utils import timezone
        if not self.is_active or self.status == 'closed':
            return 'closed'
        # Past check
        start_dt = timezone.make_aware(timezone.datetime.combine(self.date, self.start_time), timezone.get_current_timezone())
        if start_dt < timezone.now():
            return 'past'
        if self.is_full():
            return 'full'
        # Lead time check
        delta = start_dt - timezone.now()
        if delta.total_seconds() < self.lead_time_minutes * 60:
            return 'closed'
        return 'open'


class BookingHold(models.Model):
    """A temporary capacity reservation for a concrete BookingSlot.

    Used to prevent overselling while the user is completing checkout.
    """
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('released', 'Released'),
        ('confirmed', 'Confirmed'),
        ('expired', 'Expired'),
    )
    hold_id = models.CharField(max_length=40, unique=True)
    slot = models.ForeignKey(BookingSlot, on_delete=models.CASCADE, related_name='holds')
    party_size = models.PositiveIntegerField()
    contact = models.JSONField(default=dict)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Booking Hold'
        verbose_name_plural = 'Booking Holds'
        indexes = [
            models.Index(fields=['hold_id']),
            models.Index(fields=['status', 'expires_at']),
        ]

    def __str__(self):
        return f"Hold {self.hold_id} for slot {self.slot_id} ({self.party_size})"

    def is_expired(self):
        from django.utils import timezone
        return self.expires_at <= timezone.now() or self.status == 'expired'

    def mark_expired_if_needed(self):
        from django.utils import timezone
        if self.status == 'active' and self.expires_at <= timezone.now():
            self.status = 'expired'
            self.save(update_fields=['status'])
        return self.status