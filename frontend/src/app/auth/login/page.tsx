'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { login } from '@/lib/api'; 
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Utensils } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login: loginUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const response = await login(email, password);
      console.log('Login successful:', response);
      // Update auth context
      loginUser(response.user);
      // Redirect to home page
      router.push('/');
    } catch (err: any) {
      // Custom error for user not found or wrong password
      if (err.message && err.message.toLowerCase().includes('invalid username/email')) {
        setError('No account found with this email. Please register first.');
      } else if (err.message && err.message.toLowerCase().includes('password')) {
        setError('Incorrect password. Please try again.');
      } else {
        setError(err.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-muted/20">
      {/* Subtle radial highlight */}
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_50%_20%,hsl(var(--primary)/0.12),transparent_60%)]" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Utensils className="h-6 w-6 text-primary" />
          <span className="font-headline text-2xl font-bold text-primary">Tangtao</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center px-4 pb-16">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border border-border/50 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                <Utensils className="h-10 w-10 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Sign in to continue your culinary journey
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive" className="border-destructive/30">
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 focus-visible:ring-primary"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 focus-visible:ring-primary"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <input
                      id="remember"
                      type="checkbox"
                      className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-primary"
                    />
                    <Label htmlFor="remember" className="text-muted-foreground">
                      Remember me
                    </Label>
                  </div>
                  <Link
                    href="/auth/forgot-password"
                    className="font-medium text-primary hover:underline underline-offset-4"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary/90 transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/60 border-t-transparent"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/60"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wide">
                  <span className="bg-card px-3 text-muted-foreground">New to Tangtao?</span>
                </div>
              </div>

              <Button
                asChild
                variant="outline"
                className="w-full h-12 border-border/60 hover:bg-primary/10 hover:text-primary"
              >
                <Link href="/auth/register">
                  Create your account
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              By signing in, you agree to our{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}