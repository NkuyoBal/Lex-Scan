import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    engine: "PDF to Word Multi-Tesseract Studio",
  });
});

// API endpoint for AI-assisted Document Structure and Table Layout Enhancement
app.post("/api/ocr/enhance-structure", async (req, res) => {
  try {
    const { imageBase64, ocrRawText, languageCombination } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      // Return unenhanced if no key
      return res.json({
        success: false,
        message: "Gemini API key not configured. Using local Tesseract multi-library parsing engine.",
        enhanced: null,
      });
    }

    const prompt = `You are an expert Document Layout and Structure Reconstruction engine. 
Analyze the provided document page image and the extracted OCR raw text (${languageCombination || "multi-lingual"}).
Your mission is to reconstruct the exact document hierarchy so it can be converted to a high-fidelity Microsoft Word (.docx) document.

Extracted OCR Raw Text Reference:
"""
${ocrRawText ? ocrRawText.slice(0, 3000) : "No raw text provided"}
"""

Return a strict JSON object with this structure:
{
  "pageTitle": "string or null",
  "languageDetected": "string",
  "elements": [
    {
      "type": "heading1" | "heading2" | "heading3" | "paragraph" | "table" | "bullet_list" | "numbered_list" | "callout" | "image_placeholder",
      "text": "content text (for headings, paragraphs, lists, callout)",
      "bold": boolean,
      "italic": boolean,
      "alignment": "left" | "center" | "right" | "justify",
      "tableData": {
        "headers": ["Col 1", "Col 2", ...],
        "rows": [
          ["Row 1 Col 1", "Row 1 Col 2", ...],
          ...
        ]
      },
      "listItems": ["Item 1", "Item 2"],
      "imageCaption": "Optional image description"
    }
  ]
}

Ensure all tables have clean, aligned rows and columns. Ensure headings match original text. Format correctly for Word doc generation.`;

    const contents: any[] = [{ text: prompt }];

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
      contents.push({
        inlineData: {
          mimeType: "image/png",
          data: cleanBase64,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: { parts: contents },
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const responseText = response.text || "{}";
    const parsed = JSON.parse(responseText);

    res.json({
      success: true,
      enhanced: parsed,
    });
  } catch (error: any) {
    console.error("Structure enhancement error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process structure enhancement",
    });
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
