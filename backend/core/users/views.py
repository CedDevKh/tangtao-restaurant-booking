from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from django.contrib.auth import login
from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse
from django.utils import timezone
from users.models import User
from users.serializers import (
    UserSerializer, 
    UserRegistrationSerializer, 
    UserLoginSerializer
)
import uuid
import logging

logger = logging.getLogger(__name__)

class UserRegistrationView(APIView):
    """
    User registration endpoint with comprehensive validation and security features
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                user = serializer.save()
                
                # Create authentication token
                token, created = Token.objects.get_or_create(user=user)
                
                # Send welcome email (optional)
                try:
                    self.send_welcome_email(user)
                except Exception as e:
                    logger.error(f"Failed to send welcome email to {user.email}: {str(e)}")
                
                # Return user data and token
                user_serializer = UserSerializer(user)
                return Response({
                    'user': user_serializer.data,
                    'token': token.key,
                    'message': 'Registration successful! Welcome to our platform.'
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                logger.error(f"User registration failed: {str(e)}")
                return Response({
                    'error': 'Registration failed. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def send_welcome_email(self, user):
        """Send welcome email to new user"""
        subject = 'Welcome to Restaurant Booking Platform!'
        message = f"""
        Hi {user.first_name},
        
        Welcome to our restaurant booking platform! We're excited to have you join our community.
        
        Your account has been successfully created with the username: {user.username}
        
        You can now:
        - Browse and discover amazing restaurants
        - Make reservations with ease
        - Manage your bookings
        - Receive special offers and recommendations
        
        If you have any questions, feel free to contact our support team.
        
        Happy dining!
        The Restaurant Booking Team
        """
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            logger.error(f"Failed to send welcome email: {str(e)}")

class UserLoginView(APIView):
    """
    Enhanced login endpoint with security features
    """
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Create or get authentication token
            token, created = Token.objects.get_or_create(user=user)
            
            # Login user (optional, for session-based features)
            login(request, user)
            
            # Return user data and token
            user_serializer = UserSerializer(user)
            return Response({
                'user': user_serializer.data,
                'token': token.key,
                'message': 'Login successful!'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)

class UserViewSet(viewsets.ModelViewSet):
    """
    Enhanced user viewset with additional security
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Users can only see their own profile unless they're admin"""
        if self.request.user.is_admin():
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)
    
    @action(detail=False, methods=['get'])
    def profile(self, request):
        """Get current user's profile"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        """Change user password with validation"""
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        if not all([current_password, new_password, confirm_password]):
            return Response({
                'error': 'All password fields are required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not request.user.check_password(current_password):
            return Response({
                'error': 'Current password is incorrect.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if new_password != confirm_password:
            return Response({
                'error': 'New passwords do not match.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate new password
        try:
            from django.contrib.auth.password_validation import validate_password
            validate_password(new_password, request.user)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Update password
        request.user.set_password(new_password)
        request.user.last_password_change = timezone.now()
        request.user.save()
        
        return Response({
            'message': 'Password changed successfully.'
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def logout(self, request):
        """Logout user by deleting their token"""
        try:
            token = Token.objects.get(user=request.user)
            token.delete()
            return Response({
                'message': 'Logged out successfully.'
            }, status=status.HTTP_200_OK)
        except Token.DoesNotExist:
            return Response({
                'message': 'User was not logged in.'
            }, status=status.HTTP_200_OK)
