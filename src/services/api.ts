import axios, { AxiosError } from 'axios'
import { parseCookies, setCookie } from 'nookies'

interface ExtendsErrorData {
  code: string
}

let cookies = parseCookies()
let isRefreshing = false
let failedRequestQueue: any[] = []

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
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const data = error.response.data as ExtendsErrorData

      if (data.code === 'token.expired') {
        // renova o token

        cookies = parseCookies()

        const { 'nextAuth.refreshToken': refreshToken } = cookies

        const originalConfig = error.config

        if (!isRefreshing) {
          isRefreshing = true

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

              failedRequestQueue.forEach((request) => request.onSuccess(token))
              failedRequestQueue = []
            })
            .catch((err) => {
              failedRequestQueue.forEach((request) => request.onFailure(err))
              failedRequestQueue = []
            })
            .finally(() => {
              isRefreshing = false
            })
        }

        return new Promise((resolve, reject) => {
          failedRequestQueue.push({
            onSuccess: (token: string) => {
              if (originalConfig) {
                originalConfig.headers.Authorization = `Bearer ${token}`

                resolve(api(originalConfig))
              }
            },
            onFailure: (error: AxiosError) => {
              reject(error)
            },
          })
        })
      } else {
        // desloga usuario
      }
    }
  },
)
