declare const require: any;
declare const process: any;

const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on('close', () => process.exit(0));
const perguntar = (texto: string): Promise<string> =>
    new Promise((resolve) => rl.question(texto, (r: string) => resolve(r.trim().toLowerCase())));



// ---------- tipos ----------
type IdHabilidade = 'rajada' | 'acido' | 'osso' | 'golpe' | 'fogo';
type TipoInimigo = 'slime' | 'esqueleto' | 'orc' | 'dragao';

interface Dificuldade {
  nome: string;
  mulVida: number;
  mulDano: number;
  mulPontos: number;
}

interface Habilidade {
  nome: string;
  custo: number;
  dano: number;
  alcance: number;
  todos: boolean;
}

interface ModeloInimigo {
  nome: string;
  simbolo: string;
  vida: number;
  dano: number;
  xp: number;
  pontos: number;
  velocidade: number;
  habilidade: IdHabilidade;
}

interface Inimigo extends ModeloInimigo {
  x: number;
  vidaMax: number;
}

interface Jogador {
  nome: string;
  x: number;
  noAr: boolean;
  vida: number;
  vidaMax: number;
  mana: number;
  manaMax: number;
  nivel: number;
  xp: number;
  pontos: number;
  habilidades: IdHabilidade[];
  desbloqueadas: Set<IdHabilidade>;
}

// ---------- cores ANSI ----------
const c = {
  reset: '\x1b[0m', negrito: '\x1b[1m',
  vermelho: '\x1b[31m', verde: '\x1b[32m', amarelo: '\x1b[33m',
  azul: '\x1b[34m', magenta: '\x1b[35m', ciano: '\x1b[36m', cinza: '\x1b[90m',
};
const cor = (cod: string, txt: string): string => `${cod}${txt}${c.reset}`;

// ---------- configurações ----------
const TAM = 30; // tamanho do cenário (colunas)
const TOTAL_FASES = 3;

const DIFICULDADES: Record<string, Dificuldade> = {
  facil:   { nome: 'Fácil',   mulVida: 0.7, mulDano: 0.7, mulPontos: 1 },
  normal:  { nome: 'Normal',  mulVida: 1.0, mulDano: 1.0, mulPontos: 1.5 },
  dificil: { nome: 'Difícil', mulVida: 1.5, mulDano: 1.4, mulPontos: 2 },
};

const HABILIDADES: Record<IdHabilidade, Habilidade> = {
  rajada: { nome: 'Rajada Arcana', custo: 10, dano: 20, alcance: 6, todos: false },
  acido:  { nome: 'Gosma Ácida',   custo: 8,  dano: 18, alcance: 4, todos: false },
  osso:   { nome: 'Lança de Osso', custo: 14, dano: 22, alcance: 8, todos: true },
  golpe:  { nome: 'Golpe Brutal',  custo: 12, dano: 35, alcance: 2, todos: false },
  fogo:   { nome: 'Sopro de Fogo', custo: 25, dano: 40, alcance: 6, todos: true },
};

const TIPOS_INIMIGO: Record<TipoInimigo, ModeloInimigo> = {
  slime:     { nome: 'Slime',     simbolo: 'S', vida: 20,  dano: 5,  xp: 20,  pontos: 10,  velocidade: 1, habilidade: 'acido' },
  esqueleto: { nome: 'Esqueleto', simbolo: 'E', vida: 30,  dano: 8,  xp: 30,  pontos: 20,  velocidade: 1, habilidade: 'osso' },
  orc:       { nome: 'Orc',       simbolo: 'O', vida: 50,  dano: 12, xp: 45,  pontos: 35,  velocidade: 1, habilidade: 'golpe' },
  dragao:    { nome: 'Dragão',    simbolo: 'D', vida: 120, dano: 20, xp: 120, pontos: 150, velocidade: 1, habilidade: 'fogo' },
};

// ---------- estado ----------
let turno = 0;
const historicoDano: string[] = [];

function criarJogador(): Jogador {
  return {
    nome: 'WZK', x: 0, noAr: false,
    vida: 60, vidaMax: 60, mana: 30, manaMax: 30,
    nivel: 1, xp: 0, pontos: 0,
    habilidades: ['rajada'],   // habilidades que ele já aprendeu
    desbloqueadas: new Set<IdHabilidade>(), // liberadas por inimigos mortos
  };
}

