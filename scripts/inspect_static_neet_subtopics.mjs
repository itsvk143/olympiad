import neetPkg from "../src/data/exams/neet.js";
const { generateNeetTests, neetTests } = neetPkg;

const tests = typeof generateNeetTests === 'function' ? generateNeetTests() : neetTests;
const botSub = tests.filter(t => t.type === "SUBTOPIC" && t.subject === "Botany");
const zooSub = tests.filter(t => t.type === "SUBTOPIC" && t.subject === "Zoology");

console.log("Static Botany SUBTOPIC tests count:", botSub.length);
console.log("Static Zoology SUBTOPIC tests count:", zooSub.length);
console.log("Total Static Biology SUBTOPIC tests:", botSub.length + zooSub.length);

console.log("\nBotany chapters and their subtopic tests:");
const botByChap = {};
for (const t of botSub) {
  botByChap[t.chapter] = botByChap[t.chapter] || [];
  botByChap[t.chapter].push({ id: t.id, title: t.title });
}
console.log(JSON.stringify(botByChap, null, 2));

console.log("\nZoology chapters and their subtopic tests:");
const zooByChap = {};
for (const t of zooSub) {
  zooByChap[t.chapter] = zooByChap[t.chapter] || [];
  zooByChap[t.chapter].push({ id: t.id, title: t.title });
}
console.log(JSON.stringify(zooByChap, null, 2));
