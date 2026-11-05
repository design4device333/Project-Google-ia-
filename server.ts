import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Default Presets resembling the user's reference screenshot (Frank from Artlist / PS5 character casting)
const PRESET_CHARACTERS = [
  {
    id: "frank-pilot",
    name: "Frank Vance",
    role: "Piloto As - Escuadrón 40",
    archetype: "Piloto Militar WWII / Aventura",
    age: "32 años",
    build: "Atlético, complexión robusta y mirada firme",
    lore: "Veterano de misiones aéreas de alta tensión. Con su chaqueta de cuero gastada y gafas de aviador, Frank es el protagonista ideal para campañas cinemáticas y juegos de acción.",
    mood: "Decidido y templado",
    voice: {
      pitch: "Media-Baja (Barítono)",
      roughness: "Áspera / Rasposa con eco de radio de cabina",
      tone: "Gravitas militar, pausado pero autoritario",
      frequencyProfile: [28, 45, 75, 92, 85, 60, 48, 35, 20],
    },
    lightingPreset: "ARRI Signature Prime - Tungsteno & Luz de Borde Fría",
    renderEngine: "Unreal Engine 5.4 - MetaHuman Creator PS5 Pro",
    images: {
      portrait: "/avatars/frank_pilot.jpg",
      fullBody: "/avatars/frank_turnaround.jpg",
      turnaroundSheet: "/avatars/frank_turnaround.jpg",
      backView: "/avatars/frank_turnaround.jpg",
    },
    tags: ["PS5 Cinematic", "MetaHuman", "WWII", "Heroic", "ARRI Master"],
  },
  {
    id: "valkyrie-cyber",
    name: "Kira 07",
    role: "Operativa Táctica Neo-Tokyo",
    archetype: "Cyberpunk / Guerrera Futurista",
    age: "27 años",
    build: "Ágil, fibra de carbono y neural augments",
    lore: "Especialista en sigilo e infiltración cibernética. Con implantes bioluminiscentes y armadura modular de titanio ultraligero.",
    mood: "Foco implacable y analítica",
    voice: {
      pitch: "Aguda con filtro sintético resonante",
      roughness: "Limpia con distorsión armónica digital",
      tone: "Cálculo táctico rápido y preciso",
      frequencyProfile: [40, 70, 95, 88, 65, 55, 45, 30, 25],
    },
    lightingPreset: "Cyber Neon - Cian Volumétrico y Ámbar",
    renderEngine: "Unreal Engine 5.4 - Lumen Global Illumination",
    images: {
      portrait: "/avatars/cyber_valkyrie.jpg",
      fullBody: "/avatars/cyber_valkyrie.jpg",
      turnaroundSheet: "/avatars/cyber_valkyrie.jpg",
      backView: "/avatars/cyber_valkyrie.jpg",
    },
    tags: ["Cyberpunk", "Ray-Tracing", "Neo-Blade", "Sci-Fi", "PS5 AAA"],
  },
  {
    id: "gwyn-knight",
    name: "Lord Ronald",
    role: "Paladín de la Orden Sombría",
    archetype: "Fantasía Oscura / Souls Knight",
    age: "41 años",
    build: "Fuerte, armadura de placas grabadas a mano y cicatrices de guerra",
    lore: "Superviviente del asedio a las tierras baldías. Su armadura de acero ennegrecido lleva runas de protección forjadas en fuego arcano.",
    mood: "Estoico, melancólico y honorable",
    voice: {
      pitch: "Grave y resonante",
      roughness: "Piedra y hierro, marcada por el frío",
      tone: "Voz de juramento inquebrantable",
      frequencyProfile: [60, 85, 100, 75, 50, 40, 30, 20, 15],
    },
    lightingPreset: "Niebla de Batalla Noir con Contraluz Crepuscular",
    renderEngine: "Nanite Geometry 8K Texture Shader PS5",
    images: {
      portrait: "/avatars/fantasy_knight.jpg",
      fullBody: "/avatars/fantasy_knight.jpg",
      turnaroundSheet: "/avatars/fantasy_knight.jpg",
      backView: "/avatars/fantasy_knight.jpg",
    },
    tags: ["Dark Souls", "Elden Fantasy", "Ornate Armor", "Cinematic", "PS5"],
  },
  {
    id: "ghost-specops",
    name: "Marcus Drake",
    role: "Infiltrador Orbital ODST",
    archetype: "Ciencia Ficción Militar / Spec-Ops",
    age: "35 años",
    build: "Muscular, exoesqueleto y visor HUD retráctil",
    lore: "Comandante de asalto en gravedad cero. Porta blindaje ablativometálico y visor balístico con telemetría en tiempo real.",
    mood: "Intenso y listo para el combate",
    voice: {
      pitch: "Medio-Grave con radio militar VHF",
      roughness: "Respiración táctica por máscara de oxígeno",
      tone: "Comando militar firme",
      frequencyProfile: [50, 65, 80, 85, 70, 50, 38, 25, 18],
    },
    lightingPreset: "Luz de Cabina Táctica con Partículas de Fuego",
    renderEngine: "Subsurface Scattering MetaHuman PS5 Pro",
    images: {
      portrait: "/avatars/scifi_soldier.jpg",
      fullBody: "/avatars/scifi_soldier.jpg",
      turnaroundSheet: "/avatars/scifi_soldier.jpg",
      backView: "/avatars/scifi_soldier.jpg",
    },
    tags: ["Sci-Fi", "Tactical HUD", "Exosuit", "Metahuman", "8K Render"],
  },
];

