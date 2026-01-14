import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge"; // Badge not installed yet, I'll use standard Tailwind for now or install badge. Actually standard tailwind is fine.
// Wait, I didn't install badge. I'll just use a span with classes.

interface ActionItem {
    assignee: string;
    task: string;
    deadline?: string;
    priority: 'High' | 'Medium' | 'Low';
}

interface ActionItemCardProps {
    item: ActionItem;
}

export function ActionItemCard({ item }: ActionItemCardProps) {
    const priorityColor = {
        High: 'bg-red-100 text-red-800 border-red-200',
        Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        Low: 'bg-green-100 text-green-800 border-green-200',
    };

    return (
        <Card className="w-full mb-4 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                    {item.assignee}
                </CardTitle>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${priorityColor[item.priority]}`}>
                    {item.priority}
                </span>
            </CardHeader>
            <CardContent>
                <p className="text-lg font-bold mb-2">{item.task}</p>
                <div className="flex items-center text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    {item.deadline || 'No deadline'}
                </div>
            </CardContent>
        </Card>
    );
}
