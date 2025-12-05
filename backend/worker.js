const { Worker } = require("bullmq");
const path = require("path");
const fs = require("fs");
const { judgeDocker } = require("./judgeDocker");
const Redis = require("ioredis");

const connection = new Redis({
  host: process.env.REDIS_HOST || "redis",
  port: 6379,
  maxRetriesPerRequest: null,
});

const DB_PATH = path.join(__dirname, "data", "submissions.json");

function loadDB() {
  if (!fs.existsSync(DB_PATH)) return [];
  return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

new Worker(
  "judge-queue",
  async (job) => {
    const { source, problemId, user, srcHash } = job.data;

    console.log("Processing job:", job.id, "user:", user, "problem:", problemId);

    try {
      const result = await judgeDocker(source, problemId);

      const db = loadDB();
      db.push({
        user,
        problemId,
        verdict: result.verdict,
        timeMs: result.timeMs,
        srcHash,
        ts: Date.now(),
      });
      saveDB(db);
      return {
        ok: true,
        ...result,
      };
    } catch (err) {
      console.error("Judge failed for job", job.id, err);

      return {
        ok: false,
        verdict: "INTERNAL_ERROR",
        error: err.message,
        stack: err.stack,
      };
    }
  },
  { connection }
);

console.log("Judge worker is running...");
