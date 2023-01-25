import { AuthContext } from '@/contexts/AuthContext'
import { setupAPIClient } from '@/services/api'
import { api } from '@/services/apiClient'
import { withSSRAuth } from '@/utils/withSSRAuth'
import { destroyCookie } from 'nookies'
import { useContext, useEffect } from 'react'

export default function Dashboard() {
  const { user } = useContext(AuthContext)

  useEffect(() => {
    api
      .get('/me')
      .then((response) => {
        console.log(response)
      })
      .catch((error) => console.log(error))
  }, [])

  return <h1>Dashboard: {user?.email}</h1>
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
  const apiClient = setupAPIClient(ctx)

  try {
    const response = await apiClient.get('/me')
  } catch (err) {
    destroyCookie(ctx, 'nextAuth.token')
    destroyCookie(ctx, 'nextAuth.refreshToken')

    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
})
