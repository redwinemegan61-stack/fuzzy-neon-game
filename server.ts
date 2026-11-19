import express from "express";
import path from "path";
import fs from "fs";
import zlib from "zlib";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Modality } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Lazy/safe initialization of Google GenAI
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// 1. Text-to-Speech using gemini-3.8-flash-lite-tts
app.post("/api/mascot/tts", async (req, res) => {
  try {
    const { text, voice = "Kore" } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        error: "Gemini API key is not configured. Using client sound synthesis.",
      });
    }

    // Supported voices: Puck, Kore, Aoede, Charon, Fenrir, Zephyr
    // Explicitly re-route deep/old voices (Fenrir, Zephyr, Charon) to joyful, cute mascot voices (Puck or Kore)
    let selectedVoice = voice;
    if (voice === "Fenrir" || voice === "Charon" || voice === "Zephyr") {
      selectedVoice = "Puck";
    }
    const validVoices = ["Puck", "Kore", "Aoede", "Charon", "Fenrir", "Zephyr"];
    if (!validVoices.includes(selectedVoice)) {
      selectedVoice = "Puck";
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const base64Audio =
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({ error: "Failed to generate mascot audio" });
    }

    return res.json({ audio: base64Audio, format: "pcm", sampleRate: 24000 });
  } catch (err: any) {
    console.error("TTS generation error:", err);
    return res.status(500).json({
      error: err?.message || "Failed to generate speech",
    });
  }
});

