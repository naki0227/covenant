'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ActionItemCard } from '@/components/ActionItemCard';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

function MeetingDetailContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const [meeting, setMeeting] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        if (!id) return;

        const fetchMeeting = async () => {
            const { data, error } = await supabase
                .from('meetings')
                .select('*, action_items(*)')
                .eq('id', id)
                .single();

            if (data) setMeeting(data);
            setLoading(false);
        };

        fetchMeeting();
    }, [id, supabase]);

    if (!id) return <p>No ID provided</p>;
    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
    if (!meeting) return <p>Meeting not found</p>;

    return (
        <div className="min-h-screen bg-neutral-50 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-neutral-900">{meeting.title}</h1>
                    <p className="text-neutral-500">{format(new Date(meeting.created_at), 'PPP p')}</p>
                </div>

                <Card>
                    <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
                    <CardContent><p className="leading-relaxed">{meeting.summary}</p></CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Key Decisions</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-5 space-y-2">
                            {meeting.key_decisions?.map((d: string, i: number) => <li key={i}>{d}</li>)}
                        </ul>
                    </CardContent>
                </Card>

                {meeting.action_items && meeting.action_items.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-2">
                        {meeting.action_items.map((item: any) => (
                            <ActionItemCard key={item.id} item={item} />
                        ))}
                    </div>
                )}

                <details className="group">
                    <summary className="cursor-pointer text-neutral-500">Show Transcript</summary>
                    <div className="mt-2 p-4 bg-white rounded border whitespace-pre-wrap text-sm text-neutral-600">
                        {meeting.transcript}
                    </div>
                </details>
            </div>
        </div>
    );
}

export default function MeetingPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>}>
            <MeetingDetailContent />
        </Suspense>
    );
}
