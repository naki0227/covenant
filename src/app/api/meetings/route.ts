import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sendToSlack, createNotionPage } from '@/lib/integrations';

export async function POST(req: Request) {
    try {
        const { title, transcript, analysis } = await req.json();

        const cookieStore = await cookies();

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value, ...options });
                        } catch (error) {
                            // The `set` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing the user session.
                        }
                    },
                    remove(name: string, options: CookieOptions) {
                        try {
                            cookieStore.set({ name, value: '', ...options });
                        } catch (error) {
                            // The `remove` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing the user session.
                        }
                    },
                },
            }
        );

        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            // Guest mode: Don't save, just return success so the UI doesn't break? 
            // Or actually, the UI shouldn't call this if guest.
            // But to be safe, if called without session, just acknowledge.
            console.log("Guest meeting, skipping persistence.");
            return NextResponse.json({ success: true, message: "Guest mode, not saved" });
        }

        // 1. Insert Meeting
        const { data: meeting, error: meetingError } = await supabase
            .from('meetings')
            .insert({
                title: title || 'New Meeting',
                summary: analysis.summary,
                transcript: transcript,
                key_decisions: analysis.keyDecisions,
                user_id: session.user.id
            })
            .select()
            .single();

        if (meetingError) {
            console.error('Supabase Meeting Error:', meetingError);
            return NextResponse.json({ error: meetingError.message }, { status: 500 });
        }

        // 2. Insert Action Items
        if (analysis.actionItems && analysis.actionItems.length > 0) {
            const actionItemsData = analysis.actionItems.map((item: any) => ({
                meeting_id: meeting.id,
                task: item.task,
                assignee: item.assignee,
                deadline: item.deadline,
                priority: item.priority
            }));

            const { error: itemsError } = await supabase
                .from('action_items')
                .insert(actionItemsData);

            if (itemsError) {
                console.error('Supabase Action Items Error:', itemsError);
                // Ideally rollback meeting, but for MVP we just report error
                return NextResponse.json({ error: itemsError.message }, { status: 500 });
            }
        }

        // 3. Integration Hooks
        // Fire and forget (don't await to avoid slowing down response)
        const integrationPromises = [];
        if (process.env.SLACK_WEBHOOK_URL) {
            integrationPromises.push(sendToSlack(`*New Meeting: ${title}*\n\n${analysis.summary}`));
        }
        if (process.env.NOTION_API_KEY) {
            integrationPromises.push(createNotionPage(title || 'New Meeting', analysis.summary, analysis.actionItems));
        }

        Promise.allSettled(integrationPromises).then(() => console.log('Integrations executed'));

        return NextResponse.json({ success: true, meetingId: meeting.id });

    } catch (error) {
        console.error('Save error:', error);
        return NextResponse.json(
            { error: 'Failed to save meeting data' },
            { status: 500 }
        );
    }
}
