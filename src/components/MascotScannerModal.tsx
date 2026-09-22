import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Upload, Camera, Sparkles, X, Check, Loader2, Wand2 } from 'lucide-react';
import { Mascot } from '../types';
import { MascotAvatar } from './MascotAvatar';
import { SoundEngine } from '../utils/sound';
import confetti from 'canvas-confetti';

interface MascotScannerModalProps {
  isOpen: boolean;
  onMascotCreated: (newMascot: Mascot) => void;
  onClose: () => void;
}

export const MascotScannerModal: React.FC<MascotScannerModalProps> = ({
  isOpen,
  onMascotCreated,
  onClose,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isScanning, setIsScanning] = useState(false);
  const [createdMascot, setCreatedMascot] = useState<Mascot | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleScanPhoto = async () => {
    if (!selectedImage) return;

    setIsScanning(true);
    setErrorMsg(null);
    SoundEngine.playBoardHop();

    try {
      const response = await fetch('/api/mascot/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image with Gemini');
      }

      const data = await response.json();
      const raw = data.mascot;

      const newMascot: Mascot = {
        id: `custom-${Date.now()}`,
        name: raw.name || 'Nova-Fuzz',
        title: 'Custom AI Mascot',
        personality: raw.personality || 'Energetic and full of cosmic sparkle!',
        hairColors: Array.isArray(raw.hairColors) && raw.hairColors.length > 0
          ? raw.hairColors
          : ['#00f0ff', '#ff007f', '#ffe600'],
        furColor: raw.furColor || '#8b5cf6',
        eyesColor: raw.eyesColor || '#00ffff',
        earStyle: 'bunny',
        voiceName: 'Kore',
        uniqueAbility: {
          name: raw.uniqueAbility?.name || 'Prism Burst',
          description: raw.uniqueAbility?.description || 'Slows puzzle timer by 25% for high combos.',
          effectType: raw.uniqueAbility?.effectType || 'slow_time',
          multiplier: 1.3,
        },
        level: 1,
        cheerQuote: raw.cheerQuote || 'Together we shine at maximum neon intensity!',
        originStory: raw.originStory || 'Synthesized from your uploaded photo using Gemini 3.1 Pro.',
        isCustom: true,
        customPhotoUrl: selectedImage,
      };

      setCreatedMascot(newMascot);
      SoundEngine.playUpgradeFanfare();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Could not process photo with Gemini 3.1 Pro. Please try another image.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleAdopt = () => {
    if (createdMascot) {
      onMascotCreated(createdMascot);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm rounded-3xl bg-[#0a0d24] border-2 border-cyan-500/50 p-5 shadow-[0_0_50px_rgba(0,240,255,0.3)] flex flex-col relative overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">AI Mascot Scanner</h3>
            <p className="text-[11px] text-cyan-300">
              Powered by <strong className="text-white">Gemini 3.1 Pro</strong> Image Analysis
            </p>
          </div>
        </div>

        {/* Result Screen or Upload Screen */}
        {createdMascot ? (
          <div className="flex flex-col items-center text-center">
            {/* Mascot Preview Card */}
            <div className="w-full p-4 rounded-2xl bg-gradient-to-b from-indigo-950/80 to-slate-900 border border-cyan-500/30 mb-3 flex flex-col items-center">
              <MascotAvatar mascot={createdMascot} size="lg" isDancing={true} />
              <h4 className="text-lg font-black text-white mt-2">{createdMascot.name}</h4>
              <p className="text-xs text-fuchsia-300 font-bold mb-2">"{createdMascot.personality}"</p>

              {/* Unique Ability Badge */}
              <div className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-left">
                <div className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1 mb-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Unique Superpower: {createdMascot.uniqueAbility.name}</span>
                </div>
                <div className="text-[11px] text-slate-300 leading-tight">
                  {createdMascot.uniqueAbility.description}
                </div>
              </div>

              {/* Multicolored Hair Swatches */}
              <div className="flex items-center gap-1.5 mt-3">
                <span className="text-[10px] text-slate-400 font-bold">Hair Palette:</span>
                {createdMascot.hairColors.map((color, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-full border border-white/50 shadow"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={handleAdopt}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all"
            >
              Adopt & Equip Mascot
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* Photo Upload Area */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-cyan-500/40 bg-slate-950/60 hover:bg-slate-900/60 transition-all flex flex-col items-center justify-center p-4 cursor-pointer relative overflow-hidden group mb-3"
            >
              {selectedImage ? (
                <>
                  <img
                    src={selectedImage}
                    alt="Upload Preview"
                    className="w-full h-full object-cover rounded-xl"
                  />
                  {isScanning && (
                    <div className="absolute inset-0 bg-cyan-950/60 backdrop-blur-xs flex flex-col items-center justify-center">
                      <motion.div
                        animate={{ y: [-30, 30, -30] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-full h-1 bg-cyan-400 shadow-[0_0_15px_#00f0ff]"
                      />
                      <Loader2 className="w-8 h-8 text-cyan-300 animate-spin mt-3" />
                      <span className="text-xs font-black text-cyan-200 uppercase tracking-wider mt-2">
                        Gemini 3.1 Pro Synthesizing...
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-white mb-1">
                    Upload Pet, Plushie, or Selfie
                  </span>
                  <span className="text-[10px] text-slate-400 max-w-[200px]">
                    Gemini transforms your photo into a custom fuzzy neon mascot with special powers!
                  </span>
                </div>
              )}
            </div>

            {errorMsg && (
              <p className="text-[11px] text-rose-400 font-bold mb-3 text-center">
                {errorMsg}
              </p>
            )}

            {/* Scan Action Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleScanPhoto}
              disabled={!selectedImage || isScanning}
              className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
                !selectedImage || isScanning
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-pink-500 text-slate-950 hover:brightness-110'
              }`}
            >
              <Wand2 className="w-4 h-4" />
              <span>{isScanning ? 'Analyzing Photo...' : 'Scan & Create Fuzzy Mascot'}</span>
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
