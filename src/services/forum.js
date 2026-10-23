import { db, request, schedule, ApiError, notFound, forbidden } from './client';
import { realtime } from './realtime';
import { pushNotification } from './notifications';
import { NICKS, ME, getPlayer } from '../data/mock';
import { seeded, pick, randInt } from '../utils/random';

const KEY = 'fc_forum';
const MIN = 60 * 1000;
const HOUR = 60 * MIN;

export const FORUM_CATEGORIES = [
  { id: 'geral', name: 'Geral', desc: 'Papo sobre CS2 e a comunidade' },
  { id: 'ajuda', name: 'Ajuda', desc: 'Dúvidas sobre a plataforma', solvable: true },
  { id: 'times', name: 'Procuro time', desc: 'Times recrutando e jogadores procurando' },
  { id: 'estrategia', name: 'Estratégia', desc: 'Táticas, granadas e mapas' },
  { id: 'sugestoes', name: 'Sugestões', desc: 'Ideias para o FragClub' },
  { id: 'bugs', name: 'Bugs', desc: 'Encontrou um problema? Conte aqui', solvable: true },
];
const CAT_BY_ID = Object.fromEntries(FORUM_CATEGORIES.map((c) => [c.id, c]));

export const FORUM_LIMITS = { title: [8, 120], body: [10, 5000], reply: [2, 3000] };
const MOD = 'fragclub_staff';

