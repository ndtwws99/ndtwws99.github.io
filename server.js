import express from "express";
import path from "path";
import fs from "fs";
import zlib from "zlib";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.disable("x-powered-by");
const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";

const HTML_PAGES = new Set([
  "index",
  "login",
  "friends",
  "groups",
  "pages",
  "messages",
  "profile",
  "saved",
  "reels",
  "help",
  "404"
]);

const MIME_BY_EXT = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

// Lightweight in-memory gzip cache keyed by file path + mtime/size so edits reflect immediately
const GZIP_CACHE = new Map();

function sendCompressedFile(req, res, filePath, statusCode = 200) {
  fs.stat(filePath, (statErr, stat) => {
    if (statErr || !stat.isFile()) {
      return res.status(404).end();
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_BY_EXT[ext];
    const etag = `W/"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;

    res.setHeader("ETag", etag);
    res.setHeader("Last-Modified", stat.mtime.toUTCString());
    res.setHeader("Cache-Control", "no-cache, must-revalidate");
    res.setHeader("Vary", "Accept-Encoding");
    if (contentType) res.setHeader("Content-Type", contentType);

    if (statusCode === 200 && req.headers["if-none-match"] === etag) {
      return res.status(304).end();
    }

    const acceptsGzip = /\bgzip\b/i.test(String(req.headers["accept-encoding"] || ""));
    if (!acceptsGzip || !contentType || stat.size < 1024) {
      return res.status(statusCode).sendFile(filePath);
    }

    const cached = GZIP_CACHE.get(filePath);
    if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) {
      res.setHeader("Content-Encoding", "gzip");
      res.setHeader("Content-Length", String(cached.buf.length));
      return res.status(statusCode).end(req.method === "HEAD" ? undefined : cached.buf);
    }

    fs.readFile(filePath, (readErr, raw) => {
      if (readErr) return res.status(500).end();
      zlib.gzip(raw, { level: 6 }, (gzErr, gzBuf) => {
        if (gzErr) {
          return res.status(statusCode).end(req.method === "HEAD" ? undefined : raw);
        }
        if (GZIP_CACHE.size > 64) GZIP_CACHE.clear();
        GZIP_CACHE.set(filePath, { mtimeMs: stat.mtimeMs, size: stat.size, buf: gzBuf });
        res.setHeader("Content-Encoding", "gzip");
        res.setHeader("Content-Length", String(gzBuf.length));
        return res.status(statusCode).end(req.method === "HEAD" ? undefined : gzBuf);
      });
    });
  });
}

app.use(express.json({ limit: "256kb" }));

// Fast gzip delivery for compressible static text files under /assets
app.use("/assets", (req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  const relPath = decodeURIComponent(req.path || "").replace(/^\/+/, "");
  const ext = path.extname(relPath).toLowerCase();
  if (!MIME_BY_EXT[ext]) return next();
  const assetsRoot = path.resolve(__dirname, "assets");
  const resolved = path.resolve(assetsRoot, relPath);
  if (!resolved.startsWith(assetsRoot + path.sep)) return next();
  if (!fs.existsSync(resolved)) return next();
  return sendCompressedFile(req, res, resolved, 200);
});

app.use(
  "/assets",
  express.static(path.join(__dirname, "assets"), {
    etag: true,
    lastModified: true,
    maxAge: 0,
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "no-cache, must-revalidate");
    }
  })
);

// Simple per-IP in-memory rate limit for Gemini endpoint (30 requests / 60s)
const geminiRateBucket = new Map();
function checkGeminiRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxReq = 30;
  const entry = geminiRateBucket.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count += 1;
  geminiRateBucket.set(ip, entry);
  if (geminiRateBucket.size > 2000) {
    for (const [key, val] of geminiRateBucket.entries()) {
      if (now > val.resetAt) geminiRateBucket.delete(key);
    }
  }
  return entry.count <= maxReq;
}

function getGeminiClient() {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}

const TWIN_GEMINI_SYSTEM_INSTRUCTION =
  "Bạn là trợ lý AI Gemini tích hợp trực tiếp trên mạng xã hội Twin. " +
  "Hãy trả lời bằng tiếng Việt tự nhiên, rõ ràng, súc tích và thân thiện. " +
  "Bạn có thể giúp người dùng viết bài đăng, tạo mã HTML đẹp và an toàn cho bài viết Twin, " +
  "gợi ý câu trả lời tin nhắn, tóm tắt thông tin và giải đáp thắc mắc hằng ngày.";

app.post("/api/gemini/chat", async (req, res) => {
  const clientIp = req.ip || req.socket?.remoteAddress || "unknown";
  if (!checkGeminiRateLimit(clientIp)) {
    return res.status(429).json({
      error: "Bạn đang gửi yêu cầu quá nhanh. Vui lòng đợi một lát rồi thử lại."
    });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({
      error: "Chưa cấu hình khóa Gemini API trên máy chủ. Vui lòng kiểm tra trong mục Settings > Secrets."
    });
  }

  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const rawMessages = Array.isArray(body.messages) ? body.messages : null;
    const rawPrompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

    let contents = [];
    if (rawMessages && rawMessages.length > 0) {
      contents = rawMessages
        .slice(-20)
        .map((m) => {
          const role = m?.role === "model" ? "model" : "user";
          const text = typeof m?.text === "string" ? m.text.trim().slice(0, 4000) : "";
          return text ? { role, parts: [{ text }] } : null;
        })
        .filter(Boolean);
    } else if (rawPrompt) {
      contents = [{ role: "user", parts: [{ text: rawPrompt.slice(0, 4000) }] }];
    }

    if (!contents.length || contents[contents.length - 1].role !== "user") {
      return res.status(400).json({ error: "Vui lòng nhập nội dung câu hỏi cho Gemini." });
    }

    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents,
      config: {
        systemInstruction: TWIN_GEMINI_SYSTEM_INSTRUCTION
      }
    });

    const reply = (response.text || "").trim();
    if (!reply) {
      return res.status(502).json({
        error: "Gemini chưa trả về nội dung phù hợp. Hãy thử diễn đạt lại câu hỏi."
      });
    }

    return res.json({ reply });
  } catch (err) {
    const status = Number(err?.status || err?.code) || 500;
    const msg = String(err?.message || "");
    console.error("Gemini API error:", status, msg);

    if (status === 400 || status === 401 || status === 403 || /API_KEY_INVALID|PERMISSION_DENIED/i.test(msg)) {
      return res.status(status >= 400 && status < 500 ? status : 403).json({
        error: "Khóa Gemini API không hợp lệ hoặc thiếu quyền. Hãy kiểm tra lại trong Settings > Secrets."
      });
    }
    if (status === 429 || /RESOURCE_EXHAUSTED/i.test(msg)) {
      return res.status(429).json({
        error: "Hệ thống Gemini đang quá tải hoặc hết hạn mức tạm thời. Vui lòng thử lại sau."
      });
    }
    return res.status(500).json({
      error: "Không thể kết nối tới AI Gemini lúc này. Vui lòng thử lại sau."
    });
  }
});

app.get("/", (req, res) => {
  sendCompressedFile(req, res, path.join(__dirname, "index.html"), 200);
});

app.get("/:page", (req, res, next) => {
  const raw = req.params.page || "";
  const normalized = raw.endsWith(".html") ? raw.slice(0, -5) : raw;
  if (HTML_PAGES.has(normalized)) {
    return sendCompressedFile(req, res, path.join(__dirname, `${normalized}.html`), 200);
  }
  return next();
});

app.use((req, res) => {
  sendCompressedFile(req, res, path.join(__dirname, "404.html"), 404);
});

app.listen(PORT, HOST, () => {
  console.log(`Twin server running at http://${HOST}:${PORT}`);
});
