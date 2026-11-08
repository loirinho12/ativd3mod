const prompt = require("prompt-sync")();

const vetor = [];

for (let i = 0; i < 15; i++) {
  vetor[i] = Number(prompt(`Digite o ${i + 1}º número: `));
}

console.log("\nVetor completo:", vetor);

console.log("\nPosições com múltiplos de 10:");
let achou = false;

for (let i = 0; i < vetor.length; i++) {
  if (vetor[i] % 10 === 0) {
    console.log(`Posição ${i} -> valor ${vetor[i]}`);
    achou = true;
  }
}

if (!achou) {
  console.log("Nenhum múltiplo de 10 foi digitado.");
}