// 2. Image understanding using gemini-3.8-flash
app.post("/api/mascot/analyze-photo", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Image data is required" });
    }

    const ai = getGenAI();
    if (!ai) {
      // Fallback generator if no API key provided
      return res.json({
        mascot: {
          name: "Neo-Puff Nova",
          personality: "Curious and hyper-energetic cosmic explorer",
          hairColors: ["#00f0ff", "#ff007f", "#39ff14"],
          furColor: "#7928ca",
          eyesColor: "#00ffff",
          uniqueAbility: {
            name: "Prism Burst",
            description: "Slows puzzle timer by 35% and reveals reflex targets in advance.",
            effectType: "slow_time",
          },
          cheerQuote: "*squeee-pip!* ✨ *boing boing!* 🐾",
          originStory: "Scanned from your photo and synthesized through the neon prism dimension.",
        },
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `Analyze this uploaded photo (which could be a pet, plushie, toy, selfie, drawing, or object) and transform it into an ultra-cute, adorable fuzzy little mascot for a high-speed neon reflex puzzle game! The mascot MUST have adorable multicolored fuzzy hair and a unique personality.
IMPORTANT: Mascots DO NOT speak human words or sentences; they only make cute noises and squeak!

Respond ONLY with valid JSON in this exact structure:
{
  "name": "Creative cute mascot name",
  "personality": "Short cute 1-sentence personality description",
  "hairColors": ["#hex1", "#hex2", "#hex3"],
  "furColor": "#hexMainBody",
  "eyesColor": "#hexEyes",
  "uniqueAbility": {
    "name": "Catchy Ability Name",
    "description": "How this ability helps the player in fast reflex puzzle games",
    "effectType": "one of: bonus_coins, slow_time, auto_deflect, lucky_dice"
  },
  "cheerQuote": "A cute squeak and noise sound expression like '*squeee-pip!* ✨ *boing!* 🐾'",
  "originStory": "A 1-sentence fun lore explanation based on what is in the photo"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || "image/jpeg",
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
      },
    });

    const textOutput = response.text || "";
    // Clean code fences if present
    const cleanedJson = textOutput.replace(/```json/g, "").replace(/```/g, "").trim();
    const mascotData = JSON.parse(cleanedJson);

    return res.json({ mascot: mascotData });
  } catch (err: any) {
    console.error("Photo analysis error (fallback provided):", err?.message || err);
    // Provide delightful dynamic fallback mascot on failure or quota limits
    const seed = Date.now();
    const fallbackNames = ["Spark-Bunny", "Aura-Puff", "Cosmic-Kitten", "Prism-Fox", "Velvet-Star"];
    const fallbackName = fallbackNames[seed % fallbackNames.length];

    return res.json({
      mascot: {
        name: fallbackName,
        personality: "Bubbly neon explorer who dances to electronic synth beats!",
        hairColors: ["#ff007f", "#00f0ff", "#ffe600"],
        furColor: "#8b5cf6",
        eyesColor: "#06b6d4",
        uniqueAbility: {
          name: "Neon Supercharge",
          description: "Awards 2x bonus coins and extends puzzle reaction window.",
          effectType: "bonus_coins",
        },
        cheerQuote: "Paws ready! Let's conquer the next puzzle challenge!",
        originStory: "Synthesized from your uploaded photo via neon quantum frequencies.",
      },
      warning: err?.message,
    });
  }
});

// 3. Google Search Grounding using gemini-3.8-flash with googleSearch
app.get("/api/trivia/daily-search", async (req, res) => {
  try {
    const ai = getGenAI();
    if (!ai) {
      return res.json({
        question: "Which neon game aesthetic inspired modern synthwave and reflex arcade titles?",
        options: [
          "1980s Retro Arcade Outrun",
          "Victorian Steampunk",
          "Monochrome GameBoy",
          "Silent Film Era",
        ],
        correctIndex: 0,
        explanation: "1980s Outrun and neon cyberpunk wireframe aesthetics defined synthwave and reflex arcade pacing.",
        sources: [
          { title: "Retro Gaming History", uri: "https://en.wikipedia.org/wiki/Out_Run" },
        ],
      });
    }

    const prompt = `Search the web for an exciting, recent, or trending trivia fact about gaming, arcade culture, pop tech, or science.
Create a fun 4-option multiple choice trivia challenge for players of an arcade game.
Respond ONLY with a valid JSON object in this exact schema:
{
  "question": "Engaging question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0,
  "explanation": "Brief fun explanation why this is true",
  "searchTopic": "What topic was queried"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const textOutput = response.text || "";
    const cleanedJson = textOutput.replace(/```json/g, "").replace(/```/g, "").trim();
    let triviaData: any = {};
    try {
      triviaData = JSON.parse(cleanedJson);
    } catch {
      triviaData = {
        question: "What makes neon gases glow in vibrant colors when an electric charge passes through?",
        options: ["Atomic electron excitation", "Chemical oxidation", "Thermal nuclear fusion", "Static friction"],
        correctIndex: 0,
        explanation: "High voltage excites electrons in gas atoms; as they return to lower energy states they emit photons!",
      };
    }

    // Extract grounding search sources as required by Google Search Grounding guidelines
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources: Array<{ title: string; uri: string }> = [];
    if (Array.isArray(groundingChunks)) {
      for (const chunk of groundingChunks) {
        if (chunk.web?.uri) {
          sources.push({
            title: chunk.web.title || "Web Citation",
            uri: chunk.web.uri,
          });
        }
      }
    }

    return res.json({
      ...triviaData,
      sources: sources.slice(0, 3),
    });
  } catch (err: any) {
    console.error("Search Grounding trivia error:", err);
    return res.json({
      question: "Which color has the shortest visible light wavelength with the highest frequency?",
      options: ["Violet", "Red", "Green", "Yellow"],
      correctIndex: 0,
      explanation: "Violet light has the shortest wavelength (~380-450 nm) and highest energy among visible light colors.",
      sources: [{ title: "Visible Spectrum Science", uri: "https://en.wikipedia.org/wiki/Visible_spectrum" }],
    });
  }
});

// Dynamic simulated persistent global leaderboard
let leaderboardEntries = [
  { id: "1", name: "CyberKitten_99", country: "🇯🇵 JP", score: 98450, townLevel: 14, mascot: "Ziggy", avatarColor: "#00f0ff" },
  { id: "2", name: "NeonFuzzMaster", country: "🇺🇸 US", score: 87200, townLevel: 12, mascot: "Pip", avatarColor: "#ff007f" },
  { id: "3", name: "GlitchBoba", country: "🇰🇷 KR", score: 81900, townLevel: 11, mascot: "Boba", avatarColor: "#39ff14" },
  { id: "4", name: "PrismPaws", country: "🇬🇧 UK", score: 76540, townLevel: 10, mascot: "Lulu", avatarColor: "#ffe600" },
  { id: "5", name: "VaporFox", country: "🇨🇦 CA", score: 69200, townLevel: 9, mascot: "Ziggy", avatarColor: "#a855f7" },
  { id: "6", name: "SpeedyMochi", country: "🇩🇪 DE", score: 62400, townLevel: 8, mascot: "Boba", avatarColor: "#ec4899" },
  { id: "7", name: "PixelFur", country: "🇫🇷 FR", score: 55100, townLevel: 7, mascot: "Pip", avatarColor: "#06b6d4" },
  { id: "8", name: "StarlightTaro", country: "🇦🇺 AU", score: 48900, townLevel: 6, mascot: "Lulu", avatarColor: "#f59e0b" },
];

app.get("/api/leaderboard", (req, res) => {
  res.json({ leaderboard: leaderboardEntries });
});

app.post("/api/leaderboard", (req, res) => {
  const { name, score, townLevel, mascot, country = "🌐 INT" } = req.body;
  if (!name || typeof score !== "number") {
    return res.status(400).json({ error: "Invalid score submission" });
  }

  const existingIndex = leaderboardEntries.findIndex((e) => e.name.toLowerCase() === name.toLowerCase());
  if (existingIndex >= 0) {
    if (score > leaderboardEntries[existingIndex].score) {
      leaderboardEntries[existingIndex].score = score;
      leaderboardEntries[existingIndex].townLevel = Math.max(leaderboardEntries[existingIndex].townLevel, townLevel || 1);
    }
  } else {
    leaderboardEntries.push({
      id: String(Date.now()),
      name,
      country,
      score,
      townLevel: townLevel || 1,
      mascot: mascot || "Pip",
      avatarColor: "#00f0ff",
    });
  }

  leaderboardEntries.sort((a, b) => b.score - a.score);
  leaderboardEntries = leaderboardEntries.slice(0, 50);

  res.json({ success: true, leaderboard: leaderboardEntries });
});

// ============================================================================
// 4. APPLICATION SOURCE CODE ZIP ARCHIVE BUILDER & DOWNLOAD ENDPOINTS
// ============================================================================

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC32_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function collectProjectFiles(rootDir: string): Array<{ relPath: string; content: Buffer }> {
  const results: Array<{ relPath: string; content: Buffer }> = [];
  const rootFiles = [
    "package.json",
    "tsconfig.json",
    "vite.config.ts",
    "index.html",
    "server.ts",
    "metadata.json",
    ".env.example",
  ];

  for (const rf of rootFiles) {
    const full = path.join(rootDir, rf);
    if (fs.existsSync(full) && fs.statSync(full).isFile()) {
      results.push({ relPath: rf, content: fs.readFileSync(full) });
    }
  }

  const walkDir = (dirPath: string, prefix: string) => {
    if (!fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "dist") {
        continue;
      }
      const fullPath = path.join(dirPath, entry.name);
      const rel = `${prefix}/${entry.name}`;
      if (entry.isDirectory()) {
        walkDir(fullPath, rel);
      } else if (entry.isFile()) {
        results.push({ relPath: rel, content: fs.readFileSync(fullPath) });
      }
    }
  };

  walkDir(path.join(rootDir, "src"), "src");
  walkDir(path.join(rootDir, "public"), "public");
  return results;
}