// Tópicos iniciais: [categoria, título, texto, respostas[], fixado?]
const SEED = [
  [
    'geral',
    'Regras do fórum: leia antes de postar',
    'Bem-vindo ao fórum do FragClub!\n\n1. Respeite todo mundo. Ofensa e discriminação dão banimento.\n2. Nada de divulgar cheat, venda de contas ou boosting.\n3. Use a categoria certa e pesquise antes de abrir tópico repetido.\n4. Em Ajuda e Bugs, marque a resposta que resolveu seu problema.\n\nBom jogo!',
    [],
    true,
    MOD,
  ],
  [
    'ajuda',
    'Não consigo conectar no servidor depois do veto',
    'Depois do veto aparece "Servidor pronto", clico em Conectar no CS2 e o jogo abre mas fica carregando e volta pro menu. Alguém sabe o que pode ser?',
    [
      'Tenta colar o comando connect direto no console (tecla ~). Às vezes o link steam:// não passa a senha.',
      'Aconteceu comigo, era o firewall do Windows bloqueando o CS2. Libera o cs2.exe nas redes privadas e públicas.',
      'OP:Era o firewall mesmo, valeu!',
    ],
    false,
    null,
    1,
  ],
  [
    'times',
    '[BRB] Os Brabos recrutando AWPer level 8+',
    'Somos o time Os Brabos, jogamos campeonatos de fim de semana e treinamos terça e quinta das 20h às 23h.\n\nProcuramos AWPer fixo, level 8 ou mais, com microfone e disponibilidade nos treinos. Manda mensagem com seu perfil!',
    [
      'Tenho interesse, sou level 9 e jogo de AWP faz 3 anos. Te chamei no perfil.',
      'Ainda tem vaga? Sou level 8, AWP secundário.',
    ],
    false,
    'kzinho',
  ],
  [
    'estrategia',
    'Smokes essenciais da Mirage pelo lado TR',
    'Montei uma lista das smokes que todo mundo deveria saber na Mirage:\n\n- Janela (do spawn TR)\n- CT e Jungle para execute de A\n- Conector a partir do top mid\n- Stairs para take de A\n\nQuem tiver mais, posta aí que eu atualizo o tópico.',
    [
      'Faltou a smoke de Short para quem joga B.',
      'A de janela do spawn é a mais importante, dá pra fazer com jump throw.',
      'Salvei, valeu demais!',
      'Coloca a de Top Mid também, ajuda muito no controle do meio.',
    ],
    false,
    'nadeking',
  ],
  [
    'sugestoes',
    'Mostrar o ELO do adversário antes de aceitar a partida',
    'Seria legal ver o ELO médio dos dois times na tela de "Partida encontrada", antes de aceitar. Ajuda a saber se a partida vai ser equilibrada.',
    [
      'Concordo, mas aí o pessoal vai começar a recusar partida difícil.',
      'Talvez só mostrar depois que todos aceitarem.',
    ],
    false,
    'zeroping',
  ],
  [
    'bugs',
    'Contador de FragPoints não atualiza depois da partida',
    'Ganhei a partida mas o saldo no topo continuou igual até eu dar F5. Alguém mais?',
    ['Corrigido na última atualização. Os pontos agora aparecem na hora. Valeu pelo aviso!'],
    false,
    'tchuco',
    0,
    MOD,
  ],
  [
    'geral',
    'Qual o mapa favorito de vocês no pool atual?',
    'Eu sou time Ancient, mas vejo muita gente vetando. Qual o de vocês e por quê?',
    [
      'Inferno sempre.',
      'Nuke, mas meu time veta toda vez kkk',
      'Mirage é o mais equilibrado na minha opinião.',
      'Anubis é subestimado demais.',
      'Dust II pra relaxar.',
    ],
    false,
    'brabo',
  ],
  [
    'ajuda',
    'Como funciona o cálculo do ELO?',
    'Ganhei duas partidas seguidas e uma deu +28 e a outra +19. Por que muda tanto?',
    [
      'Depende da diferença de ELO entre os times. Se o adversário é mais forte, você ganha mais quando vence.',
      'Tem uma explicação no FAQ também, na parte de ELO.',
    ],
    false,
    'flashzin',
    0,
  ],
  [
    'estrategia',
    'Dicas para melhorar o spray da AK',
    'Tô travado no level 6 e sinto que perco muito duelo de spray. Vocês treinam como?',
    [
      'Recoil Master no workshop, 10 minutos por dia antes de jogar.',
      'DM só de AK, só HS. Ajuda demais a ajustar a mira na altura da cabeça.',
      'Para de spray longo de longe, dá tap e burst.',
    ],
    false,
    'spraydown',
  ],
  [
    'times',
    'Procuro time casual para jogar lobbies à noite',
    'Level 5, jogo de suporte/entry, geralmente das 21h à meia-noite. Quero algo sem tilt, só pra jogar e evoluir.',
    ['O Eco Forte é exatamente isso, procura a gente na aba Times.'],
    false,
    'clutchz',
  ],
  [
    'sugestoes',
    'Modo 1v1 para treinar aim',
    'Um modo 1v1 em mapas de aim, com ranking separado, seria muito bom pra aquecer.',
    [],
    false,
    'awpzera',
  ],
  [
    'bugs',
    'Badge de level some no celular',
    'Na tela de ranking pelo celular a coluna de level fica cortada.',
    ['Consegui reproduzir aqui no Android também.'],
    false,
    'baianox',
  ],
];

function seedThreads() {
  const rng = seeded('forum');
  const now = Date.now();
  return SEED.map(([category, title, body, replies, pinned, author, solvedIdx, solvedBy], i) => {
    const createdAt = now - (i * 7 + randInt(rng, 1, 6)) * HOUR;
    const op = author ?? pick(rng, NICKS);
    // "OP:" no início marca uma resposta do próprio autor do tópico
    const replyList = replies.map((text, j) => ({
      id: `r${i}-${j}`,
      author: text.startsWith('OP:') ? op : j === replies.length - 1 && solvedBy ? solvedBy : pick(rng, NICKS),
      body: text.replace(/^OP:/, ''),
      createdAt: createdAt + (j + 1) * randInt(rng, 10, 90) * MIN,
      likes: Array.from({ length: randInt(rng, 0, 9) }, () => pick(rng, NICKS)),
    }));
    // A resposta do próprio autor ("era isso, valeu") não é a solução; a anterior é
    const solvedReply = solvedIdx !== undefined && replyList[solvedIdx] ? replyList[solvedIdx].id : null;
    return {
      id: `t${i + 1}`,
      category,
      title,
      body,
      author: op,
      createdAt,
      pinned: !!pinned,
      locked: !!pinned,
      solvedReply,
      likes: [...new Set(Array.from({ length: randInt(rng, 1, 24) }, () => pick(rng, NICKS)))],
      views: randInt(rng, 40, 1800),
      replies: replyList,
    };
  });
}

