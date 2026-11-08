const prompt = require("prompt-sync")();

const cavalos = Number(prompt("Quantos cavalos foram comprados? "));
const ferraduras = cavalos * 4;

console.log(`Para equipar ${cavalos} cavalo(s) são necessárias ${ferraduras} ferraduras.`);