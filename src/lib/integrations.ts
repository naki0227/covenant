import { Client } from '@notionhq/client';

export async function sendToSlack(message: string) {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
        await fetch(webhookUrl, {
            method: 'POST',
            body: JSON.stringify({ text: message }),
            headers: { 'Content-Type': 'application/json' },
        });
        console.log('Sent to Slack');
    } catch (error) {
        console.error('Slack Error:', error);
    }
}

export async function createNotionPage(title: string, summary: string, actionItems: any[]) {
    const notionKey = process.env.NOTION_API_KEY;
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!notionKey || !databaseId) return;

    const notion = new Client({ auth: notionKey });

    try {
        await notion.pages.create({
            parent: { database_id: databaseId },
            properties: {
                Name: {
                    title: [{ text: { content: title } }],
                },
                Summary: {
                    rich_text: [{ text: { content: summary } }]
                }
            },
            children: [
                {
                    heading_2: {
                        rich_text: [{ text: { content: "Action Items" } }]
                    }
                },
                ...actionItems.map((item: any) => ({
                    to_do: {
                        rich_text: [{ text: { content: `[${item.priority}] ${item.task} (@${item.assignee})` } }],
                        checked: false
                    }
                }))
            ]
        });
        console.log('Created Notion Page');
    } catch (error) {
        console.error('Notion Error:', error);
    }
}
