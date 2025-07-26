'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { register, RegisterData } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Calendar, 
  ArrowLeft, 
  Utensils,
  CheckCircle2,
  UserPlus
} from 'lucide-react';

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterData>({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    date_of_birth: '',
    user_type: 'diner',
    marketing_consent: false,
    terms_accepted: false,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Client-side validation
    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!formData.terms_accepted) {
      setError('You must accept the terms and conditions');
      setLoading(false);
      return;
    }

    try {
      // Convert empty string date_of_birth to null
      const payload = {
        ...formData,
        date_of_birth: formData.date_of_birth === '' ? null : formData.date_of_birth,
      };
      const response = await register(payload);
      console.log('Registration successful:', response);
      router.push('/auth/login?message=Registration successful! Please sign in.');
    } catch (err: any) {
      // Custom error for duplicate email
      if (err.message && err.message.toLowerCase().includes('email')) {
        setError('An account with this email already exists. Please log in or reset your password.');
      } else {
        setError(err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const isStep1Valid = formData.email && formData.password && formData.password_confirm && formData.password === formData.password_confirm;
  const isStep2Valid = formData.first_name && formData.last_name && formData.username;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
        <div className="flex items-center gap-2">
          <Utensils className="h-6 w-6 text-orange-600" />
          <span className="font-bold text-xl text-gray-900">Tangtao</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-lg">
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-500">
                <UserPlus className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Join Tangtao
              </CardTitle>
              <CardDescription className="text-base text-gray-600">
                Create your account and start discovering amazing restaurants
              </CardDescription>
              
              {/* Progress Steps */}
              <div className="flex items-center justify-center mt-6 space-x-4">
                <div className={`flex items-center ${currentStep >= 1 ? 'text-orange-600' : 'text-gray-300'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-orange-600' : 'bg-gray-200'}`}>
                    {currentStep > 1 ? (
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    ) : (
                      <span className={`text-sm font-semibold ${currentStep >= 1 ? 'text-white' : 'text-gray-500'}`}>1</span>
                    )}
                  </div>
                  <span className="ml-2 text-sm font-medium">Account</span>
                </div>
                <div className="w-12 h-0.5 bg-gray-200"></div>
                <div className={`flex items-center ${currentStep >= 2 ? 'text-orange-600' : 'text-gray-300'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-orange-600' : 'bg-gray-200'}`}>
                    {currentStep > 2 ? (
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    ) : (
                      <span className={`text-sm font-semibold ${currentStep >= 2 ? 'text-white' : 'text-gray-500'}`}>2</span>
                    )}
                  </div>
                  <span className="ml-2 text-sm font-medium">Profile</span>
                </div>
                <div className="w-12 h-0.5 bg-gray-200"></div>
                <div className={`flex items-center ${currentStep >= 3 ? 'text-orange-600' : 'text-gray-300'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-orange-600' : 'bg-gray-200'}`}>
                    <span className={`text-sm font-semibold ${currentStep >= 3 ? 'text-white' : 'text-gray-500'}`}>3</span>
                  </div>
                  <span className="ml-2 text-sm font-medium">Finish</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Step 1: Account Setup */}
                {currentStep === 1 && (
                  <div className="space-y-5">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Account Setup</h3>
                      <p className="text-sm text-gray-600">Let's start with your basic account information</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user_type" className="text-sm font-medium text-gray-700">
                        I'm joining as a
                      </Label>
                      <Select value={formData.user_type} onValueChange={(value) => handleSelectChange('user_type', value)}>
                        <SelectTrigger className="h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500">
                          <SelectValue placeholder="Select your account type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="diner">🍽️ Diner - Browse and book restaurants</SelectItem>
                          <SelectItem value="restaurant_owner">🏪 Restaurant Owner - Manage my restaurant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="pl-10 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a strong password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className="pl-10 pr-10 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password_confirm" className="text-sm font-medium text-gray-700">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="password_confirm"
                          name="password_confirm"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm your password"
                          value={formData.password_confirm}
                          onChange={handleInputChange}
                          className="pl-10 pr-10 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="button"
                      disabled={!isStep1Valid}
                      onClick={() => setCurrentStep(2)}
                      className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Continue
                    </Button>
                  </div>
                )}

                {/* Step 2: Profile Information */}
                {currentStep === 2 && (
                  <div className="space-y-5">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
                      <p className="text-sm text-gray-600">Tell us a bit about yourself</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                        Username
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="username"
                          name="username"
                          type="text"
                          placeholder="Choose a unique username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className="pl-10 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name" className="text-sm font-medium text-gray-700">
                          First Name
                        </Label>
                        <Input
                          id="first_name"
                          name="first_name"
                          type="text"
                          placeholder="John"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          className="h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name" className="text-sm font-medium text-gray-700">
                          Last Name
                        </Label>
                        <Input
                          id="last_name"
                          name="last_name"
                          type="text"
                          placeholder="Doe"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          className="h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone_number" className="text-sm font-medium text-gray-700">
                        Phone Number <span className="text-gray-400">(Optional)</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="phone_number"
                          name="phone_number"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={formData.phone_number}
                          onChange={handleInputChange}
                          className="pl-10 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date_of_birth" className="text-sm font-medium text-gray-700">
                        Date of Birth <span className="text-gray-400">(Optional)</span>
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="date_of_birth"
                          name="date_of_birth"
                          type="date"
                          value={formData.date_of_birth}
                          onChange={handleInputChange}
                          className="pl-10 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(1)}
                        className="flex-1 h-12 border-gray-200 text-gray-700 hover:bg-gray-50"
                      >
                        Back
                      </Button>
                      <Button
                        type="button"
                        disabled={!isStep2Valid}
                        onClick={() => setCurrentStep(3)}
                        className="flex-1 h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Terms and Preferences */}
                {currentStep === 3 && (
                  <div className="space-y-5">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Almost Done!</h3>
                      <p className="text-sm text-gray-600">Just a few final details</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                        <Checkbox
                          id="terms_accepted"
                          name="terms_accepted"
                          checked={formData.terms_accepted}
                          onCheckedChange={(checked) => handleInputChange({
                            target: { name: 'terms_accepted', type: 'checkbox', checked }
                          } as any)}
                          className="mt-1"
                        />
                        <div className="text-sm">
                          <Label htmlFor="terms_accepted" className="text-gray-900 cursor-pointer">
                            I agree to the{' '}
                            <Link href="/terms" className="text-orange-600 hover:underline font-medium">
                              Terms of Service
                            </Link>{' '}
                            and{' '}
                            <Link href="/privacy" className="text-orange-600 hover:underline font-medium">
                              Privacy Policy
                            </Link>
                          </Label>
                          <p className="text-gray-600 mt-1">
                            Required to create your account and use our services.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
                        <Checkbox
                          id="marketing_consent"
                          name="marketing_consent"
                          checked={formData.marketing_consent}
                          onCheckedChange={(checked) => handleInputChange({
                            target: { name: 'marketing_consent', type: 'checkbox', checked }
                          } as any)}
                          className="mt-1"
                        />
                        <div className="text-sm">
                          <Label htmlFor="marketing_consent" className="text-gray-900 cursor-pointer">
                            Send me exclusive deals and restaurant recommendations
                          </Label>
                          <p className="text-gray-600 mt-1">
                            Get notified about special offers, new restaurants, and personalized recommendations.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep(2)}
                        className="flex-1 h-12 border-gray-200 text-gray-700 hover:bg-gray-50"
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading || !formData.terms_accepted}
                        className="flex-1 h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            Creating Account...
                          </div>
                        ) : (
                          'Create Account'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </form>

              {/* Login Link */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-500">Already have an account?</span>
                </div>
              </div>

              <Button
                asChild
                variant="outline"
                className="w-full h-12 border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <Link href="/auth/login">
                  Sign in instead
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}