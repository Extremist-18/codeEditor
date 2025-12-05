const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const WASI_CLANG = "/opt/homebrew/opt/wasi-sdk/bin/clang++";
const WASI_SYSROOT = "/opt/homebrew/opt/wasi-sdk/share/wasi-sysroot";

function compileCppToWasm(source) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "icpc-"));
    const srcPath = path.join(tmpDir, "main.cpp");
    const outPath = path.join(tmpDir, "prog.wasm");
    fs.writeFileSync(srcPath, source);
    const args = [
      `--sysroot=${WASI_SYSROOT}`,
      "--target=wasm32-wasi",
      "-O2",
      srcPath,
      "-o",
      outPath
    ];

    const result = spawnSync(WASI_CLANG, args, { encoding: "utf8" });

    if (result.status !== 0) {
      const err = new Error("Compilation failed");
      err.stderr = result.stderr;
      throw err;
    }
    return fs.readFileSync(outPath);
}

module.exports = { compileCppToWasm };
