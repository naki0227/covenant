import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const PORT = process.env.PORT || 8081;
const GEMINI_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';

const wss = new WebSocketServer({ port: PORT });

console.log(`WebSocket Proxy running on ws://localhost:${PORT}`);

wss.on('connection', (clientWs: WebSocket) => {
    console.log('Client connected');

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
        console.error('API Key not found');
        clientWs.close(1008, 'API Key not found on server');
        return;
    }

    // Connect to specific model version
    // Using gemini-2.0-flash-exp
    const targetUrl = `${GEMINI_URL}?key=${apiKey}`;

    const geminiWs = new WebSocket(targetUrl);

    geminiWs.on('open', () => {
        console.log('Connected to Gemini');
        // Initial setup message could be sent here if needed, or relayed from client
    });

    geminiWs.on('message', (data: Buffer) => {
        // Relay message from Gemini to Client
        if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(data);
        }
    });

    geminiWs.on('error', (error: Error) => {
        console.error('Gemini WebSocket Error:', error);
        clientWs.close(1011, 'Gemini Error');
    });

    geminiWs.on('close', () => {
        console.log('Gemini connection closed');
        clientWs.close();
    });

    // Relay messages from Client to Gemini
    clientWs.on('message', (data: Buffer) => {
        if (geminiWs.readyState === WebSocket.OPEN) {
            geminiWs.send(data);
        } else {
            // Buffer or drop? For real-time audio, dropping might be better or queueing briefly.
            // For simplicity, we just log.
            // console.warn('Gemini not ready, dropping message');
        }
    });

    clientWs.on('close', () => {
        console.log('Client disconnected');
        if (geminiWs.readyState === WebSocket.OPEN) {
            geminiWs.close();
        }
    });
});
