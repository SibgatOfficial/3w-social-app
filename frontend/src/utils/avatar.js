const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #1685ff, #7c5cff)",
  "linear-gradient(135deg, #ff9f1c, #ff3b5c)",
  "linear-gradient(135deg, #21d4a2, #1685ff)",
  "linear-gradient(135deg, #f759ab, #7c5cff)",
  "linear-gradient(135deg, #ffd800, #ff9f1c)",
  "linear-gradient(135deg, #4fe3c1, #21d4a2)",
];

// Deterministic gradient per username — same user always gets the same color
export function gradientFor(name = "") {
  let hash = 0;
  for (const ch of name) {
    hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  }
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}