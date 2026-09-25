"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  sendVoiceWhisper,
  getLatestVoiceWhisper,
  markWhisperListened,
  VoiceWhisperItem,
} from "@/actions/whisper";
import { triggerHaptic } from "@/lib/haptics";

interface WalkieTalkieModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName: string;
  initialWhisper?: VoiceWhisperItem | null;
  onWhisperSent?: () => void;
}

export function WalkieTalkieModal({
  isOpen,
  onClose,
  partnerName,
  initialWhisper = null,
  onWhisperSent,
}: WalkieTalkieModalProps) {
  // Listen State (Partner's Received Whisper)
  const [whisper, setWhisper] = useState<VoiceWhisperItem | null>(initialWhisper);
  const [isPlayingReceived, setIsPlayingReceived] = useState(false);
  const [receivedProgress, setReceivedProgress] = useState(0);

  // Sent Whisper State (What Current User Sent)
  const [sentWhisper, setSentWhisper] = useState<VoiceWhisperItem | null>(null);
  const [isPlayingSent, setIsPlayingSent] = useState(false);
  const [sentProgress, setSentProgress] = useState(0);

  // Record State
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  // Mic Self-Test State
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [testPhase, setTestPhase] = useState<"idle" | "recording" | "playing" | "success">("idle");
  const [testCountdown, setTestCountdown] = useState(3);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const receivedAudioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const sentAudioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const testAudioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);

  // Load whispers when modal opens
  const loadWhispers = useCallback(() => {
    getLatestVoiceWhisper().then((res) => {
      if (res.success) {
        if (res.whisper) setWhisper(res.whisper);
        if (res.sentWhisper) setSentWhisper(res.sentWhisper);
      }
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (initialWhisper) {
      setWhisper(initialWhisper);
    }
    loadWhispers();
  }, [isOpen, initialWhisper, loadWhispers]);

  // Teardown when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (receivedAudioPlayerRef.current) {
        receivedAudioPlayerRef.current.pause();
        receivedAudioPlayerRef.current = null;
      }
      if (sentAudioPlayerRef.current) {
        sentAudioPlayerRef.current.pause();
        sentAudioPlayerRef.current = null;
      }
      if (testAudioPlayerRef.current) {
        testAudioPlayerRef.current.pause();
        testAudioPlayerRef.current = null;
      }
      setIsPlayingReceived(false);
      setIsPlayingSent(false);
      setReceivedProgress(0);
      setSentProgress(0);
      setRecordError(null);
      setIsTestingMic(false);
      setTestPhase("idle");
      stopRecordingCleanup();
    }
  }, [isOpen]);

  const stopRecordingCleanup = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
  };

  // Playback Handler for Received Whisper
  const handleTogglePlayReceived = () => {
    if (!whisper) return;

    if (isPlayingReceived && receivedAudioPlayerRef.current) {
      receivedAudioPlayerRef.current.pause();
      setIsPlayingReceived(false);
      return;
    }

    // Stop sent playback if playing
    if (sentAudioPlayerRef.current) {
      sentAudioPlayerRef.current.pause();
      setIsPlayingSent(false);
    }

    triggerHaptic("selection");

    if (!receivedAudioPlayerRef.current) {
      const audio = new Audio(whisper.audioData);
      receivedAudioPlayerRef.current = audio;

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setReceivedProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.onended = () => {
        setIsPlayingReceived(false);
        setReceivedProgress(100);
        if (!whisper.isListened) {
          markWhisperListened(whisper.id);
          setWhisper((prev) => (prev ? { ...prev, isListened: true } : null));
        }
      };
    }

    receivedAudioPlayerRef.current
      .play()
      .then(() => setIsPlayingReceived(true))
      .catch(() => setIsPlayingReceived(false));

    if (!whisper.isListened) {
      markWhisperListened(whisper.id);
      setWhisper((prev) => (prev ? { ...prev, isListened: true } : null));
    }
  };

  // Playback Handler for Sent Whisper (Confirm what was sent)
  const handleTogglePlaySent = () => {
    if (!sentWhisper) return;

    if (isPlayingSent && sentAudioPlayerRef.current) {
      sentAudioPlayerRef.current.pause();
      setIsPlayingSent(false);
      return;
    }

    // Stop received playback if playing
    if (receivedAudioPlayerRef.current) {
      receivedAudioPlayerRef.current.pause();
      setIsPlayingReceived(false);
    }

    triggerHaptic("selection");

    if (!sentAudioPlayerRef.current) {
      const audio = new Audio(sentWhisper.audioData);
      sentAudioPlayerRef.current = audio;

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setSentProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.onended = () => {
        setIsPlayingSent(false);
        setSentProgress(100);
      };
    }

    sentAudioPlayerRef.current
      .play()
      .then(() => setIsPlayingSent(true))
      .catch(() => setIsPlayingSent(false));
  };

  // Push-to-Talk Start
  const handleStartRecord = async (e: React.TouchEvent | React.MouseEvent) => {
    if ("touches" in e && e.cancelable) {
      e.preventDefault();
    }

    if (isRecording || isSending || isTestingMic) return;
    setRecordError(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setRecordError("Microphone access is not supported on this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const types = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/aac",
        "audio/ogg",
      ];
      const mimeType = types.find((t) => MediaRecorder.isTypeSupported(t)) || "";

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setRecordSeconds(0);
      triggerHaptic("medium");

      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((prev) => {
          if (prev >= 15) {
            handleStopRecord();
            return 15;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      setRecordError("Microphone permission denied. Please enable mic access in browser settings.");
      stopRecordingCleanup();
    }
  };

  // Push-to-Talk Stop & Send
  const handleStopRecord = useCallback(async () => {
    if (!isRecording || !mediaRecorderRef.current) return;

    const duration = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }

    const recorder = mediaRecorderRef.current;

    recorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: recorder.mimeType || "audio/webm",
      });

      if (duration < 1 || audioBlob.size < 800) {
        setRecordError("Hold button a little longer to speak.");
        stopRecordingCleanup();
        return;
      }

      setIsSending(true);

      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        try {
          const res = await sendVoiceWhisper(base64data, duration);
          if (res.success) {
            triggerHaptic("success");
            onWhisperSent?.();
            loadWhispers();
            // Clear current audio players so fresh audio plays if needed
            sentAudioPlayerRef.current = null;
          } else {
            setRecordError(res.error || "Failed to send whisper");
          }
        } finally {
          setIsSending(false);
          stopRecordingCleanup();
        }
      };
    };

    recorder.stop();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, [isRecording, onWhisperSent, loadWhispers]);

  // SELF-TEST: 3-Second Mic & Speaker Verification
  const runMicSelfTest = async () => {
    if (isTestingMic || isRecording) return;
    setRecordError(null);
    setIsTestingMic(true);
    setTestPhase("recording");
    setTestCountdown(3);
    triggerHaptic("medium");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setRecordError("Mic not supported on this browser.");
        setIsTestingMic(false);
        setTestPhase("idle");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"];
      const mimeType = types.find((t) => MediaRecorder.isTypeSupported(t)) || "";
      const testRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];

      testRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      testRecorder.start();

      let secondsLeft = 3;
      const timer = setInterval(() => {
        secondsLeft -= 1;
        setTestCountdown(secondsLeft);
        if (secondsLeft <= 0) {
          clearInterval(timer);
          testRecorder.stop();
          stream.getTracks().forEach((t) => t.stop());
        }
      }, 1000);

      testRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: testRecorder.mimeType || "audio/webm" });
        const testAudioUrl = URL.createObjectURL(blob);
        setTestPhase("playing");
        triggerHaptic("light");

        const audio = new Audio(testAudioUrl);
        testAudioPlayerRef.current = audio;
        audio.play().catch(() => {});
        audio.onended = () => {
          setTestPhase("success");
          triggerHaptic("success");
          setTimeout(() => {
            setIsTestingMic(false);
            setTestPhase("idle");
          }, 3500);
        };
      };
    } catch {
      setRecordError("Microphone blocked. Please grant microphone permission to test.");
      setIsTestingMic(false);
      setTestPhase("idle");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-white border border-[#EAE6DE] shadow-2xl p-5 sm:p-6 space-y-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#EAE6DE] flex items-center justify-center text-sm shadow-2xs">
              📻
            </span>
            <div>
              <h2 className="font-serif text-base font-bold text-[#1E1A18] tracking-tight">
                Walkie-Talkie
              </h2>
              <p className="text-[11px] text-[#554B45] font-medium">
                Voice whisper with {partnerName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#EAE6DE] text-[#554B45] hover:text-[#1E1A18] flex items-center justify-center text-xs transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* 1. Partner's Received Whisper (If Available) */}
        {whisper && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FFF5F6] to-white border border-[#FAD4DA] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#1E1A18] flex items-center gap-1.5">
                <span>{whisper.senderName}</span>
                {!whisper.isListened && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#BA3F4A] text-white text-[9px] font-bold animate-pulse">
                    NEW
                  </span>
                )}
              </span>
              <span className="text-[10px] text-[#554B45] font-medium">
                {whisper.durationSec}s whisper
              </span>
            </div>

            {/* Playback Row */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTogglePlayReceived}
                className="w-10 h-10 rounded-full bg-[#BA3F4A] hover:bg-[#AB3B46] text-white flex items-center justify-center text-sm shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                {isPlayingReceived ? "⏸" : "▶"}
              </button>

              <div className="flex-1 space-y-1">
                <div className="h-5 flex items-center gap-1">
                  {[40, 70, 90, 50, 100, 60, 80, 45, 95, 65, 30, 85].map((h, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-200 ${
                        isPlayingReceived ? "bg-[#BA3F4A] animate-pulse" : "bg-[#EAE6DE]"
                      }`}
                      style={{
                        height: isPlayingReceived
                          ? `${Math.max(25, h * Math.random() + 20)}%`
                          : `${h * 0.4}%`,
                      }}
                    />
                  ))}
                </div>
                <div className="w-full bg-[#EAE6DE] h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-[#BA3F4A] h-full transition-all duration-100"
                    style={{ width: `${receivedProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Self-Test / Verification Box */}
        {isTestingMic ? (
          <div className="p-3 rounded-2xl bg-[#FFFBF0] border border-[#FEF3D6] text-center space-y-2 animate-in fade-in">
            {testPhase === "recording" && (
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#8E5E1E]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E06D75] animate-ping" />
                  <span>Speaking into mic... {testCountdown}s</span>
                </div>
                <p className="text-[11px] text-[#554B45]">Say &ldquo;Hello testing 1 2 3!&rdquo;</p>
              </div>
            )}
            {testPhase === "playing" && (
              <div className="space-y-1">
                <div className="text-xs font-bold text-[#8E5E1E] flex items-center justify-center gap-1.5">
                  <span>🔊</span>
                  <span>Playing back your voice...</span>
                </div>
                <p className="text-[11px] text-[#554B45]">Listen through your speaker right now</p>
              </div>
            )}
            {testPhase === "success" && (
              <div className="space-y-0.5 text-xs font-bold text-[#557567] bg-[#F4F7F5] p-2 rounded-xl border border-[#E5EEE9]">
                <div>✅ Mic &amp; Audio Working Loud &amp; Clear!</div>
                <div className="text-[10px] text-[#554B45] font-normal">
                  Your hardware is 100% ready for Walkie-Talkie.
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] text-[#554B45] font-medium flex items-center gap-1">
              <span>●</span>
              <span>Hardware check:</span>
            </span>
            <button
              type="button"
              onClick={runMicSelfTest}
              className="text-[11px] font-bold text-[#BA3F4A] hover:text-[#1E1A18] underline underline-offset-2 flex items-center gap-1 cursor-pointer"
            >
              <span>🧪 Test Mic &amp; Audio (3s)</span>
            </button>
          </div>
        )}

        {/* 3. Push-to-Talk Record Section */}
        <div className="text-center space-y-3 pt-1">
          <div className="relative flex items-center justify-center py-2">
            {/* Pulsing ring when recording */}
            {isRecording && (
              <>
                <div className="absolute w-32 h-32 rounded-full border-2 border-[#BA3F4A]/50 animate-ping pointer-events-none" />
                <div className="absolute w-28 h-28 rounded-full bg-[#BA3F4A]/15 animate-pulse pointer-events-none" />
              </>
            )}

            {/* Big Push-to-Talk Button */}
            <button
              type="button"
              onTouchStart={handleStartRecord}
              onTouchEnd={handleStopRecord}
              onTouchCancel={handleStopRecord}
              onMouseDown={handleStartRecord}
              onMouseUp={handleStopRecord}
              onMouseLeave={() => {
                if (isRecording) handleStopRecord();
              }}
              disabled={isSending || isTestingMic}
              className={`relative w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-200 select-none shadow-md cursor-pointer ${
                isRecording
                  ? "bg-[#BA3F4A] text-white scale-105 shadow-[0_0_30px_rgba(186,63,74,0.45)]"
                  : "bg-linear-to-br from-[#1E1A18] to-[#2E2825] hover:from-[#BA3F4A] hover:to-[#B43A47] text-white active:scale-95"
              }`}
            >
              <span className="text-2xl">{isRecording ? "🎙️" : "📻"}</span>
              <span className="text-[10px] font-bold mt-1 tracking-tight">
                {isRecording ? `${recordSeconds}s` : "HOLD"}
              </span>
            </button>
          </div>

          <p className="text-xs font-semibold text-[#554B45]">
            {isSending
              ? "Sending whisper to " + partnerName + "..."
              : isRecording
              ? "Recording whisper... Release to send!"
              : "Press & hold to speak, release to send"}
          </p>

          {recordError && (
            <div className="text-[11px] text-[#BA3F4A] font-medium bg-[#FFF2F4] border border-[#FAD4DA] px-3 py-1.5 rounded-xl">
              {recordError}
            </div>
          )}
        </div>

        {/* 4. Sent Whisper Confirmation (Replay what user just sent) */}
        {sentWhisper && (
          <div className="p-2.5 rounded-2xl bg-[#FAF7F2] border border-[#EAE6DE] flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1 text-left">
              <div className="text-[11px] font-bold text-[#1E1A18] truncate flex items-center gap-1.5">
                <span>Your last whisper</span>
                <span className="text-[10px] text-[#557567] bg-[#F4F7F5] px-1.5 py-0.2 rounded border border-[#E5EEE9]">
                  {sentWhisper.isListened ? "Listened by partner ✓" : "Delivered ✓"}
                </span>
              </div>
              <div className="text-[10px] text-[#554B45]">
                {sentWhisper.durationSec}s voice message
              </div>
            </div>

            <button
              type="button"
              onClick={handleTogglePlaySent}
              className="px-2.5 py-1 rounded-xl bg-white border border-[#EAE6DE] hover:border-[#BA3F4A] text-xs font-bold text-[#1E1A18] hover:text-[#BA3F4A] shrink-0 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>{isPlayingSent ? "⏸ Pause" : "▶ Replay"}</span>
            </button>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-2 border-t border-[#EAE6DE]/60 text-center">
          <p className="text-[10px] text-[#6B615A]">
            Max 15 seconds · Instant encrypted couple micro-notes
          </p>
        </div>
      </div>
    </div>
  );
}
