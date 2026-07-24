import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

export async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Google Gemini API Initialisation
  let ai: GoogleGenAI | null = null;
  function getAI() {
    if (!ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY must be defined in the environment.");
      }
      ai = new GoogleGenAI({ apiKey });
    }
    return ai;
  }

  // Serve Logo Image Directly for Manifest and PWAs
  app.get("/logo.jpg", (req, res) => {
    res.sendFile(path.join(process.cwd(), "src/assets/images/formflow_ai_logo_1784669877363.jpg"));
  });

  // PWA Manifest and Service Worker Endpoint
  app.get("/manifest.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.json({
      name: "FormFlow AI",
      short_name: "FormFlow",
      description: "Créateur intelligent de Google Forms assisté par l'IA",
      start_url: "/",
      display: "standalone",
      background_color: "#f8fafc",
      theme_color: "#2563eb",
      orientation: "portrait",
      icons: [
        {
          src: "/logo.jpg",
          sizes: "192x192",
          type: "image/jpeg",
          purpose: "any maskable"
        },
        {
          src: "/logo.jpg",
          sizes: "512x512",
          type: "image/jpeg",
          purpose: "any"
        }
      ]
    });
  });

  app.get("/sw.js", (req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    res.send(`
      const CACHE_NAME = 'formflow-cache-v1';
      const ASSETS = [
        '/',
        '/index.html',
        '/logo.jpg'
      ];

      self.addEventListener('install', (event) => {
        event.waitUntil(
          caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS).catch(() => {});
          })
        );
      });

      self.addEventListener('fetch', (event) => {
        // Only handle GET requests
        if (event.request.method !== 'GET') return;
        
        event.respondWith(
          fetch(event.request)
            .then((response) => {
              // Cache dynamic assets if needed
              return response;
            })
            .catch(() => {
              return caches.match(event.request);
            })
        );
      });
    `);
  });

  // API endpoint to generate form structure
  app.post("/api/generate-form", async (req, res) => {
    try {
      const { prompt, theme } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Le prompt est requis." });
      }

      const client = getAI();

      const promptSystem = `Tu es un expert en conception de questionnaires, de sondages et de formulaires de satisfaction.
Génère un formulaire Google Forms intelligent, structuré, pertinent et complet en français à partir du sujet suivant : "${prompt}".
Le ton/thème recherché est : "${theme || 'professionnel'}".

Tu dois renvoyer obligatoirement un objet JSON correspondant au schéma fourni.
Chaque question doit posséder un type approprié parmi :
- "RADIO" (choix unique, ex: Oui/Non, tranches d'âges, choix exclusifs)
- "CHECKBOX" (choix multiples, ex: centres d'intérêt, options cumulables)
- "DROP_DOWN" (liste déroulante, ex: pays, départements, notation simple)
- "TEXT" (réponse courte, ex: nom, prénom, email, profession)
- "PARAGRAPH" (réponse longue, ex: commentaires, suggestions libres)

Fais en sorte que le formulaire contienne entre 5 et 10 questions pertinentes, bien espacées, cohérentes et qui couvrent bien le sujet demandé de manière professionnelle. Rédige de superbes descriptions pour le formulaire et les questions si nécessaire.`;

      const response = await client.models.generateContent({
        model: "gemini-2.5-flash",
        contents: promptSystem,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              description: { type: "STRING" },
              questions: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    title: { type: "STRING" },
                    description: { type: "STRING" },
                    type: { type: "STRING", enum: ["RADIO", "CHECKBOX", "DROP_DOWN", "TEXT", "PARAGRAPH"] },
                    required: { type: "BOOLEAN" },
                    options: {
                      type: "ARRAY",
                      items: { type: "STRING" }
                    }
                  },
                  required: ["title", "type", "required"]
                }
              }
            },
            required: ["title", "description", "questions"]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Gemini a retourné une réponse vide.");
      }

      const formStructure = JSON.parse(responseText);
      res.json(formStructure);
    } catch (error: any) {
      console.error("Erreur de génération de formulaire:", error);
      res.status(500).json({ error: error.message || "Une erreur est survenue lors de la génération." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.FIREBASE_CONFIG) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, Firebase Hosting serves the static files.
    // The function only handles the API and manifest generation.
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}

// Start Server
if (!process.env.VERCEL) {
  startServer().then((app) => {
    const PORT = process.env.PORT || 8080;
    app.listen(PORT as number, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
}