const load = () => db.get(KEY, seedThreads);
const save = (list) => {
  db.set(KEY, list);
  realtime.emit('forum:changed');
  return list;
};

// Posts do usuário são gravados com me: true e exibidos com o nick atual
const authorOf = (p) => (p.me ? ME.nick : p.author);
const isMine = (p) => !!p.me;

function authorInfo(nick) {
  if (nick === MOD) return { nick, level: 10, staff: true };
  const pl = getPlayer(nick);
  return { nick, level: pl.level, staff: false };
}

function summary(t) {
  const last = t.replies.at(-1);
  return {
    id: t.id,
    category: t.category,
    title: t.title,
    excerpt: t.body.replace(/\s+/g, ' ').slice(0, 140),
    author: authorInfo(authorOf(t)),
    createdAt: t.createdAt,
    pinned: t.pinned,
    locked: t.locked,
    solved: !!t.solvedReply,
    likes: t.likes.length,
    views: t.views,
    replies: t.replies.length,
    lastActivity: last ? last.createdAt : t.createdAt,
    lastAuthor: last ? authorOf(last) : authorOf(t),
  };
}

function full(t) {
  const liked = (likes) => likes.includes(ME.nick);
  return {
    ...summary(t),
    body: t.body,
    mine: isMine(t),
    liked: liked(t.likes),
    solvable: !!CAT_BY_ID[t.category]?.solvable,
    solvedReply: t.solvedReply,
    replies: t.replies.map((r) => ({
      id: r.id,
      body: r.body,
      createdAt: r.createdAt,
      author: authorInfo(authorOf(r)),
      mine: isMine(r),
      likes: r.likes.length,
      liked: liked(r.likes),
    })),
  };
}

function find(list, id) {
  const t = list.find((x) => x.id === id);
  if (!t) throw notFound('Tópico');
  return t;
}

function check(text, [min, max], label) {
  const len = (text ?? '').trim().length;
  if (len < min) throw new ApiError(`${label} precisa ter pelo menos ${min} caracteres.`, 422, 'too_short');
  if (len > max) throw new ApiError(`${label} pode ter no máximo ${max} caracteres.`, 422, 'too_long');
}

const toggle = (arr, v) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
const replace = (list, t) => list.map((x) => (x.id === t.id ? t : x));