function criarInimigos(fase: number, dif: Dificuldade): Inimigo[] {
  const tipos: TipoInimigo[] =
    fase === 1 ? ['slime', 'slime'] :
    fase === 2 ? ['slime', 'esqueleto', 'esqueleto', 'orc'] :
                 ['esqueleto', 'orc', 'orc', 'dragao'];
  return tipos.map((t, i) => {
    const base = TIPOS_INIMIGO[t];
    const vida = Math.round(base.vida * dif.mulVida);
    return {
      ...base,
      x: TAM - 1 - i * 4,
      vida,
      vidaMax: vida,
      dano: Math.max(1, Math.round(base.dano * dif.mulDano)),
    };
  });
}

// ---------- utilidades ----------
const vivos = (inimigos: Inimigo[]): Inimigo[] => inimigos.filter((e) => e.vida > 0);
const inimigoEm = (inimigos: Inimigo[], x: number): Inimigo | undefined =>
  vivos(inimigos).find((e) => e.x === x);
const xpNecessario = (j: Jogador): number => 40 + j.nivel * 20;

function barra(valor: number, max: number, corBarra: string, tam = 15): string {
  const cheio = Math.max(0, Math.round((valor / max) * tam));
  return cor(corBarra, '█'.repeat(cheio)) + cor(c.cinza, '░'.repeat(Math.max(0, tam - cheio)));
}

function desenhar(j: Jogador, inimigos: Inimigo[], fase: number, dif: Dificuldade): void {
  let linha = '';
  for (let x = 0; x < TAM; x++) {
    const e = inimigoEm(inimigos, x);
    if (x === j.x) linha += cor(c.ciano + c.negrito, j.noAr ? '^' : 'W');
    else if (e) linha += cor(c.vermelho + c.negrito, e.simbolo);
    else linha += cor(c.cinza, '.');
  }
  console.log('\n' + cor(c.amarelo, `=== Fase ${fase}/${TOTAL_FASES} | Dificuldade: ${dif.nome} | Turno ${turno} ===`));
  console.log(linha);
  console.log(`${cor(c.ciano, j.nome)}  Nv ${j.nivel}  XP ${j.xp}/${xpNecessario(j)}  Pontos: ${cor(c.amarelo, String(Math.round(j.pontos)))}`);
  console.log(`Vida: ${barra(j.vida, j.vidaMax, c.verde)} ${j.vida}/${j.vidaMax}`);
  console.log(`Mana: ${barra(j.mana, j.manaMax, c.azul)} ${j.mana}/${j.manaMax}`);
  vivos(inimigos).forEach((e) =>
    console.log(`  ${cor(c.vermelho, e.simbolo)} ${e.nome} (pos ${e.x}) vida ${e.vida}/${e.vidaMax}`));
}

// ---------- dano (avisa onde no código aconteceu) ----------
function tomarDano(j: Jogador, valor: number, origem: Inimigo, fase: number): void {
  j.vida = Math.max(0, j.vida - valor);
  // linha 2 da pilha = quem chamou tomarDano
  const onde = (new Error().stack?.split('\n')[2] ?? '').trim();
  const aviso = `${j.nome} tomou ${valor} de dano de ${origem.nome} na posição ${j.x} (fase ${fase}, turno ${turno}) -> ${onde}`;
  historicoDano.push(aviso);
  console.log(cor(c.vermelho, `[DANO] ${aviso}`));
}

// ---------- ações do jogador ----------
function mover(j: Jogador, passos: number, direcao: 1 | -1, inimigos: Inimigo[]): number {
  let andou = 0;
  for (let i = 0; i < passos; i++) {
    const prox = j.x + direcao;
    if (prox < 0 || prox >= TAM || inimigoEm(inimigos, prox)) break;
    j.x = prox;
    andou++;
  }
  return andou;
}

function andar(j: Jogador, inimigos: Inimigo[]): void {
  const n = mover(j, 1, 1, inimigos);
  console.log(n ? 'WZK andou 1 casa.' : 'WZK não consegue avançar (obstáculo).');
}

function correr(j: Jogador, inimigos: Inimigo[]): boolean {
  if (j.mana < 2) {
    console.log(cor(c.azul, 'Sem mana para correr (custa 2).'));
    return false;
  }
  j.mana -= 2;
  const n = mover(j, 3, 1, inimigos);
  console.log(`WZK correu ${n} casas.`);
  return true;
}

function saltar(j: Jogador, inimigos: Inimigo[]): void {
  j.noAr = true;
  for (let d = 3; d >= 1; d--) {
    const alvo = j.x + d;
    if (alvo < TAM && !inimigoEm(inimigos, alvo)) {
      j.x = alvo;
      console.log(`WZK saltou ${d} casas e está no ar (desvia dos ataques neste turno).`);
      return;
    }
  }
  console.log('WZK pulou no lugar (desvia dos ataques neste turno).');
}

