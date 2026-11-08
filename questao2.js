const prompt = require("prompt-sync")();

const numero = Number(prompt("Digite um número real: "));
const sextaParte = numero / 6;

console.log(`A sexta parte de ${numero} é ${sextaParte}`);