function buildPkZipBuffer(files: Array<{ relPath: string; content: Buffer }>): Buffer {
  const localFileParts: Buffer[] = [];
  const centralDirParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.relPath.replace(/\\/g, "/"), "utf8");
    const uncompressed = file.content;
    const compressed = zlib.deflateRawSync(uncompressed);
    const crc = crc32(uncompressed);

    // Local File Header (30 bytes + filename)
    const lfh = Buffer.alloc(30);
    lfh.writeUInt32LE(0x04034b50, 0); // signature
    lfh.writeUInt16LE(20, 4); // version needed
    lfh.writeUInt16LE(0, 6); // general purpose bit flag
    lfh.writeUInt16LE(8, 8); // compression method: 8 = Deflate
    lfh.writeUInt16LE(0, 10); // mod time
    lfh.writeUInt16LE(0x5421, 12); // mod date
    lfh.writeUInt32LE(crc, 14);
    lfh.writeUInt32LE(compressed.length, 18);
    lfh.writeUInt32LE(uncompressed.length, 22);
    lfh.writeUInt16LE(nameBuf.length, 26);
    lfh.writeUInt16LE(0, 28); // extra field length

    localFileParts.push(lfh, nameBuf, compressed);

    // Central Directory Header (46 bytes + filename)
    const cdh = Buffer.alloc(46);
    cdh.writeUInt32LE(0x02014b50, 0); // signature
    cdh.writeUInt16LE(20, 4); // version made by
    cdh.writeUInt16LE(20, 6); // version needed
    cdh.writeUInt16LE(0, 8); // flags
    cdh.writeUInt16LE(8, 10); // method: Deflate
    cdh.writeUInt16LE(0, 12); // time
    cdh.writeUInt16LE(0x5421, 14); // date
    cdh.writeUInt32LE(crc, 16);
    cdh.writeUInt32LE(compressed.length, 20);
    cdh.writeUInt32LE(uncompressed.length, 24);
    cdh.writeUInt16LE(nameBuf.length, 28);
    cdh.writeUInt16LE(0, 30); // extra length
    cdh.writeUInt16LE(0, 32); // comment length
    cdh.writeUInt16LE(0, 34); // disk number
    cdh.writeUInt16LE(0, 36); // internal attrs
    cdh.writeUInt32LE(0, 38); // external attrs
    cdh.writeUInt32LE(offset, 42); // relative offset of local header

    centralDirParts.push(cdh, nameBuf);
    offset += lfh.length + nameBuf.length + compressed.length;
  }

  const centralDirBuffer = Buffer.concat(centralDirParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
  eocd.writeUInt16LE(0, 4); // disk number
  eocd.writeUInt16LE(0, 6); // central dir start disk
  eocd.writeUInt16LE(files.length, 8); // entries on this disk
  eocd.writeUInt16LE(files.length, 10); // total entries
  eocd.writeUInt32LE(centralDirBuffer.length, 12); // size of central dir
  eocd.writeUInt32LE(offset, 16); // offset of start of central dir
  eocd.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([...localFileParts, centralDirBuffer, eocd]);
}

