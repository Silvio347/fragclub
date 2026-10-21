// Ponto único de acesso a dados. As telas e contextos só conversam com `api`.
// Hoje cada módulo resolve com dados mock + localStorage; para ligar o backend,
// basta reimplementar as funções com fetch mantendo as mesmas assinaturas.
import { players } from './players';
import { matches } from './matches';
import { tournaments } from './tournaments';
import { play } from './play';
import { friends } from './friends';
import { teams } from './teams';
import { shop } from './shop';
import { notifications } from './notifications';
import { auth } from './auth';
import { account } from './account';
import { search } from './search';
import { live } from './live';

export const api = {
  auth,
  account,
  players,
  matches,
  tournaments,
  play,
  friends,
  teams,
  shop,
  notifications,
  search,
  live,
};
export { REPORT_REASONS } from './matches';
export { ApiError } from './client';
export { realtime } from './realtime';
