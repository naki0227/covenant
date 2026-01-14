import { Card } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';

interface CopilotOverlayProps {
    connected: boolean;
    suggestion: string;
}

export function CopilotOverlay({ connected, suggestion }: CopilotOverlayProps) {
    if (!connected) return null;

    return (
        <div className="fixed bottom-4 right-4 w-80 z-50 transition-all duration-300">
            <Card className="bg-white/95 backdrop-blur shadow-2xl border-indigo-200">
                <div className="p-4 space-y-3">
                    <div className="flex items-center space-x-2 text-indigo-600 font-semibold border-b pb-2">
                        <Sparkles className="w-5 h-5 animate-pulse" />
                        <span>Real-time Copilot</span>
                    </div>

                    <div className="h-48 overflow-y-auto space-y-2 text-sm text-neutral-700">
                        {suggestion ? (
                            <p className="whitespace-pre-wrap animate-in fade-in">{suggestion}</p>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-neutral-400 space-y-2">
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span className="text-xs">Listening for contradictions...</span>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
