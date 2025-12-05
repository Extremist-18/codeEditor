importScripts("./miniInterpreter.js");

self.onmessage = (event) => {
    const { source, input } = event.data;
    const result = runInMiniInterpreter(source, input);

    if (!result.ok && result.fallback) {
        self.postMessage({ ok: false, fallback: true });
        return;
    }
    if (result.ok) {
        self.postMessage({ ok: true, output: result.output });
        return;
    }

    self.postMessage({ ok: false, fallback: true });
};
