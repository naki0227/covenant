import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

export const maxDuration = 60; // Allow longer timeout for analysis

const analysisSchema = z.object({
    summary: z.string().describe('A concise summary of the meeting.'),
    keyDecisions: z.array(z.string()).describe('List of key decisions made.'),
    actionItems: z.array(
        z.object({
            assignee: z.string().describe('Name of the person assigned to the task. Use "Unknown" if not clear.'),
            task: z.string().describe('Description of the task.'),
            deadline: z.string().optional().describe('Deadline for the task if mentioned (e.g., "Next Monday", "2023-12-31").'),
            priority: z.enum(['High', 'Medium', 'Low']).describe('Estimated priority of the task.'),
        })
    ).describe('List of actionable tasks extracted from the meeting.'),
});

export async function POST(req: Request) {
    try {
        const { transcript } = await req.json();

        if (!transcript) {
            return NextResponse.json({ error: 'No transcript provided' }, { status: 400 });
        }

        const { object } = await generateObject({
            model: google('gemini-2.0-flash-exp'), // Use Flash for speed
            schema: analysisSchema,
            prompt: `
        Analyze the following meeting transcript and extract the key information.
        Focus on identifying specific action items, who they are assigned to, and any deadlines.
        
        Transcript:
        ${transcript}
      `,
        });

        return NextResponse.json(object);
    } catch (error) {
        console.error('Analysis error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze transcript' },
            { status: 500 }
        );
    }
}
