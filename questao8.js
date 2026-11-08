const prompt = require("prompt-sync")();

const idades = [];

for (let i = 0; i < 8; i++) {
  idades[i] = Number(prompt(`Digite a idade da ${i + 1}ª pessoa: `));
}

// a) Média de idade
let soma = 0;
for (let i = 0; i < idades.length; i++) {
  soma += idades[i];
}
const media = soma / idades.length;
console.log(`\na) A média de idade é ${media.toFixed(2)} anos.`);

// b) Posições com mais de 25 anos
console.log("\nb) Posições com pessoas com mais de 25 anos:");
let achou = false;
for (let i = 0; i < idades.length; i++) {
  if (idades[i] > 25) {
    console.log(`Posição ${i} -> ${idades[i]} anos`);
    achou = true;
  }
}
if (!achou) {
  console.log("Nenhuma pessoa com mais de 25 anos.");
}

// c) Maior idade
let maior = idades[0];
for (let i = 1; i < idades.length; i++) {
  if (idades[i] > maior) {
    maior = idades[i];
  }
}
console.log(`\nc) A maior idade digitada foi ${maior} anos.`);

// d) Posições da maior idade
console.log("\nd) Posições da maior idade:");
for (let i = 0; i < idades.length; i++) {
  if (idades[i] === maior) {
    console.log(`Posição ${i}`);
  }
}