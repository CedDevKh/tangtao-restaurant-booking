from rest_framework import serializers
from marketplace.models import Restaurant, Offer, Booking
from users.serializers import UserSerializer

class RestaurantSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)

    class Meta:
        model = Restaurant
        fields = '__all__'

class OfferSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)

    class Meta:
        model = Offer
        fields = '__all__'

class BookingSerializer(serializers.ModelSerializer):
    diner = UserSerializer(read_only=True)
    offer_title = serializers.CharField(source='offer.title', read_only=True)
    restaurant_name = serializers.CharField(source='offer.restaurant.name', read_only=True)

    class Meta:
        model = Booking
        fields = '__all__'

# Admin-specific serializers
class AdminRestaurantSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    owner_email = serializers.CharField(source='owner.email', read_only=True)
    total_offers = serializers.SerializerMethodField()
    total_bookings = serializers.SerializerMethodField()
    
    class Meta:
        model = Restaurant
        fields = '__all__'
    
    def get_total_offers(self, obj):
        return obj.offers.count()
    
    def get_total_bookings(self, obj):
        return Booking.objects.filter(offer__restaurant=obj).count()

class AdminRestaurantCreateUpdateSerializer(serializers.ModelSerializer):
    owner_id = serializers.IntegerField(write_only=True, required=False)
    owner = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = Restaurant
        fields = '__all__'
    
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
