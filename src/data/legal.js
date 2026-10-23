// Textos legais. São um MODELO para o projeto: antes de lançar com usuários reais,
// revise com um advogado (dados do controlador, CNPJ, foro, preços e prazos).

export const LEGAL_UPDATED = 'outubro de 2026';
export const CONTACT = {
  company: 'FragClub (projeto em desenvolvimento)',
  privacyEmail: 'privacidade@fragclub.gg',
  supportEmail: 'suporte@fragclub.gg',
};

/** @typedef {{ id: string, title: string, body: (string | { list: string[] })[] }} LegalSection */

/** @type {LegalSection[]} */
export const TERMS = [
  {
    id: 'aceite',
    title: '1. Aceite dos termos',
    body: [
      'Estes Termos de Uso regulam o acesso à plataforma FragClub, que oferece partidas ranqueadas, lobbies, servidores de Retake e Deathmatch, campeonatos, times, fórum e loja de itens para Counter-Strike 2.',
      'Ao criar uma conta ou usar a plataforma, você declara que leu e concorda com estes Termos e com a Política de Privacidade. Se não concordar, não use o serviço.',
    ],
  },
  {
    id: 'conta',
    title: '2. Conta',
    body: [
      'Você precisa ter pelo menos 13 anos. Menores de 18 anos devem usar a plataforma com autorização dos pais ou responsáveis.',
      {
        list: [
          'Cada pessoa pode ter apenas uma conta. Contas compartilhadas, vendidas ou usadas por outra pessoa (smurf ou boosting) podem ser suspensas.',
          'Você é responsável por manter sua senha em segredo e por tudo que acontece na sua conta. Recomendamos ativar a verificação em duas etapas.',
          'O nick não pode imitar outra pessoa, conter ofensas ou divulgar sites de terceiros.',
        ],
      },
    ],
  },
  {
    id: 'conduta',
    title: '3. Regras de conduta',
    body: [
      'Não é permitido:',
      {
        list: [
          'usar trapaças, scripts, macros ou qualquer software que dê vantagem indevida;',
          'abusar de bugs do jogo ou da plataforma em vez de reportá-los;',
          'manipular resultados, entregar partidas ou combinar placares;',
          'ofender, ameaçar, discriminar ou assediar outros jogadores, no chat, no fórum ou por voz;',
          'abandonar partidas ranqueadas sem motivo ou atrapalhar o próprio time de propósito;',
          'publicar spam, conteúdo ilegal ou dados pessoais de terceiros.',
        ],
      },
      'Denúncias são analisadas pela equipe com base em demos, registros do servidor e do anti-cheat.',
    ],
  },
  {
    id: 'anticheat',
    title: '4. Anti-cheat',
    body: [
      'Partidas ranqueadas e campeonatos exigem o cliente anti-cheat do FragClub instalado e em execução. Ele monitora apenas processos e arquivos relacionados ao jogo enquanto você joga pela plataforma.',
      'Detecções confirmadas levam ao banimento da conta, que pode ser permanente, e à perda de itens, FragPoints, premiações e posições em ranking obtidas no período.',
    ],
  },
  {
    id: 'premium',
    title: '5. Premium e pagamentos',
    body: [
      'O Premium é uma assinatura com benefícios de conveniência, estatísticas e conteúdo extra. Ele não dá vantagem dentro das partidas, nem altera ELO ou matchmaking.',
      {
        list: [
          'A cobrança é recorrente no período escolhido (mensal, trimestral ou anual) até você cancelar.',
          'Você pode cancelar a qualquer momento nas configurações. Os benefícios continuam até o fim do período já pago.',
          'Para compras feitas pela internet, você pode desistir em até 7 dias da contratação e receber o valor de volta, conforme o art. 49 do Código de Defesa do Consumidor.',
          'Preços podem mudar. Assinaturas ativas são avisadas com antecedência antes da renovação com o valor novo.',
        ],
      },
    ],
  },
  {
    id: 'pontos',
    title: '6. FragPoints, loja e itens',
    body: [
      'FragPoints são pontos de fidelidade ganhos jogando, em missões e recompensas. Eles não têm valor em dinheiro, não podem ser comprados, vendidos ou transferidos e só podem ser trocados por itens da loja.',
      {
        list: [
          'Skins resgatadas são enviadas por oferta de troca da Steam para o link cadastrado no seu perfil. Confira o link: envios para um link errado informado por você não são reenviados.',
          'Itens da loja têm estoque limitado e podem sair do catálogo a qualquer momento.',
          'Os pontos de uma temporada podem expirar no fim dela. A data é informada na loja.',
          'Pontos e itens obtidos com trapaça, abuso de bug ou contas falsas são removidos.',
        ],
      },
    ],
  },
  {
    id: 'campeonatos',
    title: '7. Campeonatos',
    body: [
      'Cada campeonato tem regras próprias, publicadas na página do evento, que complementam estes Termos. O capitão responde pela inscrição e pelo elenco do time.',
      'Prêmios em dinheiro são pagos ao capitão ou aos jogadores em até 30 dias após o fim do evento, mediante dados para pagamento e documentos que comprovem identidade e idade. Prêmios podem estar sujeitos a impostos.',
    ],
  },
  {
    id: 'conteudo',
    title: '8. Conteúdo publicado por você',
    body: [
      'Você continua dono do que publica no fórum, no perfil e no chat, mas nos dá permissão para exibir esse conteúdo na plataforma. Podemos remover conteúdo que viole estes Termos.',
    ],
  },
  {
    id: 'suspensao',
    title: '9. Suspensão e encerramento',
    body: [
      'Podemos advertir, suspender ou banir contas que violem estes Termos, de forma proporcional à gravidade. Você pode contestar uma punição pelo e-mail de suporte em até 30 dias.',
      'Você pode excluir sua conta a qualquer momento em Configurações. Alguns dados são mantidos pelo tempo exigido em lei, como explicado na Política de Privacidade.',
    ],
  },
  {
    id: 'responsabilidade',
    title: '10. Disponibilidade e responsabilidade',
    body: [
      'Trabalhamos para manter a plataforma estável, mas ela pode ficar indisponível para manutenção ou por falhas de terceiros (Steam, provedores de servidor, internet). Não respondemos por perdas causadas por essas interrupções, exceto quando a lei determinar.',
      'O FragClub não é afiliado à Valve Corporation. Counter-Strike, Steam e marcas relacionadas pertencem à Valve.',
    ],
  },
  {
    id: 'alteracoes',
    title: '11. Alterações e foro',
    body: [
      'Podemos atualizar estes Termos. Mudanças importantes são avisadas por e-mail ou na plataforma com pelo menos 15 dias de antecedência.',
      'Estes Termos seguem as leis brasileiras. Fica eleito o foro do domicílio do consumidor para resolver eventuais conflitos.',
    ],
  },
];

