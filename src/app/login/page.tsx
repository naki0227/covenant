'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleSignUp = async () => {
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
            },
        });
        if (error) setError(error.message);
        else setError('Check your email for confirmation link.');
        setLoading(false);
    };

    const handleSignIn = async () => {
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) setError(error.message);
        else {
            router.refresh();
            router.push('/');
        }
        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center">Covenant Login</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex flex-col space-y-2">
                        <Button className="w-full" onClick={handleSignIn} disabled={loading}>
                            {loading ? 'Loading...' : 'Sign In'}
                        </Button>
                        <Button className="w-full" variant="outline" onClick={handleSignUp} disabled={loading}>
                            Sign Up
                        </Button>
                        <div className="text-center mt-2">
                            <Button variant="link" size="sm" onClick={() => router.push('/')}>
                                Continue as Guest
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