function recuar(j: Jogador, inimigos: Inimigo[]): void {
  const n = mover(j, 1, -1, inimigos);
  console.log(n ? 'WZK recuou 1 casa.' : 'WZK não consegue recuar.');
}

function ataqueBasico(j: Jogador, inimigos: Inimigo[]): void {
  const alvo = vivos(inimigos).find((e) => Math.abs(e.x - j.x) <= 1);
  if (!alvo) {
    console.log('Nenhum inimigo ao alcance do soco.');
    return;
  }
  const dano = 8 + j.nivel * 2;
  alvo.vida = Math.max(0, alvo.vida - dano);
  console.log(`WZK acertou ${alvo.nome} com ${dano} de dano.`);
}

async function soltarPoder(j: Jogador, inimigos: Inimigo[]): Promise<boolean> {
  console.log('\nPoderes:');
  j.habilidades.forEach((id, i) => {
    const h = HABILIDADES[id];
    console.log(`  ${i + 1}) ${h.nome} - custo ${h.custo} mana, dano ${h.dano}, alcance ${h.alcance}${h.todos ? ' (atinge todos no alcance)' : ''}`);
  });
  const r = await perguntar('Escolha o poder (ou Enter para cancelar): ');
  const id = j.habilidades[Number(r) - 1];
  if (!id) return false;
  const h = HABILIDADES[id];
  if (j.mana < h.custo) {
    console.log(cor(c.azul, 'Mana insuficiente.'));
    return false;
  }

  const noAlcance = vivos(inimigos)
    .filter((e) => Math.abs(e.x - j.x) <= h.alcance)
    .sort((a, b) => Math.abs(a.x - j.x) - Math.abs(b.x - j.x));
  if (!noAlcance.length) {
    console.log('Nenhum inimigo ao alcance desse poder.');
    return false;
  }

  j.mana -= h.custo;
  const alvos = h.todos ? noAlcance : [noAlcance[0]];
  alvos.forEach((e) => {
    e.vida = Math.max(0, e.vida - h.dano);
    console.log(cor(c.magenta, `WZK soltou ${h.nome} em ${e.nome}: ${h.dano} de dano!`));
  });
  return true;
}

// ---------- turno dos inimigos ----------
function turnoInimigos(j: Jogador, inimigos: Inimigo[], fase: number): void {
  vivos(inimigos).forEach((e) => {
    const dist = Math.abs(e.x - j.x);
    if (dist <= 1) {
      if (j.noAr) console.log(cor(c.verde, `WZK desviou do ataque de ${e.nome} pulando!`));
      else tomarDano(j, e.dano, e, fase);
    } else {
      const dir = j.x > e.x ? 1 : -1;
      for (let i = 0; i < e.velocidade; i++) {
        const prox = e.x + dir;
        if (prox === j.x || inimigoEm(inimigos, prox)) break;
        e.x = prox;
      }
    }
  });
  j.noAr = false;
}

// ---------- XP, nível e habilidades ----------
async function ganharXP(j: Jogador, inimigo: Inimigo, dif: Dificuldade): Promise<void> {
  j.xp += inimigo.xp;
  j.pontos += inimigo.pontos * dif.mulPontos;
  j.desbloqueadas.add(inimigo.habilidade);
  console.log(cor(c.amarelo, `${inimigo.nome} derrotado! +${inimigo.xp} XP, +${Math.round(inimigo.pontos * dif.mulPontos)} pontos.`));

  while (j.xp >= xpNecessario(j)) {
    j.xp -= xpNecessario(j);
    j.nivel++;
    j.vidaMax += 10;
    j.manaMax += 5;
    j.vida = j.vidaMax;
    j.mana = j.manaMax;
    console.log(cor(c.verde + c.negrito, `\n*** WZK subiu para o nível ${j.nivel}! Vida e mana restauradas. ***`));
    await escolherHabilidade(j);
  }
}

