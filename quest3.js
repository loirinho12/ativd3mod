const prompt = require("prompt-sync")();

const base = Number(prompt("Digite o primeiro cateto (base): "));
const altura = Number(prompt("Digite o segundo cateto (altura): "));

const area = (base * altura) / 2;

console.log(`A área do triângulo retângulo é ${area}`);