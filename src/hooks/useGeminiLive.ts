import { useState, useRef, useEffect, useCallback } from 'react';

const PROXY_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8081';

export function useGeminiLive() {
    const [connected, setConnected] = useState(false);
    const [transcription, setTranscription] = useState('');
    const [copilotSuggestion, setCopilotSuggestion] = useState('');
    const wsRef = useRef<WebSocket | null>(null);

    const connect = useCallback(() => {
        if (wsRef.current) return;

        const ws = new WebSocket(PROXY_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('Connected to Gemini Proxy');
            setConnected(true);
            // Send initial setup message with System Instruction
            const setupMsg = {
                setup: {
                    model: "models/gemini-2.0-flash-exp",
                    generationConfig: {
                        responseModalities: ["TEXT"]
                    },
                    systemInstruction: {
                        parts: [{
                            text: `You are an intelligent "Meeting Copilot". Your role is to actively listen to the meeting audio and provide real-time strategic advice. 
                            
                            DO NOT just transcribe. 
                            Instead, analyse the discussion for:
                            1. Contradictions: "Wait, didn't we say the budget was $5k earlier?"
                            2. Missing info: "You haven't discussed the deadline."
                            3. Circular arguments: "This discussion seems stuck. Suggest moving to next topic."
                            
                            Output short, punchy, actionable alerts (max 1-2 sentences). 
                            If everything is going well, stay silent.`
                        }]
                    }
                }
            };
            ws.send(JSON.stringify(setupMsg));
        };

        ws.onmessage = (event) => {
            try {
                // Buffer check if binary
                if (event.data instanceof Blob) {
                    // Audio response?
                    return;
                }

                const data = JSON.parse(event.data as string);

                // Handle ServerContent
                if (data.serverContent?.modelTurn?.parts) {
                    const parts = data.serverContent.modelTurn.parts;
                    parts.forEach((part: any) => {
                        if (part.text) {
                            // Append to transcription or copilot suggestion based on context?
                            // Gemini 2.0 returns everything as model text.
                            // We need to distinguish "Transcript" vs "Copilot Note".
                            // For now, let's treat it all as Copilot output since user audio is input.
                            // Wait, Gemini 2.0 Live doesn't auto-transcribe user audio back to text in the same stream unless asked.
                            // But usually it responds to the audio.

                            // If we want transcription of USER audio, we rely on the model to "reply" with it?
                            // Or we use a separate STT? 
                            // Current Live API is "Multimodal to Multimodal".
                            // If we want it to act as a Copilot, we should prompt it in the setup message.
                            // For a clearer UI, every time the model speaks a new "turn", we might want to clear old text or append new lines.
                            // Since we instructed it to be short, let's just show the latest valid "thought" or append with newlines.
                            // For this MVP, let's just append but maybe clear if it's been a while? 
                            // Actually, let's replace the text if it's a new "turn" (unlikely in streaming without more logic), 
                            // so let's just append for now but add a newline for distinct thoughts.
                            setCopilotSuggestion(prev => {
                                // If the model output starts a new sentence or thought, format it.
                                return prev + part.text;
                            });
                        }
                    });
                }

                // Handle Tool use or other events if we add them
            } catch (e) {
                console.error('Parse error', e);
            }
        };

        ws.onclose = () => {
            console.log('Disconnected');
            setConnected(false);
            wsRef.current = null;
        };

        ws.onerror = (err) => {
            console.error('WebSocket Error', err);
        };
    }, []);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
        }
    }, []);

    const sendAudioChunk = useCallback((base64Audio: string) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const msg = {
                realtimeInput: {
                    mediaChunks: [
                        {
                            mimeType: "audio/pcm",
                            data: base64Audio
                        }
                    ]
                }
            };
            wsRef.current.send(JSON.stringify(msg));
        }
    }, []);

    return { connect, disconnect, connected, transcription, copilotSuggestion, sendAudioChunk };
}
