const fs = require("fs");
const path = require("path");
const { runWasm } = require("./runWasm");

async function judgeProblem(problemId, wasmBuffer) {
    const problemDir = path.join(__dirname, "problems", problemId);

    if (!fs.existsSync(problemDir)) {
        throw new Error("Problem does not exist: " + problemId);
    }

    const metadata = JSON.parse(
        fs.readFileSync(path.join(problemDir, "metadata.json"))
    );

    const tlimit = metadata.timeLimitMs || 2000;
    const inputDir = path.join(problemDir, "input");
    const outputDir = path.join(problemDir, "output");
    const testFiles = fs.readdirSync(inputDir).filter(f => f.endsWith(".txt"));

    let maxTime = 0;

    for (const file of testFiles) {
        const input = fs.readFileSync(path.join(inputDir, file), "utf8");
        const expected = fs.readFileSync(path.join(outputDir, file), "utf8").trim();

        const start = Date.now();
        const result = await runWasm(wasmBuffer, input, tlimit);
        const elapsed = Date.now() - start;

        maxTime = Math.max(maxTime, elapsed);

        if (result.status !== "OK") {
        return {
            verdict: result.status,
            testcase: file,
            timeMs: elapsed
        };
        }

        const got = result.stdout.trim();
        if (got !== expected) {
        return {
            verdict: "WA",
            testcase: file,
            input,
            got,
            expected,
            timeMs: elapsed
        };
        }
    }

    return {
        verdict: "OK",
        timeMs: maxTime
    };
}

module.exports = { judgeProblem };
