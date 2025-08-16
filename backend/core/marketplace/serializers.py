from rest_framework import serializers
from marketplace.models import Restaurant, Offer, Booking, BookingSlot, OfferTimeSlot
from users.serializers import UserSerializer

class RestaurantSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    active_offers = serializers.SerializerMethodField()
    featured_offer = serializers.SerializerMethodField()

    class Meta:
        model = Restaurant
        fields = '__all__'

    def validate_image_url(self, value):
        # Optionally, add custom validation for URLs if needed
        return value

    def get_active_offers(self, obj):
        """Get all currently active offers for this restaurant"""
        from django.utils import timezone
        today = timezone.now().date()
        current_time = timezone.now().time()
        
        active_offers = obj.offers.filter(
            is_active=True,
            start_date__lte=today,
            end_date__gte=today,
            start_time__lte=current_time,
            end_time__gte=current_time
        )
        
        # Further filter by day of week if specified
        weekday = today.weekday()
        filtered_offers = []
        
        for offer in active_offers:
            if offer.days_of_week:
                allowed_days = [int(d.strip()) for d in offer.days_of_week.split(',') if d.strip().isdigit()]
                if weekday in allowed_days:
                    filtered_offers.append(offer)
            else:
                filtered_offers.append(offer)
        
        return OfferSerializer(filtered_offers, many=True, context=self.context).data

    def get_featured_offer(self, obj):
        """Get the best/featured offer for this restaurant"""
        from django.utils import timezone
        today = timezone.now().date()
        
        # Get the best current offer (highest discount percentage or featured)
        best_offer = obj.offers.filter(
            is_active=True,
            start_date__lte=today,
            end_date__gte=today
        ).order_by('-is_featured', '-discount_percentage', '-discount_amount').first()
        
        if best_offer:
            # Check if it's available today based on days_of_week
            if best_offer.days_of_week:
                weekday = today.weekday()
                allowed_days = [int(d.strip()) for d in best_offer.days_of_week.split(',') if d.strip().isdigit()]
                if weekday not in allowed_days:
                    return None
            
            return OfferSerializer(best_offer, context=self.context).data
        return None

    def validate_opening_time(self, value):
        # Accept any string, optionally add custom logic
        return value

    def validate_closing_time(self, value):
        # Accept any string, optionally add custom logic
        return value

class OfferTimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = OfferTimeSlot
        fields = ['id', 'start_time', 'end_time', 'discount_percentage', 'discount_amount', 'is_active']

class OfferSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)
    restaurant_cuisine = serializers.CharField(source='restaurant.cuisine_type', read_only=True)
    restaurant_location = serializers.CharField(source='restaurant.location', read_only=True)
    discounted_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    savings_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_available_today = serializers.BooleanField(read_only=True)
    
    time_slots = serializers.ListSerializer(
        child=serializers.DictField(), required=False, allow_null=True, write_only=True
    )
    # Expose existing per-offer 30-minute slots for editing UIs
    time_slots_detail = OfferTimeSlotSerializer(many=True, read_only=True, source='time_slots')

    class Meta:
        model = Offer
        fields = [
            'id', 'restaurant', 'restaurant_name', 'restaurant_cuisine', 'restaurant_location',
            'title', 'description', 'offer_type', 'discount_percentage', 'discount_amount',
            'original_price', 'discounted_price', 'savings_amount',
            'start_date', 'end_date', 'start_time', 'end_time',
            'recurring', 'days_of_week', 'available_quantity', 'max_people_per_booking',
            'min_advance_booking', 'is_active', 'is_featured', 'is_available_today',
            'created_at', 'updated_at', 'time_slots', 'time_slots_detail'
        ]
        read_only_fields = ['created_at', 'updated_at', 'discounted_price', 'savings_amount', 'is_available_today']

    def validate(self, data):
        """Validate offer data"""
        # Ensure at least one discount type is provided
        if data.get('offer_type') == 'percentage' and not data.get('discount_percentage'):
            raise serializers.ValidationError("Discount percentage is required for percentage offers")
        
        if data.get('offer_type') == 'amount' and not data.get('discount_amount'):
            raise serializers.ValidationError("Discount amount is required for fixed amount offers")
        
        # Validate date range
        if data.get('start_date') and data.get('end_date'):
            if data['start_date'] > data['end_date']:
                raise serializers.ValidationError("Start date cannot be after end date")
        
        # Enforce single-hour slot (minute precision 00 and exactly +1 hour)
        if data.get('start_time') and data.get('end_time'):
            start = data['start_time']
            end = data['end_time']
            if start.minute != 0 or end.minute != 0:
                raise serializers.ValidationError("Offers must start and end on the hour (minutes = 00)")
            # Accept exactly one-hour duration
            start_total = start.hour * 60 + start.minute
            end_total = end.hour * 60 + end.minute
            if end_total - start_total != 60:
                raise serializers.ValidationError("Offers must cover exactly one hour (end_time = start_time + 1 hour)")
        
        # Validate discount percentage range
        if data.get('discount_percentage') and (data['discount_percentage'] < 0 or data['discount_percentage'] > 100):
            raise serializers.ValidationError("Discount percentage must be between 0 and 100")
        
        # Validate days of week format
        if data.get('days_of_week'):
            try:
                days = [int(d.strip()) for d in data['days_of_week'].split(',') if d.strip()]
                if any(day < 0 or day > 6 for day in days):
                    raise ValueError()
            except ValueError:
                raise serializers.ValidationError("Days of week must be comma-separated numbers between 0-6 (0=Monday, 6=Sunday)")
        
        return data

    def _upsert_time_slots(self, offer, slots):
        """Create or replace OfferTimeSlot entries for this offer.
        Each slot: { start_time: 'HH:MM', end_time: 'HH:MM', discount_percentage?, discount_amount? }
        Minutes must be 00 or 30 and duration 30m.
        """
        if slots is None:
            return
        # Clear and recreate for simplicity
        OfferTimeSlot.objects.filter(offer=offer).delete()
        import datetime
        for s in slots:
            st = datetime.time.fromisoformat((s.get('start_time') or '00:00'))
            et = datetime.time.fromisoformat((s.get('end_time') or '00:30'))
            if st.minute not in (0,30) or et.minute not in (0,30):
                raise serializers.ValidationError({'time_slots': 'Minutes must be 00 or 30'})
            dur = et.hour*60+et.minute - (st.hour*60+st.minute)
            if dur != 30:
                raise serializers.ValidationError({'time_slots': 'Each slot must be exactly 30 minutes'})
            OfferTimeSlot.objects.create(
                offer=offer,
                restaurant=offer.restaurant,
                start_time=st,
                end_time=et,
                discount_percentage=s.get('discount_percentage'),
                discount_amount=s.get('discount_amount'),
                is_active=True,
            )

    def create(self, validated_data):
        slots = validated_data.pop('time_slots', None)
        offer = super().create(validated_data)
        self._upsert_time_slots(offer, slots)
        return offer

    def update(self, instance, validated_data):
        slots = validated_data.pop('time_slots', None)
        offer = super().update(instance, validated_data)
        # Only owners/admins can modify; enforced by view permissions already
        if slots is not None:
            self._upsert_time_slots(offer, slots)
        return offer

class BookingSlotSerializer(serializers.ModelSerializer):
    remaining_capacity = serializers.SerializerMethodField()
    effective_status = serializers.SerializerMethodField()

    class Meta:
        model = BookingSlot
        fields = [
            'id','restaurant','date','start_time','end_time','discount_percentage','capacity',
            'min_party_size','max_party_size','rules','status','lead_time_minutes','is_active',
            'remaining_capacity','effective_status'
        ]
        read_only_fields = ['remaining_capacity','effective_status']

    def get_remaining_capacity(self, obj):
        return obj.remaining_capacity

    def get_effective_status(self, obj):
        return obj.effective_status()

