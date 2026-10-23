// Perguntas frequentes. Respostas em texto simples (sem HTML).
export const FAQ = [
  {
    id: 'conta',
    title: 'Conta',
    items: [
      [
        'Preciso pagar para jogar?',
        'Não. Ranqueada, lobbies, Retake, DM e campeonatos abertos são grátis. O Premium só adiciona conveniência e estatísticas.',
      ],
      [
        'Posso trocar meu nick?',
        'Sim, em Perfil > Editar perfil. O nick precisa ter de 3 a 16 caracteres e não pode estar em uso.',
      ],
      [
        'Como ativo a verificação em duas etapas?',
        'Em Configurações > Segurança. Você escaneia o código com um app autenticador (Google Authenticator, Authy etc.) e confirma com os 6 dígitos.',
      ],
      [
        'Esqueci minha senha. E agora?',
        'Na tela de login clique em "Esqueci minha senha" e siga o link enviado para o seu e-mail. Se você entra pela Steam, não precisa de senha.',
      ],
      [
        'Como excluo minha conta?',
        'Em Configurações > Excluir conta. Você confirma digitando seu nick. Times criados, inventário e FragPoints são apagados.',
      ],
    ],
  },
  {
    id: 'jogar',
    title: 'Jogar',
    items: [
      [
        'Qual a diferença entre Ranqueada e Lobbies?',
        'Na Ranqueada você entra na fila e o matchmaking monta a partida com jogadores de ELO parecido. Nos Lobbies você abre um lobby e escolhe qual outro lobby desafiar.',
      ],
      [
        'Posso jogar com amigos?',
        'Sim. Chame até 4 amigos para a party. Vocês ficam no mesmo time e as vagas que sobrarem são completadas pelo matchmaking.',
      ],
      [
        'Como entro no servidor?',
        'Depois do veto de mapas, clique em "Conectar no CS2" ou copie o comando connect e cole no console do jogo (tecla ~). Você tem 5 minutos para entrar.',
      ],
      [
        'E se eu não aceitar a partida?',
        'Você tem 15 segundos para aceitar. Recusar ou deixar o tempo acabar várias vezes seguidas gera um tempo de espera para voltar à fila.',
      ],
      [
        'O que é a pausa técnica?',
        'Durante a partida seu time pode pedir uma pausa de 30 segundos para resolver problemas de conexão. Precisa de 3 votos e cada time tem uma por partida.',
      ],
    ],
  },
  {
    id: 'elo',
    title: 'ELO, levels e estatísticas',
    items: [
      [
        'Como funciona o ELO?',
        'Você ganha ELO nas vitórias e perde nas derrotas da Ranqueada. A quantidade depende da diferença de ELO entre os times.',
      ],
      ['Quais são os levels?', 'São 10 levels por faixa de ELO, do 1 (até 500) ao 10 (acima de 2000).'],
      [
        'O que é Rating 3.0?',
        'É uma nota de desempenho por partida que considera kills, mortes, dano, KAST e o impacto dos seus rounds (Round Swing). 1.00 é a média.',
      ],
      [
        'O que é KAST?',
        'A porcentagem de rounds em que você fez uma Kill, deu uma Assistência, Sobreviveu ou foi Trocado (Traded) depois de morrer.',
      ],
      ['Meu histórico pode ficar privado?', 'Sim, em Configurações > Privacidade ou no Editar perfil.'],
    ],
  },
  {
    id: 'times',
    title: 'Times e campeonatos',
    items: [
      [
        'Quantos times posso ter?',
        'Você pode participar de até 3 times ao mesmo tempo. Cada time tem até 7 membros (5 titulares, reservas e coach).',
      ],
      [
        'Como inscrevo meu time num campeonato?',
        'O capitão abre o campeonato e clica em "Inscrever time". O time precisa ter jogadores suficientes e todos devem ter o level mínimo.',
      ],
      [
        'Como passo a capitania?',
        'Na página do time, o capitão muda a função de outro membro para Capitão. Ele passa a ser Jogador.',
      ],
      ['Quando recebo o prêmio?', 'Em até 30 dias após o fim do campeonato, depois de enviar os dados para pagamento.'],
    ],
  },
  {
    id: 'loja',
    title: 'Loja e FragPoints',
    items: [
      [
        'Como ganho FragPoints?',
        'Jogando: 120 por vitória e 40 por derrota na ranqueada, além de missões diárias, campeonatos e a recompensa diária de 100 pontos.',
      ],
      ['Posso comprar FragPoints com dinheiro?', 'Não. FragPoints só são ganhos jogando e não têm valor em dinheiro.'],
      [
        'Como recebo uma skin?',
        'Cadastre seu link de troca da Steam em Editar perfil e clique em "Resgatar na Steam" no inventário. O envio acontece em até 48 horas.',
      ],
      [
        'Meu link de troca está errado. E agora?',
        'Corrija antes de resgatar. Skins enviadas para um link errado informado por você não são reenviadas.',
      ],
    ],
  },
  {
    id: 'premium',
    title: 'Premium',
    items: [
      ['O Premium dá vantagem no jogo?', 'Não. ELO, matchmaking e anti-cheat são iguais para todos.'],
      [
        'Posso cancelar?',
        'Sim, quando quiser. Você continua com os benefícios até o fim do período pago. Em até 7 dias da compra você pode pedir o dinheiro de volta.',
      ],
      [
        'Quais formas de pagamento?',
        'Pix e cartão de crédito. Também dá para ativar Premium trocando FragPoints na loja.',
      ],
    ],
  },
  {
    id: 'anticheat',
    title: 'Anti-cheat e denúncias',
    items: [
      ['O anti-cheat é obrigatório?', 'Sim, em ranqueadas e campeonatos. Em Retake e DM ele é recomendado.'],
      [
        'O que o anti-cheat monitora?',
        'Só processos e arquivos relacionados ao jogo, e apenas enquanto você joga pela plataforma.',
      ],
      [
        'Como denuncio alguém?',
        'Durante ou depois da partida, use "Denunciar jogador" na sala da partida. A equipe analisa a demo.',
      ],
      [
        'Fui banido injustamente. O que faço?',
        'Envie uma contestação para o suporte em até 30 dias, com o ID da partida.',
      ],
    ],
  },
];