async function escolherHabilidade(j: Jogador): Promise<void> {
  const opcoes = [...j.desbloqueadas].filter((id) => !j.habilidades.includes(id));
  if (!opcoes.length) {
    // nada novo: melhora uma habilidade que já tem
    console.log('Nenhuma habilidade nova disponível. Escolha uma para evoluir (+5 de dano):');
    j.habilidades.forEach((id, i) => console.log(`  ${i + 1}) ${HABILIDADES[id].nome}`));
    let r: number;
    do { r = Number(await perguntar('Número: ')); } while (!j.habilidades[r - 1]);
    const id = j.habilidades[r - 1];
    HABILIDADES[id].dano += 5;
    console.log(cor(c.magenta, `${HABILIDADES[id].nome} evoluiu!`));
    return;
  }
  console.log('Habilidades liberadas pelos inimigos que você derrotou:');
  opcoes.forEach((id, i) => {
    const h = HABILIDADES[id];
    console.log(`  ${i + 1}) ${h.nome} - custo ${h.custo}, dano ${h.dano}, alcance ${h.alcance}${h.todos ? ', atinge todos' : ''}`);
  });
  let r: number;
  do { r = Number(await perguntar('Escolha sua nova habilidade: ')); } while (!opcoes[r - 1]);
  const escolhida = opcoes[r - 1];
  j.habilidades.push(escolhida);
  console.log(cor(c.magenta, `WZK aprendeu ${HABILIDADES[escolhida].nome}!`));
}

// ---------- fase ----------
async function jogarFase(j: Jogador, fase: number, dif: Dificuldade): Promise<boolean> {
  const inimigos = criarInimigos(fase, dif);
  j.x = 0;
  j.noAr = false;
  turno = 0;
  console.log(cor(c.amarelo + c.negrito, `\n>>> FASE ${fase} começou! <<<`));

  while (j.vida > 0 && vivos(inimigos).length) {
    turno++;
    j.mana = Math.min(j.manaMax, j.mana + 3); // regeneração de mana
    desenhar(j, inimigos, fase, dif);

    console.log('\n1) Andar  2) Correr (2 mana)  3) Saltar  4) Soltar poder  5) Atacar (perto)  6) Recuar');
    const op = await perguntar('Ação: ');
    const vivosAntes = new Set<Inimigo>(vivos(inimigos));

    let gastouTurno = true;
    if (op === '1') andar(j, inimigos);
    else if (op === '2') gastouTurno = correr(j, inimigos);
    else if (op === '3') saltar(j, inimigos);
    else if (op === '4') gastouTurno = await soltarPoder(j, inimigos);
    else if (op === '5') ataqueBasico(j, inimigos);
    else if (op === '6') recuar(j, inimigos);
    else {
      console.log('Opção inválida.');
      gastouTurno = false;
    }

    if (!gastouTurno) {
      turno--;
      continue;
    }

    for (const e of vivosAntes) if (e.vida <= 0) await ganharXP(j, e, dif);
    if (!vivos(inimigos).length) break;
    turnoInimigos(j, inimigos, fase);
  }
  return j.vida > 0;
}

async function escolherDificuldade(atual: Dificuldade | null): Promise<Dificuldade> {
  console.log('\nDificuldade: 1) Fácil  2) Normal  3) Difícil' + (atual ? '  (Enter mantém a atual)' : ''));
  const mapa: Record<string, string> = { '1': 'facil', '2': 'normal', '3': 'dificil' };
  while (true) {
    const r = await perguntar('Escolha: ');
    if (r === '' && atual) return atual;
    const chave = mapa[r];
    if (chave) return DIFICULDADES[chave];
    console.log('Opção inválida.');
  }
}

// ---------- programa principal ----------
async function main(): Promise<void> {
  console.log(cor(c.ciano + c.negrito, '\n=== WZK - A AVENTURA NO TERMINAL ==='));
  let jogarDeNovo = true;
  while (jogarDeNovo) {
    const j = criarJogador();
    let dif: Dificuldade | null = null;
    let venceu = true;
    for (let fase = 1; fase <= TOTAL_FASES; fase++) {
      dif = await escolherDificuldade(dif); // pode mudar a dificuldade a cada fase
      if (!(await jogarFase(j, fase, dif))) {
        venceu = false;
        break;
      }
      console.log(cor(c.verde, `\nFase ${fase} concluída!`));
    }
    if (venceu) console.log(cor(c.verde + c.negrito, `\n*** VITÓRIA! WZK venceu o jogo com ${Math.round(j.pontos)} pontos (nível ${j.nivel}). ***`));
    else console.log(cor(c.vermelho + c.negrito, `\n*** WZK foi derrotado... Pontuação final: ${Math.round(j.pontos)} ***`));

    if (historicoDano.length) {
      console.log(cor(c.cinza, `\nResumo: WZK tomou dano ${historicoDano.length} vez(es).`));
      historicoDano.length = 0;
    }
    jogarDeNovo = (await perguntar('\nJogar de novo? (s/n): ')) === 's';
  }
  rl.close();
}

main();