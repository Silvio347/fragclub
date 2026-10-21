/**
 * Tipos de domínio (JSDoc). Servem de contrato entre a UI e a camada de serviços
 * em src/services — e, mais tarde, com a API real. O editor usa estes tipos para
 * autocomplete e checagem leve via jsconfig.json.
 */

/**
 * @typedef {Object} GameMap
 * @property {string} id            Ex.: "mirage"
 * @property {string} name          Ex.: "Mirage"
 * @property {[string, string]} colors  Cores de fallback do card
 */

/**
 * @typedef {Object} Player
 * @property {string} nick
 * @property {number} elo
 * @property {number} level         1 a 10
 * @property {number} rating        Rating 3.0 médio
 * @property {number} kd
 * @property {number} kast          %
 * @property {number} adr
 * @property {number} roundSwing    %
 * @property {number} hs            %
 * @property {number} winRate       %
 * @property {number} matches
 * @property {number} openingSuccess
 * @property {number} clutches
 * @property {number} multiKills
 * @property {number} utilityDmg
 * @property {number} flashAssists
 * @property {number} tradeKills
 * @property {string} country       Código ISO, ex.: "BR"
 * @property {number} memberSince
 * @property {number} weeklyGain
 * @property {boolean} premium
 */

/**
 * @typedef {Object} Friend
 * @property {string} nick
 * @property {'online'|'in-game'|'offline'} status
 * @property {string} activity
 */

/**
 * @typedef {Object} MatchSummary   Linha do histórico
 * @property {string} id            `${nick}-${indice}`
 * @property {GameMap} map
 * @property {boolean} won
 * @property {number} scoreUs
 * @property {number} scoreThem
 * @property {number} kills
 * @property {number} deaths
 * @property {number} assists
 * @property {number} hs
 * @property {number} adr
 * @property {number} kast
 * @property {number} rating
 * @property {number} roundSwing
 * @property {number} eloDelta
 * @property {number} daysAgo
 */

/**
 * @typedef {Object} Round
 * @property {number} n
 * @property {'A'|'B'} winner
 * @property {'CT'|'T'} sideA
 * @property {'CT'|'T'} winnerSide
 * @property {'elim'|'bomb'|'defuse'|'time'} end
 */

/**
 * @typedef {Object} MatchDetails
 * @property {string} id
 * @property {string} owner
 * @property {GameMap} map
 * @property {string} mode
 * @property {boolean} won
 * @property {number} scoreUs
 * @property {number} scoreThem
 * @property {number} daysAgo
 * @property {number} durationMin
 * @property {string} server
 * @property {Round[]} rounds
 * @property {{ name: string, players: Object[] }} teamA
 * @property {{ name: string, players: Object[] }} teamB
 */

/**
 * @typedef {Object} TeamMember
 * @property {string} [nick]        Ausente quando `me` é true
 * @property {boolean} [me]         Usuário logado
 * @property {'Capitão'|'Jogador'|'Reserva'|'Coach'} role
 */

/**
 * @typedef {Object} Team
 * @property {string} id
 * @property {string} name
 * @property {string} tag
 * @property {string} color
 * @property {string} region
 * @property {string} [description]
 * @property {boolean} recruiting
 * @property {number} minLevel
 * @property {number} founded
 * @property {number} wins
 * @property {number} losses
 * @property {number} trophies
 * @property {TeamMember[]} members
 * @property {string[]} [invites]   Nicks com convite pendente
 * @property {Object[]} matches
 */

/**
 * @typedef {Object} TeamsState
 * @property {Team[]} myTeams
 * @property {Team[]} publicTeams
 * @property {string[]} requests    IDs de times com pedido pendente
 */

/**
 * @typedef {Object} ShopItem
 * @property {string} id
 * @property {'skin'|'frame'|'nick'|'banner'|'premium'} kind
 * @property {string} name
 * @property {number} price         FragPoints
 * @property {string} [image]
 * @property {string} [rarity]
 * @property {string} [wear]
 * @property {string} [type]
 * @property {number} [stock]
 * @property {number} [days]
 * @property {string} [desc]
 */

/**
 * @typedef {Object} InventoryEntry
 * @property {string} uid
 * @property {string} itemId
 * @property {ShopItem} item
 * @property {number} boughtAt
 * @property {'available'|'redeeming'|'used'} status
 */

/**
 * @typedef {Object} ShopState
 * @property {number} points
 * @property {number} seasonXp
 * @property {InventoryEntry[]} inventory
 * @property {{ frame: string|null, nick: string|null }} equipped
 * @property {Record<string, number>} stock
 * @property {boolean} dailyAvailable
 */

/**
 * @typedef {Object} AppNotification
 * @property {string} id
 * @property {'team_invite'|'team'|'friend_request'|'challenge'|'points'|'tournament'|'shop'|'system'} type
 * @property {string} title
 * @property {string} body
 * @property {string} [link]
 * @property {string} [teamId]
 * @property {string} [from]
 * @property {number} createdAt
 * @property {boolean} read
 * @property {'accepted'|'declined'} [resolved]
 */

/**
 * @typedef {Object} Tournament
 * @property {string} id
 * @property {string} name
 * @property {string} prize
 * @property {string} format
 * @property {number} teams
 * @property {number} slots
 * @property {string} date
 * @property {'open'|'live'|'finished'} status
 * @property {number} minLevel
 * @property {string} map
 * @property {[string, string]} colors
 * @property {string} [winner]
 */

export {};
