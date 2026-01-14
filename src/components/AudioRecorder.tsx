'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";

interface AudioRecorderProps {
    onStop: (audioBlob: Blob) => void;
    isProcessing: boolean;
}

export function AudioRecorder({ onStop, isProcessing }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isListening, setIsListening] = useState(false); // VAD active state
    const [volume, setVolume] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

    const VAD_THRESHOLD = 0.02; // Threshold to start recording
    const SILENCE_DURATION = 3000; // Time to stop after silence (optional, currently manual stop)

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsListening(false);

            // Stop tracks
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }

            // Stop visualization
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        }
    }, [isRecording]);

    const startVAD = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Setup Audio Context for analysis
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioContext;
            const analyser = audioContext.createAnalyser();
            analyserRef.current = analyser;
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 256;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            setIsListening(true); // Ready to detect

            const checkVolume = () => {
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const average = sum / bufferLength;
                const normalizedVolume = average / 255;
                setVolume(normalizedVolume);

                // Auto-Start Logic
                if (!isRecording && normalizedVolume > VAD_THRESHOLD) {
                    startRecording(stream);
                }

                animationFrameRef.current = requestAnimationFrame(checkVolume);
            };

            checkVolume();

        } catch (err) {
            console.error("Error accessing microphone:", err);
            setIsListening(false);
        }
    };

    const startRecording = (stream: MediaStream) => {
        if (isRecording) return;

        console.log("Auto-starting recording...");
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
            chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' }); // webm is standard for MediaRecorder
            onStop(blob);
        };

        mediaRecorder.start();
        setIsRecording(true);
    };

    // Cleanup
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        }
    }, []);

    return (
        <div className="flex flex-col items-center justify-center space-y-4 p-6 border-2 border-neutral-200 border-dashed rounded-xl bg-neutral-50/50">

            <div className="h-16 flex items-center justify-center space-x-1">
                {/* Simple Visualizer */}
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className={`w-3 bg-indigo-500 rounded-full transition-all duration-75 ${isRecording || isListening ? 'opacity-100' : 'opacity-20'}`}
                        style={{
                            height: isListening ? Math.max(10, volume * 100 * (i + 1) * 0.5) + 'px' : '10px'
                        }}
                    />
                ))}
            </div>

            <div className="text-center space-y-2">
                {!isListening && !isRecording && (
                    <Button size="lg" onClick={startVAD} disabled={isProcessing} className="w-48">
                        <Mic className="mr-2 h-5 w-5" /> Start Listener
                    </Button>
                )}

                {isListening && !isRecording && (
                    <div className="text-indigo-600 font-medium animate-pulse">
                        Listening for speech... (Speak to start)
                    </div>
                )}

                {isRecording && (
                    <Button size="lg" variant="destructive" onClick={stopRecording} disabled={isProcessing} className="w-48 animate-pulse">
                        <Square className="mr-2 h-5 w-5 fill-current" /> Stop & Process
                    </Button>
                )}

                {isProcessing && (
                    <div className="text-neutral-500 flex items-center justify-center text-sm">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing meeting...
                    </div>
                )}
            </div>

            <p className="text-xs text-neutral-400">
                Requires microphone access. Recording starts automatically when you speak.
            </p>
        </div>
    );
}