// Health Check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Presets list
app.get("/api/avatar/presets", (_req, res) => {
  res.json({ presets: PRESET_CHARACTERS });
});

// Prompt Enhancer via Gemini 3.8 Flash
app.post("/api/avatar/enhance-prompt", async (req, res) => {
  try {
    const { prompt, archetype, mood, lighting } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Return smart template if no key is configured
      const enhanced = `Cinematic PS5 MetaHuman character render of ${prompt || archetype || "a hero"}, ${mood || "intense"}, photorealistic skin textures, AAA video game character model, Unreal Engine 5 render, 8k resolution, ${lighting || "volumetric studio rim lighting"}, dramatic depth of field.`;
      return res.json({ enhancedPrompt: enhanced });
    }

    const systemPrompt = `You are a Lead Character Artist and Art Director at a premier AAA video game studio creating PS5/PS4 console games. 
Your task is to take a user's avatar idea and expand it into a high-end Unreal Engine 5 MetaHuman prompt, specifying:
1. Physical facial details, expression, skin pores, eye reflections
2. Clothing/tactical gear materials (weathered leather, carbon fiber, etched plates, fabric weave)
3. Cinematic lighting (e.g., ARRI Master Prime, rim light, volumetric fog, rim reflections)
4. Overall rendering tags: "Unreal Engine 5.4, MetaHuman, 8k render, AAA video game cinematics, PS5 graphics".
Keep the enhanced prompt under 65 words, rich in visual descriptors, in English.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Input: ${prompt || "Video game hero"}. Archetype: ${archetype}. Mood: ${mood}. Lighting: ${lighting}.`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    res.json({
      enhancedPrompt: response.text?.trim() || prompt,
    });
  } catch (error: any) {
    console.error("Enhance prompt error:", error);
    res.json({
      enhancedPrompt: `Unreal Engine 5 MetaHuman character render of ${req.body.prompt || "a hero"}, PS5 graphics, cinematic lighting, 8k resolution.`,
    });
  }
});

