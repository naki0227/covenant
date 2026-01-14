import { useState, useEffect, useRef } from 'react';

// 16kHz PCM capture needs a bit of AudioContext magic
export function useAudioStream(onAudioData: (base64: string) => void) {
    const [isRecording, setIsRecording] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const inputRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Initialize AudioContext
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 16000, // Gemini prefers 16kHz
            });
            audioContextRef.current = audioContext;

            // Create inputs
            const input = audioContext.createMediaStreamSource(stream);
            inputRef.current = input;

            // Simple buffer size 2048 or 4096
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);

                // Convert float32 to int16 (PCM)
                const pcmData = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    const s = Math.max(-1, Math.min(1, inputData[i]));
                    pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }

                // Base64 encode
                // Using FileReader is slow for real-time? Let's use simple buffer to string
                // But efficient way:
                const buffer = pcmData.buffer;
                let binary = '';
                const bytes = new Uint8Array(buffer);
                const len = bytes.byteLength;
                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                const base64 = btoa(binary);

                onAudioData(base64);
            };

            input.connect(processor);
            processor.connect(audioContext.destination);

            setIsRecording(true);
        } catch (err) {
            console.error('Error opening audio stream:', err);
        }
    };

    const stopRecording = () => {
        if (processorRef.current && inputRef.current) {
            inputRef.current.disconnect();
            processorRef.current.disconnect();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
        setIsRecording(false);
    };

    return { isRecording, startRecording, stopRecording };
}
