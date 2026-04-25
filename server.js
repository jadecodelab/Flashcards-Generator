import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
import express from "express";
import mammoth from "mammoth";
import multer from "multer";
import OpenAI from "openai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.static(__dirname));

app.post("/api/generate-flashcards", upload.single("file"), async (req, res) => {
  const pastedNotes = String(req.body.notes || "").trim();
  const topic = String(req.body.topic || "").trim();
  const requestedCount = Number.parseInt(String(req.body.cardCount || "6"), 10);
  const cardCount = Number.isNaN(requestedCount) ? 6 : Math.min(Math.max(requestedCount, 4), 10);
  const allowedDifficulties = new Set(["easy", "medium", "hard"]);
  const difficulty = allowedDifficulties.has(String(req.body.difficulty || "medium"))
    ? String(req.body.difficulty)
    : "medium";
  let extractedNotes = "";

  if (req.file) {
    const isDocx = req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || /\.docx$/i.test(req.file.originalname);
    const isTextLike = ["text/plain", "text/markdown", "text/csv", ""].includes(req.file.mimetype) || /\.(txt|md|csv)$/i.test(req.file.originalname);

    try {
      if (isDocx) {
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        extractedNotes = result.value.trim();
      } else if (isTextLike) {
        extractedNotes = req.file.buffer.toString("utf8").trim();
      } else {
        return res.status(400).json({
          error: "Unsupported file type. Upload a .txt, .md, .csv, or .docx file."
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(400).json({
        error: "Could not read that file. Try a different document."
      });
    }
  }

  const notes = [pastedNotes, extractedNotes].filter(Boolean).join("\n\n").trim();

  if (!notes) {
    return res.status(400).json({ error: "Notes are required." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "Missing OPENAI_API_KEY. Add it to your .env file and restart the server."
    });
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const response = await openai.responses.create({
      model: "gpt-5",
      input: [
        {
          role: "developer",
          content: [
            {
              type: "input_text",
              text: `You generate concise study flashcards from class notes. Return strict JSON with a top-level key named flashcards. Each flashcard must have question and answer fields. Create exactly ${cardCount} flashcards. Difficulty level should be ${difficulty}. For easy cards, focus on definitions and direct recall. For medium cards, focus on understanding and application. For hard cards, focus on deeper reasoning, tricky distinctions, and stronger test prep. Questions should be clear and test understanding. Answers should be short and study-friendly.`
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Topic: ${topic || "General review"}\nDifficulty: ${difficulty}\nRequested flashcards: ${cardCount}\n\nNotes:\n${notes}`
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "flashcards_response",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              flashcards: {
                type: "array",
                minItems: cardCount,
                maxItems: cardCount,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    question: { type: "string" },
                    answer: { type: "string" }
                  },
                  required: ["question", "answer"]
                }
              }
            },
            required: ["flashcards"]
          }
        }
      }
    });

    const payload = JSON.parse(response.output_text);
    return res.json(payload);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: "Failed to generate flashcards. Check your API key and server logs."
    });
  }
});

app.listen(port, () => {
  console.log(`Flashcards app running at http://localhost:${port}`);
});