// Full Avatar Generation & Casting
app.post("/api/avatar/generate", async (req, res) => {
  try {
    const {
      prompt,
      name,
      archetype = "wwii_pilot",
      age = "30 años",
      mood = "Heroico y decidido",
      lighting = "ARRI Cinematic Studio",
      aspectRatio = "1:1",
    } = req.body;

    const ai = getGeminiClient();
    let generatedImage: string | null = null;
    let characterLore = "";
    let characterRole = "Protagonista de Acción";
    let voiceDetails = {
      pitch: "Barítono firme",
      roughness: "Grave con leve eco",
      tone: "Seguro y magnético",
      frequencyProfile: [45, 65, 85, 90, 75, 55, 40, 25, 20],
    };

    // 1. Lore & Profile Generation using gemini-3.8-flash
    if (ai) {
      try {
        const loreResponse = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: `Crea los datos para un personaje de videojuego AAA de PS5 basado en:
Nombre sugerido: ${name || "Sin nombre"}
Descripción: ${prompt}
Arquetipo: ${archetype}
Edad: ${age}
Estado de ánimo: ${mood}

Devuelve un JSON con:
- name: nombre cinematográfico
- role: título o rango (ej: "Capitán de Escuadrón 104")
- build: descripción física breve (ej: "Atlético, mandíbula marcada, mirada penetrante")
- lore: 2 frases de trasfondo cinematográfico
- voicePitch: tono de voz
- voiceTone: estilo de habla
- voiceRoughness: textura de la voz`,
          config: {
            responseMimeType: "application/json",
            temperature: 0.7,
          },
        });

        if (loreResponse.text) {
          try {
            const parsed = JSON.parse(loreResponse.text);
            if (parsed.role) characterRole = parsed.role;
            if (parsed.lore) characterLore = parsed.lore;
            if (parsed.voicePitch || parsed.voiceTone) {
              voiceDetails = {
                pitch: parsed.voicePitch || "Barítono firme",
                roughness: parsed.voiceRoughness || "Textura cinematográfica",
                tone: parsed.voiceTone || "Autoritario y expresivo",
                frequencyProfile: [35, 55, 80, 95, 85, 65, 45, 30, 20],
              };
            }
          } catch (e) {
            console.error("JSON parse error:", e);
          }
        }
      } catch (e) {
        console.warn("Lore generation fallback:", e);
      }

      // 2. Try Image Generation with gemini-3.1-flash-lite-image if available
      try {
        const imagePrompt = `Cinematic PS5 video game character render of ${prompt || archetype}, ${mood}, high detail Unreal Engine 5 MetaHuman 3D character, 8k resolution, volumetric rim lighting, AAA game studio model`;
        const imgResponse = await ai.models.generateContent({
          model: "gemini-3.1-flash-lite-image",
          contents: {
            parts: [{ text: imagePrompt }],
          },
          config: {
            imageConfig: {
              aspectRatio: (aspectRatio === "9:16" || aspectRatio === "16:9" ? aspectRatio : "1:1") as any,
            },
          },
        });

        if (imgResponse.candidates?.[0]?.content?.parts) {
          for (const part of imgResponse.candidates[0].content.parts) {
            if (part.inlineData?.data) {
              generatedImage = `data:image/png;base64,${part.inlineData.data}`;
              break;
            }
          }
        }
      } catch (imgErr: any) {
        console.log("Image generation with model unavailable or quota reached, using curated render:", imgErr?.message || imgErr);
      }
    }

    // Determine default fallback images based on archetype
    let fallbackBase = PRESET_CHARACTERS[0];
    if (archetype.includes("cyber") || prompt.toLowerCase().includes("cyber") || prompt.toLowerCase().includes("futur")) {
      fallbackBase = PRESET_CHARACTERS[1];
    } else if (archetype.includes("knight") || archetype.includes("fant") || prompt.toLowerCase().includes("caballero") || prompt.toLowerCase().includes("espada")) {
      fallbackBase = PRESET_CHARACTERS[2];
    } else if (archetype.includes("scifi") || prompt.toLowerCase().includes("soldado") || prompt.toLowerCase().includes("casco")) {
      fallbackBase = PRESET_CHARACTERS[3];
    }

    const charName = name?.trim() || (fallbackBase ? fallbackBase.name : "Vanguard Hero");
    const primaryImage = generatedImage || fallbackBase.images.portrait;

    const avatarData = {
      id: "char-" + Date.now(),
      name: charName,
      role: characterRole || fallbackBase.role,
      archetype: archetype || fallbackBase.archetype,
      age: age || fallbackBase.age,
      build: fallbackBase.build,
      lore: characterLore || fallbackBase.lore,
      mood: mood || fallbackBase.mood,
      voice: voiceDetails,
      lightingPreset: lighting || fallbackBase.lightingPreset,
      renderEngine: "Unreal Engine 5.4 - MetaHuman PS5 Pro",
      images: {
        portrait: primaryImage,
        fullBody: fallbackBase.images.fullBody,
        turnaroundSheet: fallbackBase.images.turnaroundSheet,
        backView: fallbackBase.images.backView,
      },
      tags: ["PS5 Game Avatar", "AI Generated", "MetaHuman", archetype.toUpperCase()],
      createdAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      avatar: avatarData,
    });
  } catch (err: any) {
    console.error("Avatar generation error:", err);
    res.status(500).json({
      success: false,
      error: err?.message || "Error al generar avatar",
    });
  }
});

async function startServer() {
  // Vite middleware in dev mode
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
