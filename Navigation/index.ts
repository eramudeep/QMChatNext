import chatNextTabRoutes, {
  chatNextRoutesNonTabs,
} from './chatNextRoutes'
import chatNextRoutes from './routeConst'

export {chatNextTabRoutes, chatNextRoutesNonTabs, chatNextRoutes}
export * from './routeConst'
export * from './chatNextRoutes'

export default {
  routes: chatNextTabRoutes,
  nonTabRoutes: chatNextRoutesNonTabs,
  routeConst: chatNextRoutes,
}