function collectDistWebAssets(rootDir: string): Array<{ relPath: string; content: Buffer }> {
  const distDir = path.join(rootDir, "dist");
  const results: Array<{ relPath: string; content: Buffer }> = [];
  if (!fs.existsSync(distDir)) return results;

  function walk(dir: string) {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name.startsWith("server.cjs")) continue;
      const fullPath = path.join(dir, entry.name);
      const relFromDist = path.relative(distDir, fullPath).replace(/\\/g, "/");
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile()) {
        try {
          const stat = fs.statSync(fullPath);
          if (stat.size <= 10 * 1024 * 1024) {
            results.push({
              relPath: `base/assets/public/${relFromDist}`,
              content: fs.readFileSync(fullPath),
            });
          }
        } catch {
          // ignore
        }
      }
    }
  }
  walk(distDir);
  return results;
}

type AndroidBuildType = "release" | "debug";
type AndroidProductFlavor = "playstore" | "staging";

interface AndroidBundleVariantConfig {
  buildType: AndroidBuildType;
  flavor: AndroidProductFlavor;
  variantName: string;
  gradleTask: string;
  packageId: string;
  appName: string;
  launcherName: string;
  versionName: string;
  versionCode: number;
  aabFilename: string;
  kitFilename: string;
  debuggable: boolean;
  appUrl: string;
  host: string;
}

