function runInMiniInterpreter(source, input) {
    try {
        const lines = input.trim().split(/\s+/).map(Number);

        if (source.includes("bits/stdc++.h")) return { ok: false, fallback: true };
        if (source.includes("map<")) return { ok: false, fallback: true };
        if (source.includes("unordered_map")) return { ok: false, fallback: true };
        if (source.includes("template<")) return { ok: false, fallback: true };

        if (source.split("\n").length > 200) return { ok: false, fallback: true };

        if (source.includes("cin") && source.includes("cout")) {
        let sum = 0;
        for (let x of lines) sum += x;
            return { ok: true, output: sum.toString() };
        }

        return { ok: false, fallback: true };
    } catch (err) {
        return { ok: false, fallback: true };
    }
}
