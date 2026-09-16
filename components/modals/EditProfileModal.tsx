"use client";

import React, { useState, useEffect } from "react";
import { ModalSheet } from "@/components/ui/ModalSheet";
import { PillButton } from "@/components/ui/PillButton";
import { Avatar } from "@/components/ui/Avatar";
import { updateProfile, getProfile } from "@/actions/profile";

const EMOJI_AVATARS = ["🧔", "🧑", "👧", "🦁", "🐱", "🐻", "🌸", "☕", "✨", "🦊"];

export interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentAvatar: string | null;
  onUpdated: (name: string, avatar: string) => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  currentName,
  currentAvatar,
  onUpdated,
}: EditProfileModalProps) {
  const [name, setName] = useState(currentName);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(currentAvatar);
  const [googlePhoto, setGooglePhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setSelectedAvatar(currentAvatar);
      getProfile().then((res) => {
        if (res.success && res.user?.image) {
          setGooglePhoto(res.user.image);
        }
      });
    }
  }, [isOpen, currentName, currentAvatar]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const chosen = selectedAvatar || "✨";
    const res = await updateProfile(name, chosen);
    setLoading(false);
    if (res.success) {
      onUpdated(name, chosen);
      onClose();
    }
  };

  return (
    <ModalSheet isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4 py-1 text-left text-xs">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-[#FDFBF7] border-2 border-[#E06D75]/30 shadow-xs flex items-center justify-center mx-auto overflow-hidden">
            <Avatar
              avatar={selectedAvatar || "✨"}
              name={name}
              fallback="✨"
              size="lg"
              className="w-full h-full"
            />
          </div>
          <h3 className="font-serif text-xl font-bold text-[#24201D]">Edit Profile</h3>
          <p className="text-xs text-[#756963]">
            Choose how you appear in your space.
          </p>
        </div>

        <div>
          <label className="block font-semibold text-[#24201D] mb-1">Display Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name or nickname"
            className="w-full px-3 py-2 bg-white border border-[#EAE6DE] rounded-xl text-xs text-[#24201D] focus:outline-none focus:ring-1 focus:ring-[#E06D75]"
          />
        </div>

        <div>
          <label className="block font-semibold text-[#24201D] mb-1.5">Profile Picture</label>

          {googlePhoto && (
            <button
              type="button"
              onClick={() => setSelectedAvatar(googlePhoto)}
              className={`w-full p-2 mb-2 rounded-xl flex items-center justify-between border transition-all ${
                selectedAvatar === googlePhoto
                  ? "bg-[#FCEBEE] border-[#E06D75] shadow-xs"
                  : "bg-white border-[#EAE6DE] hover:border-[#E06D75]/50"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Avatar
                  avatar={googlePhoto}
                  fallback="👤"
                  size="sm"
                  className="w-7 h-7 rounded-lg"
                />
                <span className="text-[11px] font-semibold text-[#24201D]">
                  Use Google Profile Photo
                </span>
              </div>
              {selectedAvatar === googlePhoto ? (
                <span className="w-4 h-4 rounded-full bg-[#E06D75] text-white flex items-center justify-center text-[9px] font-bold">
                  ✓
                </span>
              ) : (
                <span className="w-4 h-4 rounded-full border border-[#EAE6DE]" />
              )}
            </button>
          )}

          <div className="grid grid-cols-5 gap-1.5 pt-1">
            {EMOJI_AVATARS.map((emoji) => {
              const active = selectedAvatar === emoji;
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedAvatar(emoji)}
                  className={`h-9 rounded-xl text-base flex items-center justify-center transition-all ${
                    active
                      ? "bg-[#FCEBEE] border-2 border-[#E06D75] shadow-xs scale-105"
                      : "bg-white border border-[#EAE6DE] hover:border-[#E06D75]"
                  }`}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 flex gap-2">
          <PillButton
            variant="secondary"
            size="md"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </PillButton>
          <PillButton
            variant="primary"
            size="md"
            className="flex-1"
            loading={loading}
            onClick={handleSave}
          >
            Save Changes
          </PillButton>
        </div>
      </div>
    </ModalSheet>
  );
}
