import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Download,
  FileArchive,
  CheckCircle2,
  X,
  FolderCode,
  Sparkles,
  HardDriveDownload,
  Smartphone,
  Copy,
  Check,
  PackageCheck,
} from 'lucide-react';

interface ZipFileEntry {
  path: string;
  bytes: number;
}

interface ZipExportInfo {
  filename: string;
  fileCount: number;
  sizeBytes: number;
  files: Array<ZipFileEntry | string>;
  base64Zip: string;
}

type AndroidBuildType = 'release' | 'debug';
type AndroidProductFlavor = 'playstore' | 'staging';

interface AabExportInfo {
  filename: string;
  variantName: string;
  gradleTask: string;
  buildType: AndroidBuildType;
  flavor: AndroidProductFlavor;
  debuggable: boolean;
  packageId: string;
  appName: string;
  versionName: string;
  versionCode: number;
  fileCount: number;
  sizeBytes: number;
  files: Array<ZipFileEntry | string>;
  base64Aab: string;
}

interface AppZipExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast?: (message: string, color: string) => void;
}

export const AppZipExportModal: React.FC<AppZipExportModalProps> = ({
  isOpen,
  onClose,
  onToast,
}) => {
  const [activeMode, setActiveMode] = useState<'aab' | 'zip'>('aab');
  const [flavor, setFlavor] = useState<AndroidProductFlavor>('playstore');
  const [buildType, setBuildType] = useState<AndroidBuildType>('release');
  const [zipInfo, setZipInfo] = useState<ZipExportInfo | null>(null);
  const [aabInfo, setAabInfo] = useState<AabExportInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hasDownloadedAab, setHasDownloadedAab] = useState(false);
  const [hasDownloadedZip, setHasDownloadedZip] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const originUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-pre-3cwhq6kmkpw6nwxbpfaxgp-464573425992.us-west1.run.app';

  const variantQuery = `flavor=${flavor}&buildType=${buildType}`;
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const activeVariantName = `${flavor}${capitalize(buildType)}`;
  const activeGradleTask = `bundle${capitalize(flavor)}${capitalize(buildType)}`;
  const activePackageId = `com.neonfuzz.boardempire${flavor === 'staging' ? '.staging' : ''}${
    buildType === 'debug' ? '.debug' : ''
  }`;
  const activeAabFilename = `neon-fuzz-${flavor}-${buildType}.aab`;
  const activeKitFilename = `neon-fuzz-android-studio-${flavor}-${buildType}-kit.zip`;

  const aabDirectUrl = `${originUrl}/api/export-aab?${variantQuery}`;
  const androidProjectDirectUrl = `${originUrl}/api/export-android-project?${variantQuery}`;
  const zipDirectUrl = `${originUrl}/api/export-zip`;

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const loadAabVariant = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      setHasDownloadedAab(false);
      try {
        const requests: Promise<Response>[] = [fetch(`/api/export-aab-info?${variantQuery}`)];
        if (!zipInfo) {
          requests.push(fetch('/api/export-zip-info'));
        }
        const [aabRes, zipRes] = await Promise.all(requests);
        if (aabRes.ok) {
          const aabData: AabExportInfo = await aabRes.json();
          if (!cancelled) setAabInfo(aabData);
        }
        if (zipRes && zipRes.ok) {
          const zipData: ZipExportInfo = await zipRes.json();
          if (!cancelled) setZipInfo(zipData);
        }
      } catch (err: any) {
        if (!cancelled) {
          setErrorMsg(err?.message || 'Using direct stream endpoints.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadAabVariant();
    return () => {
      cancelled = true;
    };
  }, [isOpen, variantQuery]);

  const triggerAabDownload = () => {
    const downloadName = aabInfo?.filename || activeAabFilename;
    if (
      aabInfo?.base64Aab &&
      aabInfo.flavor === flavor &&
      aabInfo.buildType === buildType
    ) {
      try {
        const binaryString = window.atob(aabInfo.base64Aab);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/x-authorware-bin' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        setHasDownloadedAab(true);
        onToast?.(`🤖 Downloading ${downloadName}!`, '#10b981');
        return;
      } catch (e) {
        // Fallback to direct anchor
      }
    }

    const a = document.createElement('a');
    a.href = `/api/export-aab?${variantQuery}`;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setHasDownloadedAab(true);
    onToast?.(`🤖 Downloading ${downloadName}!`, '#10b981');
  };

  const triggerAndroidStudioKitDownload = () => {
    const a = document.createElement('a');
    a.href = `/api/export-android-project?${variantQuery}`;
    a.download = activeKitFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onToast?.(`📦 Downloading ${activeKitFilename}!`, '#00f0ff');
  };

  const triggerZipDownload = () => {
    if (zipInfo?.base64Zip) {
      try {
        const binaryString = window.atob(zipInfo.base64Zip);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/zip' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = zipInfo.filename || 'neon-fuzz-app-source.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        setHasDownloadedZip(true);
        onToast?.('📦 Downloading neon-fuzz-app-source.zip!', '#10b981');
        return;
      } catch (e) {
        // Fallback to direct anchor
      }
    }

    const a = document.createElement('a');
    a.href = '/api/export-zip';
    a.download = 'neon-fuzz-app-source.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setHasDownloadedZip(true);
    onToast?.('📦 Downloading neon-fuzz-app-source.zip!', '#10b981');
  };

  const handleCopyUrl = (url: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopiedLink(label);
    onToast?.(`🔗 Copied ${label} link!`, '#34d399');
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  const activeFiles = activeMode === 'aab' ? aabInfo?.files || [] : zipInfo?.files || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="w-full max-w-md rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-2 border-emerald-400/60 shadow-[0_0_45px_rgba(16,185,129,0.3)] overflow-hidden flex flex-col max-h-[88vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-emerald-950/90 via-teal-950/80 to-slate-900 border-b border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center shadow-inner">
                  {activeMode === 'aab' ? (
                    <Smartphone className="w-6 h-6 text-emerald-300" />
                  ) : (
                    <FileArchive className="w-6 h-6 text-cyan-300" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-black text-white tracking-tight">
                      {activeMode === 'aab'
                        ? 'Android .AAB Package'
                        : 'App Source ZIP Package'}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                      {activeMode === 'aab' ? activeVariantName : 'Ready'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {activeMode === 'aab'
                      ? `Google Play App Bundle (${activePackageId})`
                      : 'Complete React + Three.js PBR + Express TypeScript project'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="px-5 pt-3 flex gap-2">
              <button
                onClick={() => setActiveMode('aab')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  activeMode === 'aab'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android .AAB</span>
              </button>
              <button
                onClick={() => setActiveMode('zip')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                  activeMode === 'zip'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <FileArchive className="w-3.5 h-3.5" />
                <span>Source .ZIP</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {activeMode === 'aab' ? (
                <>
                  {/* Android AAB Card */}
                  <div className="rounded-2xl bg-slate-900/90 border border-emerald-500/40 p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <PackageCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs font-black text-white truncate">
                          {aabInfo?.filename || activeAabFilename}
                        </span>
                      </div>
                      {aabInfo && (
                        <span className="text-[11px] font-black text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 rounded-lg shrink-0">
                          {formatBytes(aabInfo.sizeBytes)} • v{aabInfo.versionName}
                        </span>
                      )}
                    </div>

                    {/* Bundle Variant Selector (Product Flavor + Build Type) */}
                    <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Bundle Variant
                        </span>
                        <span className="font-mono text-[10px] font-bold text-amber-300">
                          gradle {activeGradleTask}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold uppercase text-slate-500 block">
                            Product Flavor
                          </span>
                          <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-slate-900 border border-slate-800">
                            <button
                              type="button"
                              onClick={() => setFlavor('playstore')}
                              className={`py-1 px-1.5 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                                flavor === 'playstore'
                                  ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/50'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Play Store
                            </button>
                            <button
                              type="button"
                              onClick={() => setFlavor('staging')}
                              className={`py-1 px-1.5 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                                flavor === 'staging'
                                  ? 'bg-amber-500/25 text-amber-200 border border-amber-400/50'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Staging
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-bold uppercase text-slate-500 block">
                            Build Type
                          </span>
                          <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-slate-900 border border-slate-800">
                            <button
                              type="button"
                              onClick={() => setBuildType('release')}
                              className={`py-1 px-1.5 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                                buildType === 'release'
                                  ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Release
                            </button>
                            <button
                              type="button"
                              onClick={() => setBuildType('debug')}
                              className={`py-1 px-1.5 rounded-md text-[10px] font-black transition-all cursor-pointer ${
                                buildType === 'debug'
                                  ? 'bg-fuchsia-500/25 text-fuchsia-200 border border-fuchsia-400/50'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Debug
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                      <div className="min-w-0">
                        <span className="text-slate-400 block">Application ID:</span>
                        <span className="font-mono font-bold text-emerald-300 truncate block">
                          {aabInfo?.packageId || activePackageId}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">WebView / Debuggable:</span>
                        <span className="font-mono font-bold text-cyan-300">
                          {buildType === 'debug' ? 'Enabled (DevTools)' : 'Release Locked'}
                        </span>
                      </div>
                    </div>

                    {/* Primary AAB Download Button */}
                    <button
                      onClick={triggerAabDownload}
                      disabled={isLoading}
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:brightness-110 active:scale-98 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      <Download className="w-4 h-4 stroke-[2.5]" />
                      <span>
                        {isLoading
                          ? `Packaging ${activeAabFilename}...`
                          : hasDownloadedAab
                          ? `Download ${activeAabFilename} Again`
                          : `Download ${activeVariantName} .AAB`}
                      </span>
                    </button>

                    {/* Secondary Android Studio Gradle Signing Kit */}
                    <button
                      onClick={triggerAndroidStudioKitDownload}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-400 text-cyan-200 font-bold text-[11px] flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <FolderCode className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Download Android Studio Gradle Kit ({activeVariantName})</span>
                    </button>

                    {/* Copyable Direct Links */}
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Direct Package Download Links:
                      </div>

                      <div className="flex items-center justify-between gap-2 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
                        <a
                          href={`/api/export-aab?${variantQuery}`}
                          download={activeAabFilename}
                          className="font-mono text-[10px] text-emerald-400 hover:underline truncate"
                        >
                          {aabDirectUrl}
                        </a>
                        <button
                          onClick={() => handleCopyUrl(aabDirectUrl, '.AAB')}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[9px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          {copiedLink === '.AAB' ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedLink === '.AAB' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-2 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
                        <a
                          href={`/api/export-android-project?${variantQuery}`}
                          download={activeKitFilename}
                          className="font-mono text-[10px] text-cyan-400 hover:underline truncate"
                        >
                          {androidProjectDirectUrl}
                        </a>
                        <button
                          onClick={() => handleCopyUrl(androidProjectDirectUrl, 'Android Kit')}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[9px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          {copiedLink === 'Android Kit' ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedLink === 'Android Kit' ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Source ZIP Card */}
                  <div className="rounded-2xl bg-slate-900/90 border border-cyan-500/40 p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FolderCode className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-black text-white">
                          {zipInfo?.filename || 'neon-fuzz-app-source.zip'}
                        </span>
                      </div>
                      {zipInfo && (
                        <span className="text-[11px] font-black text-cyan-300 bg-cyan-950/80 border border-cyan-500/40 px-2.5 py-0.5 rounded-lg">
                          {formatBytes(zipInfo.sizeBytes)} • {zipInfo.fileCount} files
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Includes your full game source code, standalone 3D Town &amp; 3D Borough graphics engine (<code className="text-cyan-300">threeGraphicsEngine.ts</code>), custom shaders/PBR textures, mascots, puzzle arcade, and server configuration.
                    </p>

                    <button
                      onClick={triggerZipDownload}
                      disabled={isLoading}
                      className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 hover:brightness-110 active:scale-98 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      <Download className="w-4 h-4 stroke-[2.5]" />
                      <span>
                        {isLoading
                          ? 'Building ZIP Archive...'
                          : hasDownloadedZip
                          ? 'Download ZIP Again (neon-fuzz-app-source.zip)'
                          : 'Download App Source ZIP'}
                      </span>
                    </button>

                    <div className="flex items-center justify-between gap-2 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
                      <a
                        href="/api/export-zip"
                        download="neon-fuzz-app-source.zip"
                        className="font-mono text-[10px] text-cyan-400 hover:underline truncate"
                      >
                        {zipDirectUrl}
                      </a>
                      <button
                        onClick={() => handleCopyUrl(zipDirectUrl, 'ZIP')}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[9px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        {copiedLink === 'ZIP' ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedLink === 'ZIP' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-[11px] text-amber-200">
                  Direct download endpoints active (<code className="text-white">/api/export-aab</code> &amp; <code className="text-white">/api/export-zip</code>).
                </div>
              )}

              {/* Included Bundle Entries List */}
              {activeFiles.length > 0 && (
                <div className="rounded-2xl bg-slate-900/70 border border-slate-800/90 p-3.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>
                        {activeMode === 'aab'
                          ? `Bundled AAB Modules & WebGL Assets (${activeFiles.length})`
                          : `Included Source Files (${activeFiles.length})`}
                      </span>
                    </span>
                    {(hasDownloadedAab || hasDownloadedZip) && (
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Downloaded</span>
                      </span>
                    )}
                  </div>
                  <div className="max-h-32 overflow-y-auto pr-1 space-y-1 font-mono text-[10px] text-slate-300">
                    {activeFiles.map((fileItem, idx) => {
                      const filePath = typeof fileItem === 'string' ? fileItem : fileItem.path;
                      const fileBytes = typeof fileItem === 'string' ? null : fileItem.bytes;
                      return (
                        <div
                          key={`${filePath}-${idx}`}
                          className="px-2 py-1 rounded-lg bg-slate-950/70 border border-slate-800/60 flex items-center justify-between gap-2"
                        >
                          <span className="truncate">{filePath}</span>
                          <span className="text-[9px] text-emerald-400/80 shrink-0">
                            {fileBytes !== null ? formatBytes(fileBytes) : '✓'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
