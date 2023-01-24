import axios from 'axios' // AxiosError
import { parseCookies, setCookie } from 'nookies'

let cookies = parseCookies()
// let isRefreshing = false

export const api = axios.create({
  baseURL: 'http://localhost:3333',
  headers: {
    Authorization: `Bearer ${cookies['nextAuth.token']}`,
  },
})

api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      if (error.response.data?.code === 'token.expired') {
        // renova o token

        cookies = parseCookies()

        const { 'nextAuth.refreshToken': refreshToken } = cookies

        // if (!isRefreshing) {
        // isRefreshing = true

        api
          .post('/refresh', {
            refreshToken,
          })
          .then((response) => {
            const { token } = response.data

            setCookie(undefined, 'nextAuth.token', token, {
              maxAge: 60 * 60 * 24 * 30,
              path: '/',
            })

            setCookie(
              undefined,
              'nextAuth.refreshToken',
              response.data.refreshToken,
              {
                maxAge: 60 * 60 * 24 * 30,
                path: '/',
              },
            )

            api.defaults.headers.Authorization = `Bearer ${token}`
          })
        // }

        // return new Promise((resolve, reject) => {})
      } else {
        // desloga usuario
      }
    }
  },
)
