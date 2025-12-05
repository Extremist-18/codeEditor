const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function run(cmd, args, opts = {}) {
    const r = spawnSync(cmd, args, { encoding: "utf8", ...opts });
    if (r.error) throw new Error(r.error.message);
    return r;
}

function judgeDocker(source, problemId) {
    const problemDir = path.join(__dirname, "problems", problemId);
    const meta = JSON.parse(fs.readFileSync(path.join(problemDir, "metadata.json"), "utf8"));

    const timeLimitMs = meta.timeLimitMs || 2000;
    const inputDir = path.join(problemDir, "input");
    const outputDir = path.join(problemDir, "output");
    const base = path.join(__dirname, "judge-tmp");
    if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });

    const caseDir = fs.mkdtempSync(path.join(base, "case-"));
    const hostCpp = path.join(caseDir, "main.cpp");
    fs.writeFileSync(hostCpp, source);

    const container = "cpp-runner-persist";

    if (run("docker", ["ps", "-aq", "-f", `name=${container}`]).stdout.trim() === "") {
        run("docker", ["run", "-d", "--name", container, "cpp-runner", "tail", "-f", "/dev/null"]);
    }

    run("docker", ["cp", hostCpp, `${container}:/sandbox/main.cpp`]);
    const comp = run("docker", ["exec", container, "bash", "-c",
        "g++ -std=c++17 /sandbox/main.cpp -O2 -o /sandbox/a.out 2> /sandbox/err.txt"
    ]);

    if (comp.status !== 0) {
        const err = run("docker", ["exec", container, "cat", "/sandbox/err.txt"]);
        return { verdict: "RE", stderr: err.stdout };
    }

    let maxTime = 0;
    const tests = fs.readdirSync(inputDir).filter(f => f.endsWith(".txt")).sort();

    for (const t of tests) {
        const inp = fs.readFileSync(path.join(inputDir, t), "utf8");
        const expected = fs.readFileSync(path.join(outputDir, t), "utf8").trim();
     
        const inputFile = path.join(caseDir, "input.txt");
        fs.writeFileSync(inputFile, inp);
        run("docker", ["cp", inputFile, `${container}:/sandbox/input.txt`]);

        const start = Date.now();
        const runResult = run("docker", [
            "exec", container, "bash", "-c",
            `timeout ${timeLimitMs / 1000}s /sandbox/a.out < /sandbox/input.txt`
        ]);
        const elapsed = Date.now() - start;
        maxTime = Math.max(maxTime, elapsed);

        if (runResult.status !== 0) {
            return { verdict: "RE", testcase: t, stderr: runResult.stderr || "Runtime error", timeMs: elapsed };
        }

        const got = (runResult.stdout || "").trim();
        if (got !== expected) {
            return { verdict: "WA", testcase: t, got, expected, timeMs: elapsed };
        }
    }

    return { verdict: "OK", timeMs: maxTime };
}

module.exports = { judgeDocker };
