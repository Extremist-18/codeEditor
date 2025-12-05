const { WASI } = require("wasi");
const fs = require("fs");

async function runWasm(wasmBuffer, inputStr = "", timeLimitMs = 2000) {
    const wasi = new WASI({
        args: [],
        env: {},
        stdin: new Uint8Array(Buffer.from(inputStr)),
        stdout: new Uint8Array(),
        stderr: new Uint8Array()
    });

    const module = await WebAssembly.compile(wasmBuffer);
    const instance = await WebAssembly.instantiate(module, {
        wasi_snapshot_preview1: wasi.wasiImport
    });
    let timedOut = false;
    return await new Promise((resolve) => {
        const timer = setTimeout(() => {
        timedOut = true;
        resolve({ status: "TLE", stdout: "", stderr: "" });
        }, timeLimitMs);

        try {
        wasi.start(instance);
        if (!timedOut) {
            clearTimeout(timer);
            resolve({
            status: "OK",
            stdout: Buffer.from(wasi.getStdoutBuffer()).toString(),
            stderr: Buffer.from(wasi.getStderrBuffer()).toString()
            });
        }
        } catch (e) {
            clearTimeout(timer);
            resolve({
            status: "RE",
            stdout: "",
            stderr: String(e)
            });
        }
    });
}
module.exports = { runWasm };
