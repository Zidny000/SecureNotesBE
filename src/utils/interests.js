// normalise: lowercase, trim, drop empties, dedupe
module.exports = function normalizeInterests(list) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.map((i) => String(i).trim().toLowerCase()).filter(Boolean))];
};
