from rest_framework import serializers
from .models import PartnershipApplication, PartnerProfile
from users.serializers import UserSerializer
from marketplace.serializers import RestaurantSerializer


class PartnershipApplicationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = PartnershipApplication
        fields = [
            'id', 'user', 'business_name', 'business_email', 'business_phone',
            'business_address', 'business_description', 'business_type',
            'years_in_business', 'business_license', 'tax_id', 'status',
            'status_display', 'applied_at', 'reviewed_at', 'reviewer_notes'
        ]
        read_only_fields = ['id', 'applied_at', 'reviewed_at', 'reviewer_notes']


class PartnerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    restaurant = RestaurantSerializer(read_only=True)
    
    class Meta:
        model = PartnerProfile
        fields = [
            'id', 'user', 'restaurant', 'business_name', 'business_email',
            'business_phone', 'business_address', 'total_bookings',
            'total_revenue', 'average_rating', 'notifications_enabled',
            'auto_accept_bookings', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'total_bookings', 'total_revenue', 'average_rating', 'created_at', 'updated_at']
