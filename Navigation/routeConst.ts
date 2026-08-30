const PREFIX = 'chat_next_';

export const chatNextRoutes = {
  INBOX: `${PREFIX}INBOX`,
  ONE_TO_ONE: `${PREFIX}ONE_TO_ONE`,
} as const;

export type ChatNextRouteKey = keyof typeof chatNextRoutes;
export type ChatNextRouteName = (typeof chatNextRoutes)[ChatNextRouteKey];

export default chatNextRoutes;
