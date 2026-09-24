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
  // Listen State
  const [whisper, setWhisper] = useState<VoiceWhisperItem | null>(initialWhisper);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);

  // Record State
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);

  // Load latest whisper when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (initialWhisper) {
      setWhisper(initialWhisper);
    } else {
      getLatestVoiceWhisper().then((res) => {
        if (res.success && res.whisper) {
          setWhisper(res.whisper);
        }
      });
    }
  }, [isOpen, initialWhisper]);

  // Teardown when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      setIsPlaying(false);
      setPlayProgress(0);
      setRecordError(null);
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

  // Playback Handler
  const handlePlayToggle = () => {
    if (!whisper) return;

    if (isPlaying && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
      return;
    }

    triggerHaptic("selection");

    if (!audioPlayerRef.current) {
      const audio = new Audio(whisper.audioData);
      audioPlayerRef.current = audio;

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setPlayProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.onended = () => {
        setIsPlaying(false);
        setPlayProgress(100);
        if (!whisper.isListened) {
          markWhisperListened(whisper.id);
          setWhisper((prev) => (prev ? { ...prev, isListened: true } : null));
        }
      };
    }

    audioPlayerRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        setIsPlaying(false);
      });

    if (!whisper.isListened) {
      markWhisperListened(whisper.id);
      setWhisper((prev) => (prev ? { ...prev, isListened: true } : null));
    }
  };

  // Push-to-Talk Start
  const handleStartRecord = async (e: React.TouchEvent | React.MouseEvent) => {
    if ("touches" in e && e.cancelable) {
      e.preventDefault();
    }

    if (isRecording || isSending) return;
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
      setRecordError("Microphone permission denied. Please allow mic access.");
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

      if (duration < 1 || audioBlob.size < 1000) {
        setRecordError("Hold longer to record a whisper.");
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
            onClose();
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
  }, [isRecording, onWhisperSent, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-fade-in">
      <div className="relative w-full max-w-sm rounded-3xl bg-white border border-[#EAE6DE] shadow-xl p-5 sm:p-6 space-y-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#EAE6DE] flex items-center justify-center text-sm">
              📻
            </span>
            <div>
              <h2 className="font-serif text-base font-bold text-[#1E1A18] tracking-tight">
                Walkie-Talkie
              </h2>
              <p className="text-[11px] text-[#756963]">
                Voice whisper with {partnerName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF7F2] hover:bg-[#EAE6DE] text-[#756963] flex items-center justify-center text-xs transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Incoming/Latest Whisper Player */}
        {whisper && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FAF7F2] to-white border border-[#EAE6DE] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#1E1A18] flex items-center gap-1.5">
                <span>{whisper.senderName}</span>
                {!whisper.isListened && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#FF4B72] text-white text-[9px] font-bold">
                    NEW
                  </span>
                )}
              </span>
              <span className="text-[10px] text-[#756963]">
                {whisper.durationSec}s voice whisper
              </span>
            </div>

            {/* Audio Waveform Row */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePlayToggle}
                className="w-10 h-10 rounded-full bg-[#1E1A18] hover:bg-[#AB3B46] text-white flex items-center justify-center text-sm shadow-xs transition-all active:scale-95 shrink-0"
              >
                {isPlaying ? "⏸" : "▶"}
              </button>

              <div className="flex-1 space-y-1">
                {/* Visualizer bars */}
                <div className="h-5 flex items-center gap-1">
                  {[40, 70, 90, 50, 100, 60, 80, 45, 95, 65, 30, 85].map((h, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full transition-all duration-200 ${
                        isPlaying
                          ? "bg-[#AB3B46] animate-pulse"
                          : "bg-[#EAE6DE]"
                      }`}
                      style={{
                        height: isPlaying ? `${Math.max(20, (h * Math.random() + 20))}%` : `${h * 0.4}%`,
                      }}
                    />
                  ))}
                </div>

                {/* Progress track */}
                <div className="w-full bg-[#EAE6DE] h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-[#AB3B46] h-full transition-all duration-100"
                    style={{ width: `${playProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Push-to-Talk Record Section */}
        <div className="text-center space-y-3 pt-1">
          <div className="relative flex items-center justify-center py-2">
            {/* Pulsing ring when recording */}
            {isRecording && (
              <>
                <div className="absolute w-32 h-32 rounded-full border-2 border-[#FF4B72]/50 animate-ping pointer-events-none" />
                <div className="absolute w-28 h-28 rounded-full bg-[#FF4B72]/15 animate-pulse pointer-events-none" />
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
              disabled={isSending}
              className={`relative w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-200 select-none shadow-md cursor-pointer ${
                isRecording
                  ? "bg-[#FF4B72] text-white scale-105 shadow-[0_0_30px_rgba(255,75,114,0.45)]"
                  : "bg-gradient-to-br from-[#1E1A18] to-[#2E2825] hover:from-[#AB3B46] hover:to-[#B43A47] text-white active:scale-95"
              }`}
            >
              <span className="text-2xl">{isRecording ? "🎙️" : "📻"}</span>
              <span className="text-[10px] font-bold mt-1 tracking-tight">
                {isRecording ? `${recordSeconds}s` : "HOLD"}
              </span>
            </button>
          </div>

          <p className="text-xs font-medium text-[#756963]">
            {isSending
              ? "Sending whisper to " + partnerName + "..."
              : isRecording
              ? "Recording whisper... Release to send!"
              : "Press & hold to speak, release to send"}
          </p>

          {recordError && (
            <div className="text-[11px] text-[#AB3B46] font-medium bg-[#FCEBEE] px-3 py-1.5 rounded-xl">
              {recordError}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-[#EAE6DE]/60 text-center">
          <p className="text-[10px] text-[#A89F99]">
            Max 15 seconds · Instant voice micro-notes
          </p>
        </div>
      </div>
    </div>
  );
}
