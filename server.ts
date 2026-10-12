import express from "express";
import path from "path";
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

// 1. Text-to-Speech using gemini-3.1-flash-tts-preview
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
      model: "gemini-3.1-flash-tts-preview",
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
