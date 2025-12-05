module.exports.analyzeCode = function analyzeCode(source) {
  const heavyKeywords = [
    "#include <bits/stdc++.h>",
    "#include<bits/stdc++.h>",
    "unordered_map",
    "map<",
    "set<",
    "priority_queue",
    "stack<",
    "queue<",
    "template<",
    "__gnu_pbds",
    "pbds",
    "ios::sync_with_stdio"
  ];

  for (const k of heavyKeywords) {
    if (source.includes(k)) {
      return "SERVER";
    }
  }

  if (source.split("\n").length > 200) return "SERVER";
  return "BROWSER";
};
