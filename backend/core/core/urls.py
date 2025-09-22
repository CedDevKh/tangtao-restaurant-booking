"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from users.views import UserViewSet, UserRegistrationView, UserLoginView
from marketplace.views import RestaurantViewSet, OfferViewSet, BookingViewSet, AdminRestaurantViewSet, BookingSlotAvailabilityViewSet, BookingSlotViewSet, AvailabilityView, BookingHoldViewSet, BookingConfirmView, AdminOfferViewSet
from .health import health_check
import logging

logger = logging.getLogger(__name__)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'restaurants', RestaurantViewSet)
router.register(r'offers', OfferViewSet)
router.register(r'slots/availability', BookingSlotAvailabilityViewSet, basename='slot-availability')
router.register(r'booking-slots', BookingSlotViewSet, basename='booking-slot')
router.register(r'admin/restaurants', AdminRestaurantViewSet, basename='admin-restaurants')
router.register(r'admin/offers', AdminOfferViewSet, basename='admin-offers')
# Important: register the more specific 'bookings/holds' route BEFORE the generic 'bookings' route
router.register(r'bookings/holds', BookingHoldViewSet, basename='booking-hold')
router.register(r'bookings', BookingViewSet, basename='booking')

urlpatterns = [
    path('admin/', admin.site.urls),
    # Specific API endpoints should be listed before the router include to avoid route collisions
    path('api/availability/', AvailabilityView.as_view(), name='availability'),
    path('api/bookings/confirm/', BookingConfirmView.as_view(), name='booking-confirm'),
    # Router includes generic routes like /api/bookings/{pk}/, so keep it after specific paths
    path('api/', include(router.urls)),
    path('api-token-auth/', obtain_auth_token, name='api_token_auth'),
    path('auth/register/', UserRegistrationView.as_view(), name='user_register'),
    path('auth/login/', UserLoginView.as_view(), name='user_login'),
    path('health/', health_check, name='health_check'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)