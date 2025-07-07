from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from django.core.exceptions import ValidationError
from django.utils import timezone
from users.models import User
import re

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'},
        help_text="Password must be at least 8 characters long"
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text="Confirm your password"
    )
    terms_accepted = serializers.BooleanField(
        write_only=True,
        help_text="User must accept terms and conditions"
    )
    
    class Meta:
        model = User
        fields = (
            'username', 'email', 'password', 'password_confirm', 
            'first_name', 'last_name', 'phone_number', 'date_of_birth',
            'user_type', 'marketing_consent', 'terms_accepted'
        )
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def validate_username(self, value):
        """Validate username format and uniqueness"""
        if not re.match(r'^[a-zA-Z0-9_]+$', value):
            raise serializers.ValidationError(
                "Username can only contain letters, numbers, and underscores."
            )
        if len(value) < 3:
            raise serializers.ValidationError(
                "Username must be at least 3 characters long."
            )
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError(
                "A user with this username already exists."
            )
        return value

    def validate_email(self, value):
        """Validate email format and uniqueness"""
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "A user with this email already exists."
            )
        return value.lower()

    def validate_password(self, value):
        """Validate password strength"""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        
        # Additional custom password validation
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError(
                "Password must contain at least one uppercase letter."
            )
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError(
                "Password must contain at least one lowercase letter."
            )
        if not re.search(r'\d', value):
            raise serializers.ValidationError(
                "Password must contain at least one number."
            )
        
        return value

    def validate_date_of_birth(self, value):
        """Validate age requirement (must be at least 13 years old)"""
        if value:
            today = timezone.now().date()
            age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
            if age < 13:
                raise serializers.ValidationError(
                    "You must be at least 13 years old to register."
                )
            if value > today:
                raise serializers.ValidationError(
                    "Date of birth cannot be in the future."
                )
        return value

    def validate_terms_accepted(self, value):
        """Ensure terms and conditions are accepted"""
        if not value:
            raise serializers.ValidationError(
                "You must accept the terms and conditions to register."
            )
        return value

    def validate(self, attrs):
        """Cross-field validation"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': "Password confirmation doesn't match."
            })
        return attrs

    def create(self, validated_data):
        """Create new user with validated data"""
        # Remove fields that shouldn't be saved to the model
        validated_data.pop('password_confirm')
        validated_data.pop('terms_accepted')
        
        # Extract password before creating user
        password = validated_data.pop('password')
        
        # Create user instance
        user = User(**validated_data)
        user.set_password(password)  # This handles password hashing
        user.last_password_change = timezone.now()
        user.save()
        
        return user

class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(style={'input_type': 'password'})
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            # Try to get user (case-insensitive for email/username)
            try:
                if '@' in username:
                    user = User.objects.get(email__iexact=username)
                    username = user.username
                else:
                    user = User.objects.get(username__iexact=username)
            except User.DoesNotExist:
                raise serializers.ValidationError(
                    'Invalid username/email or password.'
                )
            
            # Check if account is locked
            if user.is_account_locked():
                raise serializers.ValidationError(
                    'Account is temporarily locked due to multiple failed login attempts. '
                    'Please try again later.'
                )
            
            # Authenticate user
            user = authenticate(username=username, password=password)
            if user:
                if not user.is_active:
                    raise serializers.ValidationError(
                        'User account is disabled.'
                    )
                # Reset failed login attempts on successful login
                if user.failed_login_attempts > 0:
                    user.reset_failed_login_attempts()
                attrs['user'] = user
            else:
                # Increment failed login attempts
                try:
                    user = User.objects.get(username__iexact=username)
                    user.increment_failed_login_attempts()
                except User.DoesNotExist:
                    pass
                raise serializers.ValidationError(
                    'Invalid username/email or password.'
                )
        else:
            raise serializers.ValidationError(
                'Must include username/email and password.'
            )
        
        return attrs

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 
            'phone_number', 'user_type', 'email_verified', 'phone_verified',
            'marketing_consent', 'is_staff', 'created_at'
        )
        read_only_fields = (
            'id', 'email_verified', 'phone_verified', 'created_at'
        )
