const prompt = require("prompt-sync")();

const latas = Number(prompt("Quantas latas de 350 ml? "));
const garrafas600 = Number(prompt("Quantas garrafas de 600 ml? "));
const garrafas2L = Number(prompt("Quantas garrafas de 2 litros? "));

const totalMl = latas * 350 + garrafas600 * 600;
const totalLitros = totalMl / 1000 + garrafas2L * 2;

console.log(`O comerciante comprou ${totalLitros} litros de refrigerante.`);