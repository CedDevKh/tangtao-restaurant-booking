'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { isLoggedIn, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    username: '',
  });
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    if (!isLoggedIn) {
      router.push('/auth/login');
      return;
    }

    // Load user data
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        username: user.username || '',
      });
    }
    setLoading(false);
  }, [isLoggedIn, user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveChanges = async () => {
    // TODO: Implement API call to update user profile
    console.log('Saving profile changes:', formData);
    // This would call an API endpoint to update the user profile
  };

  const handlePasswordChange = async () => {
    // TODO: Implement password change functionality
    console.log('Password change requested');
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Please log in to view your profile</h1>
          <Button onClick={() => router.push('/auth/login')} className="mt-4">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
            <header>
                <h1 className="font-headline text-3xl font-bold tracking-tight">Profile</h1>
                <p className="mt-2 text-muted-foreground">
                  Manage your account settings and personal information.
                </p>
                <div className="mt-2 text-sm text-muted-foreground">
                  Account Type: <span className="font-medium capitalize">{user.user_type}</span>
                  {user.email_verified && <span className="ml-4 text-green-600">✓ Email Verified</span>}
                </div>
            </header>
            <Separator />
            
            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input 
                          id="username" 
                          name="username"
                          value={formData.username} 
                          onChange={handleInputChange}
                          disabled // Username typically shouldn't be changeable
                        />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first-name">First Name</Label>
                            <Input 
                              id="first-name" 
                              name="first_name"
                              value={formData.first_name} 
                              onChange={handleInputChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last-name">Last Name</Label>
                            <Input 
                              id="last-name" 
                              name="last_name"
                              value={formData.last_name} 
                              onChange={handleInputChange}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          name="email"
                          type="email" 
                          value={formData.email} 
                          onChange={handleInputChange}
                        />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input 
                          id="phone" 
                          name="phone_number"
                          type="tel" 
                          value={formData.phone_number} 
                          onChange={handleInputChange}
                          placeholder="+1234567890"
                        />
                    </div>
                </CardContent>
                <div className="border-t px-6 py-4">
                     <Button onClick={handleSaveChanges}>Save Changes</Button>
                </div>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Update your password. It's a good idea to use a strong password that you're not using elsewhere.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input id="current-password" type="password" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input id="confirm-password" type="password" />
                    </div>
                </CardContent>
                 <div className="border-t px-6 py-4">
                     <Button>Update Password</Button>
                </div>
            </Card>
        </div>
    </div>
  );
}
