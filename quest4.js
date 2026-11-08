const prompt = require("prompt-sync")();

const vetor = [];
const tamanho = Number(prompt("Quantos números terá o vetor? "));

for (let i = 0; i < tamanho; i++) {
  vetor[i] = Number(prompt(`Digite o número da posição ${i}: `));
}

const procurado = Number(prompt("Digite o número que deseja procurar: "));

let encontrou = false;

for (let i = 0; i < vetor.length; i++) {
  if (vetor[i] === procurado) {
    console.log(`O número ${procurado} existe na posição ${i}`);
    encontrou = true;
  }
}

if (!encontrou) {
  console.log(`O número ${procurado} não existe no vetor.`);
}