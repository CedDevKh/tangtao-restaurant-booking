from rest_framework import serializers
from marketplace.models import Restaurant, Offer, Booking
from users.serializers import UserSerializer

class RestaurantSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)

    class Meta:
        model = Restaurant
        fields = '__all__'

    def validate_image_url(self, value):
        # Optionally, add custom validation for URLs if needed
        return value

    def validate_opening_time(self, value):
        # Accept any string, optionally add custom logic
        return value

    def validate_closing_time(self, value):
        # Accept any string, optionally add custom logic
        return value

class OfferSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)

    class Meta:
        model = Offer
        fields = '__all__'

class BookingSerializer(serializers.ModelSerializer):
    diner = UserSerializer(read_only=True)
    offer_title = serializers.CharField(source='offer.title', read_only=True)
    restaurant_name = serializers.SerializerMethodField()

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
        return data

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
