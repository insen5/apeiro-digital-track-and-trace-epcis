'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi, authStorage } from '@/lib/api/auth';
import { showToast } from '@/lib/toast';
import { Lock, Mail, User } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already logged in
    if (authStorage.isAuthenticated()) {
      const user = authStorage.getUser();
      // Redirect based on role
      if (user) {
        redirectToRoleHome(user.role);
      }
    }
  }, []);

  const redirectToRoleHome = (role: string) => {
    switch (role) {
      case 'dha':
        router.push('/regulator/ppb-batches');
        break;
      case 'manufacturer':
        router.push('/manufacturer/batches');
        break;
      case 'cpa':
        router.push('/distributor/shipments');
        break;
      case 'user_facility':
        router.push('/'); // Facilities don't have a specific module yet
        break;
      default:
        router.push('/');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      showToast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      
      // Store user in localStorage
      authStorage.setUser(response);
      
      showToast.success(`Welcome, ${response.organization}!`);
      
      // Redirect based on role
      redirectToRoleHome(response.role);
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed. Please check your credentials.';
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Kenya TNT System
          </CardTitle>
          <p className="text-center text-gray-600">
            National Track & Trace System
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  Demo Quick Login
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full text-left justify-start"
                onClick={() => quickLogin('ppp@ppp.com', 'password')}
                disabled={loading}
              >
                <User className="mr-2 h-4 w-4" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Pharmacy and Poisons Board</span>
                  <span className="text-xs text-gray-500">ppp@ppp.com</span>
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full text-left justify-start"
                onClick={() => quickLogin('test-manufacturer@pharma.ke', 'password')}
                disabled={loading}
              >
                <User className="mr-2 h-4 w-4" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Test Manufacturer</span>
                  <span className="text-xs text-gray-500">test-manufacturer@pharma.ke (GLN: 6164003000000)</span>
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full text-left justify-start"
                onClick={() => quickLogin('kemsa@health.ke', 'password')}
                disabled={loading}
              >
                <User className="mr-2 h-4 w-4" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold">KEMSA (Supplier)</span>
                  <span className="text-xs text-gray-500">kemsa@health.ke (GLN: 0614141000013)</span>
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full text-left justify-start"
                onClick={() => quickLogin('facility1@health.ke', 'password')}
                disabled={loading}
              >
                <User className="mr-2 h-4 w-4" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Kenyatta National Hospital</span>
                  <span className="text-xs text-gray-500">facility1@health.ke (GLN: 0614141000020)</span>
                </div>
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/')}
              disabled={loading}
            >
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
