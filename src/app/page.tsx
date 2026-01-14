'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionItemCard } from "@/components/ActionItemCard";
import { AudioRecorder } from "@/components/AudioRecorder";
import { Loader2, Upload, FileText, LogIn, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGeminiLive } from '@/hooks/useGeminiLive';
import { useAudioStream } from '@/hooks/useAudioStream';
import { CopilotOverlay } from '@/components/CopilotOverlay';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

// Define strict types matching the API response
interface ActionItem {
  assignee: string;
  task: string;
  deadline?: string;
  priority: 'High' | 'Medium' | 'Low';
}

interface AnalysisResult {
  summary: string;
  keyDecisions: string[];
  actionItems: ActionItem[];
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'upload' | 'record'>('record');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'transcribing' | 'analyzing' | 'done'>('idle');
  const [transcript, setTranscript] = useState<string>('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const router = useRouter();

  // Live Mode State
  const [liveMode, setLiveMode] = useState(false);
  const { connect, disconnect, connected, copilotSuggestion, sendAudioChunk } = useGeminiLive();
  const { startRecording: startLive, stopRecording: stopLive, isRecording: isLiveRecording } = useAudioStream((base64) => {
    if (connected) sendAudioChunk(base64);
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    router.refresh();
  };

  const toggleLiveRecord = () => {
    if (isLiveRecording) {
      stopLive();
      disconnect();
    } else {
      connect();
      startLive();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setResult(null);
      setError(null);
    }
  };

  const processAudio = async (input: File | Blob) => {
    try {
      setStatus('uploading');

      // 1. Transcribe
      setStatus('transcribing');
      const formData = new FormData();
      formData.append('file', input);

      const transcribeRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (!transcribeRes.ok) throw new Error('Transcription failed');
      const transcribeData = await transcribeRes.json();
      setTranscript(transcribeData.text);

      // 2. Analyze
      setStatus('analyzing');
      const analyzeRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript: transcribeData.text }),
      });

      if (!analyzeRes.ok) throw new Error('Analysis failed');
      const analyzeData = await analyzeRes.json();

      setResult(analyzeData);
      setStatus('done');

      // Auto-Save ONLY if logged in
      if (session) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/meetings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `Meeting ${new Date().toLocaleString()}`,
            transcript: transcribeData.text,
            analysis: analyzeData
          })
        }).then(res => {
          if (res.ok) console.log('Meeting saved to Supabase');
          else console.error('Failed to auto-save to Supabase');
        }).catch(err => console.error('Save Error', err));
      }

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStatus('idle');
    }
  };

  return (
    <main className="min-h-screen bg-neutral-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900">📜 Covenant</h1>
            <p className="text-neutral-600">
              Turn your meeting records into <span className="font-semibold text-indigo-600">Binding Agreements</span>.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {session ? (
              <>
                <Link href="/history">
                  <Button variant="outline" size="sm">
                    <History className="mr-2 h-4 w-4" /> History
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  Sign Out
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button size="sm">
                  <LogIn className="mr-2 h-4 w-4" /> Sign In / Save History
                </Button>
              </Link>
            )}
          </div>
        </header>

        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Live Meeting Card */}
          <Card className={`transition-all ${mode === 'record' ? 'ring-2 ring-indigo-500 shadow-lg' : 'opacity-90'}`} onClick={() => setMode('record')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🎙️ Live Meeting</span>
                <div className="ml-auto flex items-center space-x-2">
                  <Label htmlFor="live-mode" className="text-xs font-normal">Copilot Mode</Label>
                  <Switch id="live-mode" checked={liveMode} onCheckedChange={setLiveMode} />
                </div>
              </CardTitle>
              <CardDescription>
                {liveMode ? "Real-time AI Streaming via WebSocket" : "Record audio -> Auto-transcribe & Persist"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center min-h-[200px]">
              {liveMode ? (
                <div className="text-center space-y-4">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-colors mx-auto ${isLiveRecording ? 'bg-red-100' : 'bg-neutral-100'}`}>
                    <Button
                      variant={isLiveRecording ? "destructive" : "default"}
                      size="lg"
                      className="rounded-full w-20 h-20"
                      onClick={(e) => { e.stopPropagation(); toggleLiveRecord(); }}
                    >
                      {isLiveRecording ? "Stop" : "Live"}
                    </Button>
                  </div>
                  <p className="text-sm text-neutral-500">{isLiveRecording ? "Streaming to Gemini..." : "Ready to Stream"}</p>
                </div>
              ) : (
                <AudioRecorder onStop={processAudio} isProcessing={status === 'transcribing' || status === 'analyzing'} />
              )}
            </CardContent>
          </Card>

          {/* Upload File Card */}
          <Card className={`transition-all ${mode === 'upload' ? 'ring-2 ring-indigo-500 shadow-lg' : 'opacity-90'}`} onClick={() => setMode('upload')}>
            <CardHeader>
              <CardTitle>Upload File</CardTitle>
              <CardDescription>Upload an existing audio file for analysis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-neutral-300 border-dashed rounded-lg cursor-pointer bg-neutral-50 hover:bg-neutral-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-neutral-400" />
                    <p className="mb-2 text-sm text-neutral-500"><span className="font-semibold">Click to upload</span></p>
                    <p className="text-xs text-neutral-500">MP3, WAV, M4A</p>
                  </div>
                  <input id="dropzone-file" type="file" className="hidden" accept="audio/*" onChange={handleFileChange} />
                </label>
              </div>
              {file && (
                <div className="text-center text-sm font-medium text-indigo-600">
                  Selected: {file.name}
                </div>
              )}
              <Button
                className="w-full"
                onClick={(e) => { e.stopPropagation(); file && processAudio(file); }}
                disabled={!file || status !== 'idle'}
              >
                {status === 'idle' && 'Process Upload'}
                {status === 'transcribing' && <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transcribing...</>}
                {status === 'analyzing' && <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>}
                {status === 'done' && 'Completed!'}
              </Button>
              {error && <p className="text-red-500 text-center text-sm">{error}</p>}
            </CardContent>
          </Card>
        </div>

        {/* Real-time Copilot Overlay */}
        <CopilotOverlay connected={connected} suggestion={copilotSuggestion} />

        {/* Results Section */}
        {status === 'done' && result && (
          <div className="space-y-6">

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center"><FileText className="mr-2" /> Executive Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed text-neutral-700">{result.summary}</p>
              </CardContent>
            </Card>

            {/* Key Decisions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-indigo-700">Decisions Made</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2 text-neutral-700">
                  {result.keyDecisions.map((decision, i) => (
                    <li key={i}>{decision}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Action Items */}
            <Card className="border-indigo-100 bg-indigo-50/30">
              <CardHeader>
                <CardTitle className="text-indigo-700 flex items-center">
                  Action Items
                  <Badge variant="outline" className="ml-2 bg-indigo-100 text-indigo-700">{result.actionItems.length}</Badge>
                </CardTitle>
                <CardDescription>Tasks assigned during this meeting.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {result.actionItems.map((item, i) => (
                    <ActionItemCard key={i} item={item} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Transcript (Collapsed) */}
            <details className="group">
              <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-neutral-500 hover:text-neutral-700">
                <span>Show Full Transcript</span>
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <div className="text-neutral-600 mt-4 p-4 bg-white rounded border whitespace-pre-wrap text-sm">
                {transcript}
              </div>
            </details>

          </div>
        )}

      </div>
    </main>
  );
}
