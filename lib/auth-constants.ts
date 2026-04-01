/** Cookie de sesión; debe coincidir con login/logout y middleware. */
export const AUTH_COOKIE_NAME = 'token'

export type UsuarioJwt = {
  id: string
  email: string
  rol: string
  nombre: string
}
