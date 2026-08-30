import {Inbox, OneToOne} from '../Screens';
import {chatNextRoutes} from './routeConst';

export const chatNextTabRoutes = [
  {
    name: chatNextRoutes.INBOX,
    component: Inbox,
    options: {
      unmountOnBlur: true,
      tabBarLabel: () => null,
      tabBarIcon: 'chat',
    },
  },
];

export const chatNextRoutesNonTabs = [
  {
    name: chatNextRoutes.ONE_TO_ONE,
    component: OneToOne,
    options: {
      tabBarLabel: () => null,
      tabBarButton: () => null,
    },
  },
];

export default chatNextTabRoutes;
