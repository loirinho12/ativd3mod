const prompt = require("prompt-sync")();

const vetor = [];

for (let i = 0; i < 10; i++) {
  vetor[i] = parseInt(prompt(`Digite o ${i + 1}º número inteiro: `));
}

console.log("\nNúmeros pares digitados:");
let achou = false;

for (let i = 0; i < vetor.length; i++) {
  if (vetor[i] % 2 === 0) {
    console.log(`Número ${vetor[i]} -> posição ${i}`);
    achou = true;
  }
}

if (!achou) {
  console.log("Nenhum número par foi digitado.");
}