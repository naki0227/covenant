import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // Required for file handling
export const maxDuration = 60;

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Convert File to ArrayBuffer then Base64
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        const mimeType = file.type || 'audio/mp3'; // Default fallback

        // Use Gemini 1.5 Flash for audio transcription
        const { text } = await generateText({
            model: google('gemini-2.0-flash-exp'),
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: 'Please transcribe the following audio file exactly as spoken. Do not add any summaries or extra text.' },
                        { type: 'file', data: base64Data, mimeType: mimeType } as any,
                    ],
                },
            ],
        });

        return NextResponse.json({ text });
    } catch (error) {
        console.error('Transcription error:', error);
        return NextResponse.json(
            { error: 'Failed to transcribe audio with Gemini' },
            { status: 500 }
        );
    }
}
