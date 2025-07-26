from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import PartnershipApplication, PartnerProfile
from .serializers import PartnershipApplicationSerializer, PartnerProfileSerializer


class PartnershipApplicationViewSet(viewsets.ModelViewSet):
    serializer_class = PartnershipApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return PartnershipApplication.objects.all()
        return PartnershipApplication.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_applications(self, request):
        """Get current user's applications"""
        applications = self.get_queryset().filter(user=request.user)
        serializer = self.get_serializer(applications, many=True)
        return Response(serializer.data)


class PartnerProfileViewSet(viewsets.ModelViewSet):
    serializer_class = PartnerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return PartnerProfile.objects.all()
        return PartnerProfile.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get partner dashboard data"""
        try:
            profile = PartnerProfile.objects.get(user=request.user)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except PartnerProfile.DoesNotExist:
            return Response({'error': 'Partner profile not found'}, status=status.HTTP_404_NOT_FOUND)