class BookingSerializer(serializers.ModelSerializer):
    diner = UserSerializer(read_only=True)
    offer_title = serializers.CharField(source='offer.title', read_only=True)
    restaurant_name = serializers.SerializerMethodField()
    slot_id = serializers.PrimaryKeyRelatedField(
        source='slot', queryset=BookingSlot.objects.all(), required=False,
        allow_null=True, write_only=True
    )
    slot = BookingSlotSerializer(read_only=True)
    combined_discount = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = '__all__'

    def get_restaurant_name(self, obj):
        if obj.restaurant:
            return obj.restaurant.name
        elif obj.offer and obj.offer.restaurant:
            return obj.offer.restaurant.name
        return None

    def validate(self, data):
        if not data.get('offer') and not data.get('restaurant'):
            raise serializers.ValidationError("Either offer or restaurant must be provided.")
        # If offer is provided, ensure booking_time matches either an OfferTimeSlot or the offer's hour window on 30-min grid
        offer = data.get('offer')
        booking_time = data.get('booking_time')
        if offer and booking_time:
            import datetime
            t = booking_time.time()
            # minute must be 0 or 30
            if t.minute not in (0,30):
                raise serializers.ValidationError({'booking_time': 'Bookings for offers must be at 30-minute intervals (minutes 00 or 30).'})
            has_ts = OfferTimeSlot.objects.filter(offer=offer, start_time__lte=t, end_time__gt=t, is_active=True).exists()
            if not has_ts:
                # fallback: within the main offer hour
                if not (offer.start_time <= t < offer.end_time):
                    raise serializers.ValidationError({'booking_time': 'Selected time is not within any available offer timeslot.'})
        return data

    def get_combined_discount(self, obj):
        """Return explicit discount calculation when both offer and slot are present.
        Strategy: If slot has discount_percentage, prefer it; else use offer percentage.
        If offer has discount_amount only, return amount. Does not stack by default.
        """
        slot_disc = None
        if obj.slot and obj.slot.discount_percentage is not None:
            slot_disc = float(obj.slot.discount_percentage)
        offer = obj.offer
        offer_disc_pct = None
        offer_disc_amt = None
        if offer:
            if offer.discount_percentage is not None:
                offer_disc_pct = float(offer.discount_percentage)
            elif offer.discount_amount is not None:
                offer_disc_amt = float(offer.discount_amount)
        applied = None
        source = None
        if slot_disc is not None and offer_disc_pct is not None:
            # choose higher percentage
            if slot_disc >= offer_disc_pct:
                applied = {'type':'percentage','value':slot_disc}
                source = 'slot'
            else:
                applied = {'type':'percentage','value':offer_disc_pct}
                source = 'offer'
        elif slot_disc is not None:
            applied = {'type':'percentage','value':slot_disc}
            source = 'slot'
        elif offer_disc_pct is not None:
            applied = {'type':'percentage','value':offer_disc_pct}
            source = 'offer'
        elif offer_disc_amt is not None:
            applied = {'type':'amount','value':offer_disc_amt}
            source = 'offer'
        if not applied:
            return None
        return {'applied':applied,'source':source,'slot_percentage':slot_disc,'offer_percentage':offer_disc_pct,'offer_amount':offer_disc_amt}

# Admin-specific serializers
class AdminRestaurantSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    owner_email = serializers.CharField(source='owner.email', read_only=True)
    total_offers = serializers.SerializerMethodField()
    total_bookings = serializers.SerializerMethodField()
    
    class Meta:
        model = Restaurant
        fields = '__all__'

    def validate_image_url(self, value):
        return value

    def validate_opening_time(self, value):
        return value

    def validate_closing_time(self, value):
        return value
    
    def get_total_offers(self, obj):
        return obj.offers.count()
    
    def get_total_bookings(self, obj):
        # Count bookings from both offers and direct restaurant bookings
        from django.db.models import Q
        return Booking.objects.filter(
            Q(offer__restaurant=obj) | Q(restaurant=obj)
        ).count()

class AdminRestaurantCreateUpdateSerializer(serializers.ModelSerializer):
    owner_id = serializers.IntegerField(write_only=True, required=False)
    owner = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = Restaurant
        fields = '__all__'

    def validate_image_url(self, value):
        return value

    def validate_opening_time(self, value):
        return value

    def validate_closing_time(self, value):
        return value
    
    def validate_owner_id(self, value):
        from users.models import User
        if value and not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("Owner with this ID does not exist.")
        return value
    
    def create(self, validated_data):
        owner_id = validated_data.pop('owner_id', None)
        if owner_id:
            from users.models import User
            validated_data['owner'] = User.objects.get(id=owner_id)
        elif not validated_data.get('owner'):
            # If no owner specified, use the requesting user
            validated_data['owner'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        owner_id = validated_data.pop('owner_id', None)
        if owner_id:
            from users.models import User
            validated_data['owner'] = User.objects.get(id=owner_id)
        return super().update(instance, validated_data)