function resolveAndroidBundleVariant(query: Record<string, any> = {}): AndroidBundleVariantConfig {
  const rawVariant = typeof query.variant === "string" ? query.variant.toLowerCase() : "";
  let flavor: AndroidProductFlavor =
    query.flavor === "staging" || rawVariant.includes("staging") ? "staging" : "playstore";
  let buildType: AndroidBuildType =
    query.buildType === "debug" || rawVariant.includes("debug") ? "debug" : "release";

  const basePackageId = "com.neonfuzz.boardempire";
  const flavorSuffix = flavor === "staging" ? ".staging" : "";
  const buildSuffix = buildType === "debug" ? ".debug" : "";
  const packageId = `${basePackageId}${flavorSuffix}${buildSuffix}`;

  const versionParts = ["1.0.0"];
  if (flavor === "staging") versionParts.push("staging");
  if (buildType === "debug") versionParts.push("debug");
  const versionName = versionParts.join("-");

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const variantName = `${flavor}${capitalize(buildType)}`;
  const gradleTask = `bundle${capitalize(flavor)}${capitalize(buildType)}`;

  const appName =
    flavor === "staging"
      ? buildType === "debug"
        ? "Neon Fuzz (Staging Debug)"
        : "Neon Fuzz (Staging)"
      : buildType === "debug"
      ? "Neon Fuzz (Debug)"
      : "Neon Fuzz: Board & Reflex Empire";

  const launcherName = flavor === "staging" ? "Neon Fuzz QA" : "Neon Fuzz";
  const host =
    flavor === "staging"
      ? "ais-dev-3cwhq6kmkpw6nwxbpfaxgp-464573425992.us-west1.run.app"
      : "ais-pre-3cwhq6kmkpw6nwxbpfaxgp-464573425992.us-west1.run.app";
  const appUrl = `https://${host}`;

  return {
    buildType,
    flavor,
    variantName,
    gradleTask,
    packageId,
    appName,
    launcherName,
    versionName,
    versionCode: 1,
    aabFilename: `neon-fuzz-${flavor}-${buildType}.aab`,
    kitFilename: `neon-fuzz-android-studio-${flavor}-${buildType}-kit.zip`,
    debuggable: buildType === "debug",
    appUrl,
    host,
  };
}

function buildAndroidAabBundleEntries(
  rootDir: string,
  variant: AndroidBundleVariantConfig = resolveAndroidBundleVariant()
): Array<{ relPath: string; content: Buffer }> {
  const { appUrl, host, packageId, appName, launcherName, versionName, versionCode, debuggable } =
    variant;

  // Protobuf-compatible BundleConfig.pb binary header (bundletool version 1.15.6)
  const versionStr = "1.15.6";
  const bundleConfigBuf = Buffer.concat([
    Buffer.from([0x0a, versionStr.length + 2, 0x0a, versionStr.length]),
    Buffer.from(versionStr, "utf-8"),
    Buffer.from([0x12, 0x04, 0x08, 0x01, 0x10, 0x01]),
  ]);

  const escapedAppName = appName.replace(/&/g, "&amp;");
  const androidManifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${packageId}"
    android:versionCode="${versionCode}"
    android:versionName="${versionName}">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-feature android:glEsVersion="0x00030000" android:required="true" />

    <application
        android:allowBackup="true"
        android:debuggable="${debuggable}"
        android:hardwareAccelerated="true"
        android:label="${escapedAppName}"
        android:supportsRtl="true"
        android:usesCleartextTraffic="false"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">

        <meta-data
            android:name="asset_statements"
            android:value='[{"relation": ["delegate_permission/common.handle_all_urls"], "target": {"namespace": "web", "site": "${appUrl}"}}]' />

        <activity
            android:name="com.neonfuzz.boardempire.MainActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:exported="true"
            android:launchMode="singleTask"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="${host}" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

  const capacitorConfig = JSON.stringify(
    {
      appId: packageId,
      appName,
      webDir: "dist",
      bundledWebRuntime: false,
      server: {
        url: appUrl,
        cleartext: false,
      },
      android: {
        allowMixedContent: false,
        captureInput: true,
        webContentsDebuggingEnabled: debuggable,
      },
    },
    null,
    2
  );

  const twaManifest = JSON.stringify(
    {
      packageId,
      host,
      name: appName,
      launcherName,
      display: "standalone",
      themeColor: "#070815",
      navigationColor: "#070815",
      backgroundColor: "#070815",
      enableNotifications: true,
      startUrl: "/",
      iconUrl: `${appUrl}/favicon.ico`,
      appVersionName: versionName,
      appVersionCode: versionCode,
      shortcuts: [],
      generatorApp: "bubblewrap-cli",
      webManifestUrl: `${appUrl}/manifest.webmanifest`,
      fallbackType: "customtabs",
      orientation: "portrait",
    },
    null,
    2
  );

  const manifestMf = [
    "Manifest-Version: 1.0",
    "Created-By: Neon Fuzz Android App Bundle Exporter 1.0.0",
    `Package-Name: ${packageId}`,
    `Build-Variant: ${variant.variantName}`,
    `Product-Flavor: ${variant.flavor}`,
    `Build-Type: ${variant.buildType}`,
    `Version-Code: ${versionCode}`,
    `Version-Name: ${versionName}`,
    "",
  ].join("\r\n");

  const entries: Array<{ relPath: string; content: Buffer }> = [
    { relPath: "BundleConfig.pb", content: bundleConfigBuf },
    { relPath: "base/manifest/AndroidManifest.xml", content: Buffer.from(androidManifestXml, "utf-8") },
    { relPath: "base/assets/capacitor.config.json", content: Buffer.from(capacitorConfig, "utf-8") },
    { relPath: "base/assets/twa-manifest.json", content: Buffer.from(twaManifest, "utf-8") },
    { relPath: "META-INF/MANIFEST.MF", content: Buffer.from(manifestMf, "utf-8") },
    ...collectDistWebAssets(rootDir),
  ];

  return entries;
}

