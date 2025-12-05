let editor;

require.config({
    paths: {
        'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs'
    }
});

require(["vs/editor/editor.main"], function () {
    editor = monaco.editor.create(document.getElementById("editor"), {
        value: `#include <bits/stdc++.h>
using namespace std;

int main() {
    
    return 0;
}`,
        language: "cpp",
        theme: "vs-dark",
        fontSize: 14,
        automaticLayout: true,
        minimap: { enabled: true }
    });
});


const API_BASE = "http://localhost:3000";

const runBtn = document.getElementById("runBtn");
const submitBtn = document.getElementById("submitBtn");
const outputBox = document.getElementById("output");
const statusBox = document.getElementById("status");
const problemSelect = document.getElementById("problemSelect");
const problemMeta = document.getElementById("problemMeta");
const problemStatementBox = document.getElementById("problemStatement");
const currentModeBadge = document.getElementById("currentMode");

function getUser() {
    const v = document.getElementById("username").value.trim();
    return v || "guest_user";
}

function getProblemId() {
    return problemSelect.value;
}

async function fetchJSON(url, options) {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));
    return data;
}

async function loadProblems() {
    try {
        const data = await fetchJSON(`${API_BASE}/api/problems`);
        if (!data.ok) {
            problemStatementBox.textContent = "Failed to load problems: " + (data.error || "Unknown error");
        return;
        }

        problemSelect.innerHTML = "";
        for (const p of data.problems) {
            const opt = document.createElement("option");
            opt.value = p.id;
            opt.textContent = `${p.id} – ${p.title}`;
            problemSelect.appendChild(opt);
        }

        if (data.problems.length > 0) {
            updateProblemMeta();
            await loadProblemStatement(getProblemId());
        } else {
            problemStatementBox.textContent = "No problems configured on server.";
        }
    } catch (err) {
        console.error(err);
        problemStatementBox.textContent = "Error loading problems: " + err.message;
    }
}

async function loadProblemStatement(problemId) {
    problemMeta.textContent = `ID: ${problemId}`;
    try {
        const res = await fetchJSON(`${API_BASE}/api/problem/${problemId}/statement`);
        if (res.ok && res.statement) {
            problemStatementBox.textContent = res.statement;
        } else {
            const meta = await fetchJSON(`${API_BASE}/api/problem/${problemId}`);
            if (meta.ok && meta.problem) {
                const m = meta.problem;
                problemStatementBox.textContent =
                `${m.title || "Problem " + problemId}\n\n` +
                (m.description || "Problem statement not available. Check metadata.json.");
            } else {
                problemStatementBox.textContent = "No statement available.";
            }
        }
    } catch (err) {
        console.error(err);
        problemStatementBox.textContent = "Error loading statement: " + err.message;
    }
}

function updateProblemMeta() {
    const pid = getProblemId();
    problemMeta.textContent = `ID: ${pid}`;
}

problemSelect.addEventListener("change", () => {
    updateProblemMeta();
    loadProblemStatement(getProblemId());
});

async function waitForJudgeResult(jobId) {
    statusBox.textContent = `Job ${jobId}: queued…`;

    while (true) {
        const data = await fetchJSON(`${API_BASE}/api/judge/status/${jobId}`);

        if (!data.ok) {
            statusBox.textContent = `Job ${jobId}: error – ${data.error || "Unknown"}`;
            return null;
        }
        const { state, result } = data;
        if (state === "waiting") {
            statusBox.textContent = `Job ${jobId}: waiting in queue…`;
        } else if (state === "active") {
            statusBox.textContent = `Job ${jobId}: running in sandbox…`;
        } else if (state === "completed") {
            statusBox.textContent = `Job ${jobId}: completed.`;
            return result;
        } else if (state === "failed") {
            statusBox.textContent = `Job ${jobId}: failed.`;
            return result || null;
        }
        await new Promise((r) => setTimeout(r, 800));
    }
}

async function runOnServer(source, problemId, user) {
    currentModeBadge.textContent = "SERVER";
    outputBox.textContent = "";
    statusBox.textContent = "Enqueuing submission on server…";

    const payload = { source, problemId, user };

    const enqueueRes = await fetchJSON(`${API_BASE}/api/judge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!enqueueRes.ok) {
        statusBox.textContent = "Failed to enqueue submission.";
        outputBox.textContent = enqueueRes.error || "Unknown error";
        return;
    }

    const jobId = enqueueRes.jobId;
    if (!jobId) {
        statusBox.textContent = "No jobId returned by server.";
        outputBox.textContent = JSON.stringify(enqueueRes, null, 2);
        return;
    }

    const result = await waitForJudgeResult(jobId);
    outputBox.textContent = JSON.stringify(result, null, 2);
}

runBtn.onclick = async () => {
    // const source = document.getElementById("code").value;
    const source = editor.getValue();

    const input = document.getElementById("input").value;
    const user = getUser();
    const problemId = getProblemId();

    outputBox.textContent = "";
    statusBox.textContent = "Analyzing code for hybrid execution…";
    currentModeBadge.textContent = "Analyzing";
    const analyzeRes = await fetchJSON(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source })
    });

    if (!analyzeRes.ok) {
        statusBox.textContent = "Analyze failed – using server judge.";
        await runOnServer(source, problemId, user);
        return;
    }

    const mode = analyzeRes.mode;
    currentModeBadge.textContent = mode || "UNKNOWN";
    if (mode === "SERVER") {    // if SERVER then just go there
        statusBox.textContent = "Code classified as heavy. Using server sandbox.";
        await runOnServer(source, problemId, user);
        return;
    }

  // Otherwise try browser first
    statusBox.textContent = "Attempting browser execution…";

    try {
        const worker = new Worker("worker.js");
        let finished = false;
        const timeoutMs = 300; 
        const timeoutId = setTimeout(async () => {
            if (finished) return;
            finished = true;
            worker.terminate();

            currentModeBadge.textContent = "SERVER";
            statusBox.textContent = "Browser too slow. Falling back to server judge.";

            await runOnServer(source, problemId, user);
        }, timeoutMs);

        worker.postMessage({ source, input });
        worker.onmessage = async (event) => {
            if (finished) return;
            finished = true;
            clearTimeout(timeoutId);

            
            if (event.data.ok) {
                currentModeBadge.textContent = "BROWSER";
                statusBox.textContent = "Executed in browser sandbox (not official judge).";
                outputBox.textContent =
                "Browser Output (custom input):\n" + event.data.output;
                worker.terminate();
                return;
            }
            if (event.data.fallback) {
                currentModeBadge.textContent = "SERVER";
                statusBox.textContent =
                "Browser rejected code. Falling back to server.";
                worker.terminate();
                await runOnServer(source, problemId, user);
                return;
            }

            currentModeBadge.textContent = "SERVER";
            statusBox.textContent =
            "Unexpected browser behavior. Falling back to server judge.";
            worker.terminate();
            await runOnServer(source, problemId, user);
        };
    } catch (err) {
        console.error(err);
        currentModeBadge.textContent = "SERVER";
        statusBox.textContent =
        "Browser worker error. Using server sandbox instead.";
        await runOnServer(source, problemId, user);
    }

};

submitBtn.onclick = async () => {
    const source = editor.getValue();
    const user = getUser();
    const problemId = getProblemId();

    currentModeBadge.textContent = "SERVER";
    statusBox.textContent = "Submitting to full judge (server sandbox)…";
    outputBox.textContent = "";

    await runOnServer(source, problemId, user);
};

loadProblems();
