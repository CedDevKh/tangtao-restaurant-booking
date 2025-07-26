"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { PartnerProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const PartnerDashboardPage = () => {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/auth/login');
    }
  }, [isLoggedIn, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/api/partner-profiles/dashboard/');
        setProfile(response.data);
      } catch (err) {
        setError('Failed to fetch partner dashboard data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  if (!isLoggedIn || loading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4">{error}</div>;
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">No Partner Profile Found</h2>
            <p className="mb-4">You don't have a partner profile yet. Apply for partnership to get started.</p>
            <Button onClick={() => router.push('/partner/applications')}>
              Apply for Partnership
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-yellow-600">Partner Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-600">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-gray-800">{profile.total_bookings}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-gray-800"></p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-600">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-gray-800">{profile.average_rating.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-600">Business Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Business Name:</strong> {profile.business_name}</p>
              <p><strong>Email:</strong> {profile.business_email}</p>
              <p><strong>Phone:</strong> {profile.business_phone}</p>
              <p><strong>Address:</strong> {profile.business_address}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-600">Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Notifications Enabled:</span>
                <span className={profile.notifications_enabled ? 'text-green-600' : 'text-red-600'}>
                  {profile.notifications_enabled ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Auto Accept Bookings:</span>
                <span className={profile.auto_accept_bookings ? 'text-green-600' : 'text-red-600'}>
                  {profile.auto_accept_bookings ? 'Yes' : 'No'}
                </span>
              </div>
              <Button 
                onClick={() => router.push('/partner/profile')}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PartnerDashboardPage;