/** @type {LegalSection[]} */
export const PRIVACY = [
  {
    id: 'quem-somos',
    title: '1. Quem somos',
    body: [
      `Esta Política explica como o ${CONTACT.company} trata seus dados pessoais, de acordo com a Lei Geral de Proteção de Dados (Lei 13.709/2018, LGPD). Somos o controlador dos dados descritos aqui.`,
      `Encarregado de dados (DPO): ${CONTACT.privacyEmail}.`,
    ],
  },
  {
    id: 'dados',
    title: '2. Dados que coletamos',
    body: [
      {
        list: [
          'Cadastro: nick, e-mail, senha (guardada de forma criptografada) e país.',
          'Steam: SteamID, nome e avatar públicos da Steam, quando você vincula a conta.',
          'Perfil (opcional): bio, redes sociais, código de mira e link de troca da Steam.',
          'Jogo: partidas, rounds, estatísticas (Rating, KAST, ADR etc.), chat das partidas, times, amigos e posts no fórum.',
          'Anti-cheat: informações técnicas do computador e dos processos relacionados ao jogo durante as partidas pela plataforma.',
          'Pagamentos: plano, datas e status. Os dados do cartão ficam com o processador de pagamento; não guardamos o número do cartão.',
          'Técnicos: endereço IP, tipo de dispositivo e navegador, e registros de acesso, guardados por 6 meses como exige o Marco Civil da Internet.',
        ],
      },
    ],
  },
  {
    id: 'finalidades',
    title: '3. Para que usamos e com qual base legal',
    body: [
      {
        list: [
          'Criar e manter sua conta, montar partidas, calcular ELO e estatísticas: execução do contrato.',
          'Detectar trapaças, fraudes e contas múltiplas: legítimo interesse e proteção dos demais jogadores.',
          'Processar pagamentos e emitir notas: execução do contrato e obrigação legal.',
          'Guardar registros de acesso: obrigação legal.',
          'Enviar resumos e novidades por e-mail: consentimento, que você pode retirar em Configurações > Notificações.',
          'Melhorar a plataforma com estatísticas de uso agregadas: legítimo interesse.',
        ],
      },
    ],
  },
  {
    id: 'compartilhamento',
    title: '4. Com quem compartilhamos',
    body: [
      'Não vendemos seus dados. Compartilhamos apenas o necessário com:',
      {
        list: [
          'Valve/Steam, para login, verificação de conta e envio de skins por troca;',
          'provedores de servidores de jogo e de hospedagem;',
          'processadores de pagamento (Pix e cartão);',
          'autoridades, quando houver ordem judicial ou obrigação legal.',
        ],
      },
      'O que aparece no seu perfil público (nick, level, estatísticas, histórico, times) pode ser visto por outros usuários. Você pode deixar o perfil e o histórico privados em Configurações > Privacidade.',
    ],
  },
  {
    id: 'internacional',
    title: '5. Transferência internacional',
    body: [
      'Alguns fornecedores, como a Steam e serviços de hospedagem, ficam fora do Brasil. Nesses casos usamos fornecedores com garantias adequadas de proteção, como prevê a LGPD.',
    ],
  },
  {
    id: 'retencao',
    title: '6. Por quanto tempo guardamos',
    body: [
      {
        list: [
          'Dados da conta: enquanto a conta existir.',
          'Após excluir a conta: apagamos ou anonimizamos em até 30 dias, exceto o que a lei obriga a manter.',
          'Registros de acesso: 6 meses.',
          'Dados fiscais de pagamento: 5 anos.',
          'Registros de banimento por trapaça: enquanto forem necessários para impedir a volta do infrator.',
        ],
      },
    ],
  },
  {
    id: 'direitos',
    title: '7. Seus direitos',
    body: [
      'Pela LGPD você pode, a qualquer momento:',
      {
        list: [
          'confirmar se tratamos seus dados e acessar uma cópia deles;',
          'corrigir dados incompletos ou desatualizados;',
          'pedir a anonimização, o bloqueio ou a exclusão de dados desnecessários;',
          'pedir a portabilidade dos seus dados;',
          'retirar o consentimento e saber as consequências disso;',
          'saber com quem compartilhamos seus dados.',
        ],
      },
      `Boa parte disso está em Configurações. Para o resto, escreva para ${CONTACT.privacyEmail}. Respondemos em até 15 dias. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).`,
    ],
  },
  {
    id: 'cookies',
    title: '8. Cookies e armazenamento local',
    body: [
      'Usamos armazenamento local do navegador para manter você logado e lembrar preferências. Não usamos cookies de publicidade de terceiros.',
    ],
  },
  {
    id: 'seguranca',
    title: '9. Segurança',
    body: [
      'Usamos conexão criptografada, senhas com hash, verificação em duas etapas opcional e acesso restrito aos dados pela equipe. Se houver um incidente que possa causar risco a você, avisamos você e a ANPD.',
    ],
  },
  {
    id: 'menores',
    title: '10. Crianças e adolescentes',
    body: [
      'A plataforma é para maiores de 13 anos. Dados de adolescentes são tratados no seu melhor interesse, como exige a LGPD. Se você é responsável e acredita que uma criança criou uma conta, fale conosco para excluí-la.',
    ],
  },
  {
    id: 'mudancas',
    title: '11. Mudanças nesta Política',
    body: [
      'Quando esta Política mudar de forma importante, avisamos por e-mail ou na plataforma antes de a mudança valer.',
    ],
  },
];
