'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface Meeting {
    id: string;
    title: string;
    created_at: string;
    summary: string;
}

export default function History() {
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchHistory = async () => {
            const { data } = await supabase
                .from('meetings')
                .select('id, title, created_at, summary')
                .order('created_at', { ascending: false });

            if (data) setMeetings(data);
            setLoading(false);
        };
        fetchHistory();
    }, [supabase]);

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-neutral-50 p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold text-neutral-900">Meeting History</h1>
                <div className="grid gap-4">
                    {meetings.map((meeting) => (
                        <Link href={`/meeting?id=${meeting.id}`} key={meeting.id}>
                            <Card className="hover:bg-neutral-100 transition">
                                <CardHeader>
                                    <CardTitle>{meeting.title || 'Untitled Meeting'}</CardTitle>
                                    <div className="text-sm text-neutral-500">
                                        {format(new Date(meeting.created_at), 'PPP p')}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="line-clamp-2 text-neutral-600">{meeting.summary}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                    {meetings.length === 0 && (
                        <p className="text-center text-neutral-500 py-10">No meetings recorded yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