function buildAndroidStudioProjectEntries(
  rootDir: string,
  variant: AndroidBundleVariantConfig = resolveAndroidBundleVariant()
): Array<{ relPath: string; content: Buffer }> {
  const baseFiles = collectProjectFiles(rootDir);
  const basePackageId = "com.neonfuzz.boardempire";

  const capacitorConfig = JSON.stringify(
    {
      appId: variant.packageId,
      appName: variant.appName,
      webDir: "dist",
      server: {
        url: variant.appUrl,
        cleartext: false,
      },
      android: {
        webContentsDebuggingEnabled: variant.debuggable,
      },
    },
    null,
    2
  );

  const rootBuildGradle = `buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.2'
    }
}
allprojects {
    repositories {
        google()
        mavenCentral()
    }
}`;

  const settingsGradle = `rootProject.name = "NeonFuzzBoardEmpire"
include ':app'`;

  const appBuildGradle = `plugins {
    id 'com.android.application'
}

android {
    namespace "${basePackageId}"
    compileSdk 34

    defaultConfig {
        applicationId "${basePackageId}"
        minSdk 24
        targetSdk 34
        versionCode ${variant.versionCode}
        versionName "1.0.0"
    }

    flavorDimensions += "channel"
    productFlavors {
        playstore {
            dimension "channel"
            resValue "string", "app_name", "Neon Fuzz: Board & Reflex Empire"
            buildConfigField "String", "APP_URL", "\\"https://ais-pre-3cwhq6kmkpw6nwxbpfaxgp-464573425992.us-west1.run.app\\""
        }
        staging {
            dimension "channel"
            applicationIdSuffix ".staging"
            versionNameSuffix "-staging"
            resValue "string", "app_name", "Neon Fuzz (Staging)"
            buildConfigField "String", "APP_URL", "\\"https://ais-dev-3cwhq6kmkpw6nwxbpfaxgp-464573425992.us-west1.run.app\\""
        }
    }

    buildTypes {
        debug {
            applicationIdSuffix ".debug"
            versionNameSuffix "-debug"
            debuggable true
            minifyEnabled false
            shrinkResources false
        }
        release {
            debuggable false
            minifyEnabled false
            shrinkResources false
        }
    }

    buildFeatures {
        buildConfig true
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.webkit:webkit:1.10.0'
}`;

  const mainActivityJava = `package ${basePackageId};

import android.annotation.SuppressLint;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true);
        }
        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        webView.setWebViewClient(new WebViewClient());
        setContentView(webView);
        webView.loadUrl(BuildConfig.APP_URL);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}`;

  const githubActionYaml = `name: Build Android AAB Variant
on:
  workflow_dispatch:
    inputs:
      gradle_task:
        description: 'Gradle bundle variant task'
        required: true
        default: '${variant.gradleTask}'
        type: choice
        options:
          - bundlePlaystoreRelease
          - bundlePlaystoreDebug
          - bundleStagingRelease
          - bundleStagingDebug
  push:
    branches: [ main ]

jobs:
  build-aab:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      - name: Install & Build Web Assets
        run: |
          npm install
          npm run build
      - name: Setup Android SDK & Build AAB Variant
        uses: android-actions/setup-android@v3
      - name: Generate AAB via Gradle
        working-directory: ./android
        run: gradle \${{ github.event.inputs.gradle_task || '${variant.gradleTask}' }}
      - name: Upload AAB Artifact
        uses: actions/upload-artifact@v4
        with:
          name: neon-fuzz-aab-\${{ github.event.inputs.gradle_task || '${variant.gradleTask}' }}
          path: android/app/build/outputs/bundle/**/*.aab
`;

  const aabReadme = `# Neon Fuzz: Android App Bundle (.AAB) Build & Variant Guide

Selected Variant: **${variant.variantName}** (\`${variant.packageId}\`, \`v${variant.versionName}\`)

## Available Gradle Bundle Variants
- \`gradle bundlePlaystoreRelease\` -> \`com.neonfuzz.boardempire\` (Production Play Store)
- \`gradle bundlePlaystoreDebug\` -> \`com.neonfuzz.boardempire.debug\` (Debuggable Play Store)
- \`gradle bundleStagingRelease\` -> \`com.neonfuzz.boardempire.staging\` (Staging / Internal QA)
- \`gradle bundleStagingDebug\` -> \`com.neonfuzz.boardempire.staging.debug\` (Staging Debug)

## Option 1: Direct Pre-Packaged AAB
You can download \`${variant.aabFilename}\` directly from \`/api/export-aab?flavor=${variant.flavor}&buildType=${variant.buildType}\`.

## Option 2: Build & Sign with Your Upload Key in Android Studio
1. Open the \`android/\` folder in **Android Studio**.
2. Select your desired Build Variant in the **Build Variants** tool window (e.g. \`${variant.variantName}\`).
3. Go to **Build > Generate Signed Bundle / APK...** -> select **Android App Bundle**.
4. Choose or create your Play Store Upload Keystore and click **Create** to generate the signed \`.aab\`.

## Option 3: One-Click Cloud AAB via GitHub Actions
Push this repository to GitHub; the included workflow (\`.github/workflows/build-android-aab.yml\`) compiles the chosen variant (\`${variant.gradleTask}\`) and uploads the \`.aab\` under Actions Artifacts.
`;

  const aabEntries = buildAndroidAabBundleEntries(rootDir, variant);
  const manifestEntry = aabEntries.find((e) => e.relPath === "base/manifest/AndroidManifest.xml");

  return [
    ...baseFiles,
    { relPath: "capacitor.config.json", content: Buffer.from(capacitorConfig, "utf-8") },
    { relPath: "ANDROID_AAB_README.md", content: Buffer.from(aabReadme, "utf-8") },
    { relPath: "android/build.gradle", content: Buffer.from(rootBuildGradle, "utf-8") },
    { relPath: "android/settings.gradle", content: Buffer.from(settingsGradle, "utf-8") },
    { relPath: "android/app/build.gradle", content: Buffer.from(appBuildGradle, "utf-8") },
    {
      relPath: "android/app/src/main/AndroidManifest.xml",
      content: manifestEntry ? manifestEntry.content : Buffer.from("", "utf-8"),
    },
    {
      relPath: "android/app/src/main/java/com/neonfuzz/boardempire/MainActivity.java",
      content: Buffer.from(mainActivityJava, "utf-8"),
    },
    {
      relPath: ".github/workflows/build-android-aab.yml",
      content: Buffer.from(githubActionYaml, "utf-8"),
    },
  ];
}

