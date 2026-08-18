// Let's implement a test harness in js directly
const UT_DEFINITIONS = [
    { id: 1, label: "UT1", keys: ["u1_co1", "u1_co2", "u1_co3", "u1_co4", "u1_co5", "u1_co6"] },
    { id: 2, label: "UT2", keys: ["u2_co1", "u2_co2", "u2_co3", "u2_co4", "u2_co5", "u2_co6"] },
    { id: 3, label: "UT3", keys: ["u3_co1", "u3_co2", "u3_co3", "u3_co4", "u3_co5", "u3_co6"] },
    { id: 4, label: "UT4", keys: ["u4_co1", "u4_co2", "u4_co3", "u4_co4", "u4_co5", "u4_co6"] },
    { id: 5, label: "UT5", keys: ["u5_co1", "u5_co2", "u5_co3", "u5_co4", "u5_co5", "u5_co6"] },
];

const config = {
  u1_co1: { maxMark: 20, co: 'co1' },
  u1_co3: { maxMark: 13, co: 'co3' },
  u2_co1: { maxMark: 20, co: 'co1' },
  u2_co3: { maxMark: 13, co: 'co3' },
  u2_co4: { maxMark: 14, co: 'co4' },
  u2_co6: { maxMark: 20, co: 'co6' },
  u3_co1: { maxMark: 20, co: 'co1' },
  u3_co3: { maxMark: 13, co: 'co3' },
  u3_co4: { maxMark: 14, co: 'co4' },
  u3_co6: { maxMark: 20, co: 'co6' },
  u4_co1: { maxMark: 20, co: 'co1' },
  u4_co2: { maxMark: 20, co: 'co2' },
  u4_co3: { maxMark: 13, co: 'co3' },
  u4_co4: { maxMark: 14, co: 'co4' },
  u4_co5: { maxMark: 20, co: 'co5' },
  u4_co6: { maxMark: 20, co: 'co6' },
  u5_co1: { maxMark: 20, co: 'co1' },
  u5_co2: { maxMark: 20, co: 'co2' },
  u5_co3: { maxMark: 13, co: 'co3' },
  u5_co4: { maxMark: 14, co: 'co4' },
  u5_co5: { maxMark: 20, co: 'co5' },
  u5_co6: { maxMark: 20, co: 'co6' }
};

const marks = {
  u1_co1: 20,
  u1_co3: 13,
  u2_co1: 20,
  u2_co3: 13,
  u2_co4: 14,
  u2_co6: 20,
  u3_co1: 20,
  u3_co3: 13,
  u3_co4: 14,
  u3_co6: 20,
  u4_co1: 15,
  u4_co2: 15,
  u4_co3: 10,
  u4_co4: 10,
  u4_co5: 15,
  u4_co6: 15,
  u5_co1: 10,
  u5_co2: 10,
  u5_co3: 5,
  u5_co4: 5,
  u5_co5: 10,
  u5_co6: 10
};

// Replicate filtering logic
const utScores = UT_DEFINITIONS.map(ut => {
    let obtained = 0;
    let max = 0;
    ut.keys.forEach(k => {
        if (config[k]) {
            max += config[k].maxMark ?? 0;
            const m = marks[k];
            if (m !== undefined && m !== null) obtained += m;
        }
    });
    const pct = max > 0 ? (obtained / max) * 100 : -1;
    return { ...ut, obtained, max, pct, hasData: max > 0 };
});

const availableUTs = utScores.filter(ut => ut.hasData);
const keepCount = Math.min(3, availableUTs.length);
const sorted = [...availableUTs].sort((a, b) => b.pct - a.pct);
const keptUTs = sorted.slice(0, keepCount);
const excludedUTs = sorted.slice(keepCount).map(ut => ut.label);
const keptKeys = new Set(keptUTs.flatMap(ut => ut.keys));

console.log("UT Percentages:");
availableUTs.forEach(ut => console.log(`${ut.label}: ${ut.pct.toFixed(2)}%`));
console.log("Kept UTs:", keptUTs.map(ut => ut.label));
console.log("Excluded UTs:", excludedUTs);
