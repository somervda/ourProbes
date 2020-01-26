export function enumToMap(e): { key: number; value: string }[] {
  // Converts a enum with numeric key values to a array of key/value
  // pairs, mostly for use in creating select control content
  let map: { key: number; value: string }[] = [];

  for (var n in e) {
    if (typeof e[n] === "number") {
      map.push({ key: <any>e[n], value: n });
    }
  }
  return map;
}
