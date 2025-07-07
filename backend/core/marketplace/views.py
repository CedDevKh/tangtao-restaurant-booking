from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from marketplace.models import Restaurant, Offer, Booking
from marketplace.serializers import (
    RestaurantSerializer, OfferSerializer, BookingSerializer,
    AdminRestaurantSerializer, AdminRestaurantCreateUpdateSerializer
)

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admin users to edit.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff

class RestaurantViewSet(viewsets.ModelViewSet):
    queryset = Restaurant.objects.all()
    serializer_class = RestaurantSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'cuisine_type', 'address']
    filterset_fields = ['cuisine_type', 'price_range', 'is_active', 'is_featured']
    ordering_fields = ['name', 'rating', 'created_at']
    ordering = ['-created_at']

class OfferViewSet(viewsets.ModelViewSet):
    queryset = Offer.objects.all()
    serializer_class = OfferSerializer

class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer

# Admin-specific views
class AdminRestaurantViewSet(viewsets.ModelViewSet):
    """
    Admin-only viewset for managing restaurants with additional functionality
    """
    queryset = Restaurant.objects.all().select_related('owner').prefetch_related('offers')
    permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'cuisine_type', 'address', 'owner__username', 'owner__email']
    filterset_fields = ['cuisine_type', 'price_range', 'is_active', 'is_featured', 'owner']
    ordering_fields = ['name', 'rating', 'created_at', 'updated_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return AdminRestaurantCreateUpdateSerializer
        return AdminRestaurantSerializer

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get dashboard statistics"""
        total_restaurants = Restaurant.objects.count()
        active_restaurants = Restaurant.objects.filter(is_active=True).count()
        featured_restaurants = Restaurant.objects.filter(is_featured=True).count()
        total_offers = Offer.objects.count()
        total_bookings = Booking.objects.count()
        
        # Restaurants by cuisine type
        cuisine_stats = Restaurant.objects.values('cuisine_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        return Response({
            'total_restaurants': total_restaurants,
            'active_restaurants': active_restaurants,
            'featured_restaurants': featured_restaurants,
            'total_offers': total_offers,
            'total_bookings': total_bookings,
            'cuisine_stats': cuisine_stats
        })

    @action(detail=True, methods=['post'])
    def toggle_featured(self, request, pk=None):
        """Toggle featured status of a restaurant"""
        restaurant = self.get_object()
        restaurant.is_featured = not restaurant.is_featured
        restaurant.save()
        return Response({
            'message': f'Restaurant {"featured" if restaurant.is_featured else "unfeatured"} successfully',
            'is_featured': restaurant.is_featured
        })

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle active status of a restaurant"""
        restaurant = self.get_object()
        restaurant.is_active = not restaurant.is_active
        restaurant.save()
        return Response({
            'message': f'Restaurant {"activated" if restaurant.is_active else "deactivated"} successfully',
            'is_active': restaurant.is_active
        })

    @action(detail=False, methods=['get'])
    def bulk_actions(self, request):
        """Get available bulk actions"""
        return Response({
            'actions': [
                {'key': 'activate', 'label': 'Activate Selected'},
                {'key': 'deactivate', 'label': 'Deactivate Selected'},
                {'key': 'feature', 'label': 'Feature Selected'},
                {'key': 'unfeature', 'label': 'Unfeature Selected'},
                {'key': 'delete', 'label': 'Delete Selected'}
            ]
        })

    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Perform bulk actions on multiple restaurants"""
        action_type = request.data.get('action')
        restaurant_ids = request.data.get('restaurant_ids', [])
        
        if not action_type or not restaurant_ids:
            return Response(
                {'error': 'Action and restaurant_ids are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        restaurants = Restaurant.objects.filter(id__in=restaurant_ids)
        
        if action_type == 'activate':
            restaurants.update(is_active=True)
            message = f'{restaurants.count()} restaurants activated'
        elif action_type == 'deactivate':
            restaurants.update(is_active=False)
            message = f'{restaurants.count()} restaurants deactivated'
        elif action_type == 'feature':
            restaurants.update(is_featured=True)
            message = f'{restaurants.count()} restaurants featured'
        elif action_type == 'unfeature':
            restaurants.update(is_featured=False)
            message = f'{restaurants.count()} restaurants unfeatured'
        elif action_type == 'delete':
            count = restaurants.count()
            restaurants.delete()
            message = f'{count} restaurants deleted'
        else:
            return Response(
                {'error': 'Invalid action'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({'message': message})