import decode from 'jwt-decode'
import { AuthTokenError } from '@/errors/AuthTokenError'
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  GetServerSidePropsResult,
} from 'next'
import { destroyCookie, parseCookies } from 'nookies'
import { validadeUserPermissions } from './validadeUserPermissions'

interface WithSSRAuthOptions {
  permissions: string[]
  roles: string[]
}

export function withSSRAuth<P extends { [key: string]: any }>(
  fn: GetServerSideProps<P>,
  options?: WithSSRAuthOptions,
) {
  return async (
    ctx: GetServerSidePropsContext,
  ): Promise<GetServerSidePropsResult<P>> => {
    const cookies = parseCookies(ctx)

    const token = cookies['nextAuth.token']

    if (!token) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      }
    }

    if (options) {
      const user = decode<{ permissions: string[]; roles: string[] }>(token)

      const { permissions, roles } = options

      const userHasValidatePermissions = validadeUserPermissions({
        user,
        permissions,
        roles,
      })

      if (!userHasValidatePermissions) {
        return {
          redirect: {
            destination: '/dashboard',
            permanent: false,
          },
        }
      }
    }

    try {
      return await fn(ctx)
    } catch (err) {
      if (err instanceof AuthTokenError) {
        destroyCookie(ctx, 'nextAuth.token')
        destroyCookie(ctx, 'nextAuth.refreshToken')

        return {
          redirect: {
            destination: '/',
            permanent: false,
          },
        }
      } else {
        return {
          notFound: true,
        }
      }
    }
  }
}
