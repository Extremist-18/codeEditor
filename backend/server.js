const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors"); 
const fs = require("fs");
const path = require("path");
const { judgeDocker } = require("./judgeDocker");
const { judgeQueue } = require("./queue");
const crypto = require("crypto");
const { analyzeCode } = require("./analyzer");

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "2mb" }));

const PORT = 3000;
function hashSource(src) {
    return crypto.createHash("sha256").update(src).digest("hex");
}

app.post("/api/analyze", (req, res) => {
    const { source } = req.body || {};
    if (!source) {
        return res.status(400).json({ ok: false, error: "No source provided" });
    }

    const mode = analyzeCode(source);
    res.json({ ok: true, mode });
});

app.get("/api/problems", (req, res) => {
    const problemsDir = path.join(__dirname, "problems");

    if (!fs.existsSync(problemsDir)) {
        return res.json({ ok: true, problems: [] });
    }
    const problemIds = fs.readdirSync(problemsDir).filter(id =>
        fs.statSync(path.join(problemsDir, id)).isDirectory()
    );

    const problems = problemIds.map(id => {
        const metaPath = path.join(problemsDir, id, "metadata.json");
        if (!fs.existsSync(metaPath)) return null;

        try {
            const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
            return {
                id,
                title: meta.title || id,
                timeLimitMs: meta.timeLimitMs || 2000,
                memoryLimitMb: meta.memoryLimitMb || 256
            };
        } catch {
            return null;
        }
    }).filter(Boolean);
    res.json({ ok: true, problems });
});


app.get("/api/problem/:id", (req, res) => {
    const id = req.params.id;
    const metaPath = path.join(__dirname, "problems", id, "metadata.json");

    if (!fs.existsSync(metaPath)) {
        return res.status(404).json({ ok: false, error: "Problem not found" });
    }

    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    res.json({ ok: true, problem: meta });
});

app.get("/api/problem/:id/statement", (req, res) => {
    const id = req.params.id;
    const statementPath = path.join(__dirname, "problems", id, "statement.md");

    if (!fs.existsSync(statementPath)) {
        return res.status(404).json({ ok: false, error: "Statement not found" });
    }

    const statement = fs.readFileSync(statementPath, "utf8");
    res.json({ ok: true, statement });
});


app.post("/api/judge", async (req, res) => {
    const { source, problemId, user } = req.body || {};

    if (!source || !problemId || !user) {
        return res.status(400).json({ ok: false, error: "Missing fields" });
    }

    const srcHash = hashSource(source);
    const DB_PATH = path.join(__dirname, "data", "submissions.json");
    let db = [];
    if (fs.existsSync(DB_PATH)) {
        db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
    }
    const RECENT_LIMIT = 20;
    const recent = db.slice(-RECENT_LIMIT);

    const duplicate = recent.find(
        (sub) =>
        sub.user === user &&
        sub.problemId === problemId &&
        sub.srcHash === srcHash
    );

    if (duplicate) {
        return res.json({
        ok: false,
        error: "You already submitted this exact code for this problem."
        });
    }

    const job = await judgeQueue.add("submission", {
        source,
        problemId,
        user,
        srcHash
    });
    res.json({ ok: true, jobId: job.id });
});


app.get("/api/judge/status/:id", async (req, res) => {
    const id = req.params.id;
    const job = await judgeQueue.getJob(id);

    if (!job) {
        return res.status(404).json({ ok: false, error: "job not found" });
    }

    const state = await job.getState();  
    const result = job.returnvalue;

    res.json({
        ok: true,state,result
    });
});

const DB_PATH = path.join(__dirname, "data", "submissions.json");
function loadDB() {
    if (!fs.existsSync(DB_PATH)) return [];
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function saveDB(db) {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}
app.post("/api/submit", (req, res) => {
    const { user, problemId, verdict, timeMs } = req.body || {};
    if (!user || !problemId || !verdict) {
        return res.status(400).json({ ok: false, error: "Missing fields" });
    }

    const db = loadDB();
    db.push({
        user,
        problemId,
        verdict,
        timeMs: timeMs ?? null,
        ts: Date.now()
    });
    saveDB(db);

    res.json({ ok: true });
});


app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
