import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
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
  "404"
]);

app.use("/assets", express.static(path.join(__dirname, "assets")));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/:page", (req, res, next) => {
  const raw = req.params.page || "";
  const normalized = raw.endsWith(".html") ? raw.slice(0, -5) : raw;
  if (HTML_PAGES.has(normalized)) {
    return res.sendFile(path.join(__dirname, `${normalized}.html`));
  }
  return next();
});

app.use((_req, res) => {
  res.status(404).sendFile(path.join(__dirname, "404.html"));
});

app.listen(PORT, HOST, () => {
  console.log(`Twin server running at http://${HOST}:${PORT}`);
});
