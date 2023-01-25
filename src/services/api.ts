import { signOut } from '@/contexts/AuthContext'
import { AuthTokenError } from '@/errors/AuthTokenError'
import axios, { AxiosError } from 'axios'
import { GetServerSidePropsContext, PreviewData } from 'next'
import { parseCookies, setCookie } from 'nookies'
import { ParsedUrlQuery } from 'querystring'

interface ExtendsErrorData {
  code: string
}

let isRefreshing = false
let failedRequestQueue: any[] = []

export function setupAPIClient(
  ctx?: GetServerSidePropsContext<ParsedUrlQuery, PreviewData> | undefined,
) {
  let cookies = parseCookies(ctx)

  const api = axios.create({
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

          cookies = parseCookies(ctx)

          const { 'nextAuth.refreshToken': refreshToken } = cookies

          const originalConfig = error.config

          if (!isRefreshing) {
            isRefreshing = true

            console.log('REFRESH')

            api
              .post('/refresh', {
                refreshToken,
              })
              .then((response) => {
                const { token } = response.data

                setCookie(ctx, 'nextAuth.token', token, {
                  maxAge: 60 * 60 * 24 * 30,
                  path: '/',
                })

                setCookie(
                  ctx,
                  'nextAuth.refreshToken',
                  response.data.refreshToken,
                  {
                    maxAge: 60 * 60 * 24 * 30,
                    path: '/',
                  },
                )

                api.defaults.headers.Authorization = `Bearer ${token}`

                failedRequestQueue.forEach((request) =>
                  request.onSuccess(token),
                )
                failedRequestQueue = []
              })
              .catch((err) => {
                failedRequestQueue.forEach((request) => request.onFailure(err))
                failedRequestQueue = []

                if (process.browser) {
                  signOut()
                }
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
          if (process.browser) {
            signOut()
          } else {
            return Promise.reject(new AuthTokenError())
          }
        }
      }

      return Promise.reject(error)
    },
  )

  return api
}