app.get("/manifest.webmanifest", (req, res) => {
  res.setHeader("Content-Type", "application/manifest+json");
  return res.json({
    short_name: "Neon Fuzz",
    name: "Neon Fuzz: Board & Reflex Empire",
    description: "3D Mascot Board, Reflex Arcade, and Standalone 3D Town & Borough Empire.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#070815",
    background_color: "#070815",
    icons: [
      {
        src: "https://cdn-icons-png.flaticon.com/512/616/616490.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  });
});

app.get("/.well-known/assetlinks.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  return res.json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "com.neonfuzz.boardempire",
        sha256_cert_fingerprints: [
          "FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C",
        ],
      },
    },
  ]);
});

app.get(["/app-ads.txt", "/ads.txt"], (req, res) => {
  const pubId = (
    process.env.ADMOB_PUBLISHER_ID ||
    process.env.VITE_ADSENSE_PUB_ID ||
    "pub-3940256099942544"
  ).replace(/^ca-/, "");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  return res.send(`google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`);
});

// AAB export endpoints (Development / Staging only - excluded in production releases)
if (process.env.NODE_ENV !== "production") {
  app.get("/api/export-aab", (req, res) => {
    try {
      const variant = resolveAndroidBundleVariant(req.query);
      const aabFiles = buildAndroidAabBundleEntries(process.cwd(), variant);
      const aabBuffer = buildPkZipBuffer(aabFiles);
      res.setHeader("Content-Type", "application/x-authorware-bin");
      res.setHeader("Content-Disposition", `attachment; filename="${variant.aabFilename}"`);
      res.setHeader("Content-Length", String(aabBuffer.length));
      return res.send(aabBuffer);
    } catch (err: any) {
      console.error("Failed to generate AAB package:", err);
      return res.status(500).json({ error: "Failed to create AAB package" });
    }
  });

  app.get("/api/export-aab-info", (req, res) => {
    try {
      const variant = resolveAndroidBundleVariant(req.query);
      const aabFiles = buildAndroidAabBundleEntries(process.cwd(), variant);
      const aabBuffer = buildPkZipBuffer(aabFiles);
      return res.json({
        filename: variant.aabFilename,
        variantName: variant.variantName,
        gradleTask: variant.gradleTask,
        buildType: variant.buildType,
        flavor: variant.flavor,
        debuggable: variant.debuggable,
        packageId: variant.packageId,
        appName: variant.appName,
        versionName: variant.versionName,
        versionCode: variant.versionCode,
        fileCount: aabFiles.length,
        sizeBytes: aabBuffer.length,
        files: aabFiles.map((f) => ({ path: f.relPath, bytes: f.content.length })),
        base64Aab: aabBuffer.toString("base64"),
      });
    } catch (err: any) {
      console.error("Failed to generate AAB info:", err);
      return res.status(500).json({ error: "Failed to generate AAB info" });
    }
  });

  app.get("/api/export-android-project", (req, res) => {
    try {
      const variant = resolveAndroidBundleVariant(req.query);
      const files = buildAndroidStudioProjectEntries(process.cwd(), variant);
      const zipBuffer = buildPkZipBuffer(files);
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${variant.kitFilename}"`);
      res.setHeader("Content-Length", String(zipBuffer.length));
      return res.send(zipBuffer);
    } catch (err: any) {
      console.error("Failed to generate Android Studio project zip:", err);
      return res.status(500).json({ error: "Failed to create Android Studio project zip" });
    }
  });
} else {
  app.get(["/api/export-aab", "/api/export-aab-info", "/api/export-android-project"], (req, res) => {
    return res.status(404).json({ error: "AAB bundler is not available in production builds." });
  });
}

app.get("/api/export-zip", (req, res) => {
  try {
    const files = collectProjectFiles(process.cwd());
    const zipBuffer = buildPkZipBuffer(files);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="neon-fuzz-app-source.zip"');
    res.setHeader("Content-Length", String(zipBuffer.length));
    return res.send(zipBuffer);
  } catch (err: any) {
    console.error("Failed to generate app zip:", err);
    return res.status(500).json({ error: "Failed to create app zip" });
  }
});

app.get("/api/export-zip-info", (req, res) => {
  try {
    const files = collectProjectFiles(process.cwd());
    const zipBuffer = buildPkZipBuffer(files);
    return res.json({
      filename: "neon-fuzz-app-source.zip",
      fileCount: files.length,
      sizeBytes: zipBuffer.length,
      files: files.map((f) => ({ path: f.relPath, bytes: f.content.length })),
      base64Zip: zipBuffer.toString("base64"),
    });
  } catch (err: any) {
    console.error("Failed to generate zip info:", err);
    return res.status(500).json({ error: "Failed to generate zip info" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Neon Fuzz Game Server running on port ${PORT}`);
  });
}

startServer();