const norm = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const forum = {
  categories: () =>
    request(
      () => {
        const list = load();
        return FORUM_CATEGORIES.map((c) => ({ ...c, threads: list.filter((t) => t.category === c.id).length }));
      },
      { min: 60, max: 160 },
    ),

  /**
   * @param {{ category?: string, q?: string, sort?: 'recent'|'popular'|'unanswered' }} opts
   */
  list: ({ category = 'all', q = '', sort = 'recent' } = {}) =>
    request(() => {
      const term = norm(q.trim());
      let list = load().map(summary);
      if (category !== 'all') list = list.filter((t) => t.category === category);
      if (term) list = list.filter((t) => norm(`${t.title} ${t.excerpt}`).includes(term));
      if (sort === 'unanswered') list = list.filter((t) => t.replies === 0);
      const by = sort === 'popular' ? (t) => t.likes * 3 + t.replies * 5 + t.views / 50 : (t) => t.lastActivity;
      // Fixados sempre no topo
      return list.sort((a, b) => Number(b.pinned) - Number(a.pinned) || by(b) - by(a));
    }),

  /** Abre o tópico. `view: false` recarrega sem contar visualização (atualizações em tempo real). */
  get: (id, { view = true } = {}) =>
    request(() => {
      const list = load();
      const t = find(list, id);
      if (!view) return full(t);
      const next = { ...t, views: t.views + 1 };
      db.set(KEY, replace(list, next));
      return full(next);
    }),

  create: ({ category, title, body }) =>
    request(() => {
      if (!CAT_BY_ID[category]) throw new ApiError('Escolha uma categoria.', 422, 'invalid_category');
      check(title, FORUM_LIMITS.title, 'O título');
      check(body, FORUM_LIMITS.body, 'O texto');
      const list = load();
      const t = {
        id: `t${Date.now().toString(36)}`,
        category,
        title: title.trim(),
        body: body.trim(),
        me: true,
        createdAt: Date.now(),
        pinned: false,
        locked: false,
        solvedReply: null,
        likes: [],
        views: 0,
        replies: [],
      };
      save([t, ...list]);
      // Mock: em Ajuda/Bugs a equipe responde depois de alguns segundos
      if (CAT_BY_ID[category].solvable) {
        schedule(() => {
          const cur = load();
          const th = cur.find((x) => x.id === t.id);
          if (!th) return;
          const reply = {
            id: `r${Date.now().toString(36)}`,
            author: MOD,
            body: 'Oi! Recebemos seu tópico e a equipe já está olhando. Enquanto isso, confira se a sua dúvida está no FAQ.',
            createdAt: Date.now(),
            likes: [],
          };
          save(replace(cur, { ...th, replies: [...th.replies, reply] }));
          pushNotification({
            type: 'forum',
            title: 'Nova resposta no seu tópico',
            body: `A equipe respondeu "${th.title}".`,
            link: `/forum/${th.id}`,
          });
        }, 4000);
      }
      return full(t);
    }),

  reply: (id, body) =>
    request(() => {
      check(body, FORUM_LIMITS.reply, 'A resposta');
      const list = load();
      const t = find(list, id);
      if (t.locked) throw new ApiError('Este tópico está fechado para respostas.', 409, 'locked');
      const reply = {
        id: `r${Date.now().toString(36)}`,
        me: true,
        body: body.trim(),
        createdAt: Date.now(),
        likes: [],
      };
      const next = { ...t, replies: [...t.replies, reply] };
      save(replace(list, next));
      return full(next);
    }),

  /** Curtir/descurtir o tópico ou uma resposta. */
  like: (id, replyId = null) =>
    request(
      () => {
        const list = load();
        const t = find(list, id);
        let next;
        if (!replyId) next = { ...t, likes: toggle(t.likes, ME.nick) };
        else {
          if (!t.replies.some((r) => r.id === replyId)) throw notFound('Resposta');
          next = {
            ...t,
            replies: t.replies.map((r) => (r.id === replyId ? { ...r, likes: toggle(r.likes, ME.nick) } : r)),
          };
        }
        save(replace(list, next));
        return full(next);
      },
      { min: 40, max: 120 },
    ),

  /** Autor do tópico marca (ou desmarca) a resposta que resolveu. */
  markSolved: (id, replyId) =>
    request(() => {
      const list = load();
      const t = find(list, id);
      if (!isMine(t)) throw forbidden('Só o autor do tópico pode marcar a solução.');
      if (!CAT_BY_ID[t.category].solvable)
        throw new ApiError('Só tópicos de Ajuda e Bugs têm solução.', 422, 'not_solvable');
      if (!t.replies.some((r) => r.id === replyId)) throw notFound('Resposta');
      const next = { ...t, solvedReply: t.solvedReply === replyId ? null : replyId };
      save(replace(list, next));
      return full(next);
    }),

  removeThread: (id) =>
    request(() => {
      const list = load();
      const t = find(list, id);
      if (!isMine(t)) throw forbidden('Você só pode excluir os seus tópicos.');
      save(list.filter((x) => x.id !== id));
      return { ok: true };
    }),

  removeReply: (id, replyId) =>
    request(() => {
      const list = load();
      const t = find(list, id);
      const r = t.replies.find((x) => x.id === replyId);
      if (!r) throw notFound('Resposta');
      if (!isMine(r)) throw forbidden('Você só pode excluir as suas respostas.');
      const next = {
        ...t,
        replies: t.replies.filter((x) => x.id !== replyId),
        solvedReply: t.solvedReply === replyId ? null : t.solvedReply,
      };
      save(replace(list, next));
      return full(next);
    }),
};
