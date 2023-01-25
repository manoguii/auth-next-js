import { AuthContext } from '@/contexts/AuthContext'
import { useCan } from '@/hooks/useCan'
import { setupAPIClient } from '@/services/api'
import { api } from '@/services/apiClient'
import { withSSRAuth } from '@/utils/withSSRAuth'
import { useContext, useEffect } from 'react'

export default function Dashboard() {
  const { user } = useContext(AuthContext)

  const userCanSeeMetrics = useCan({
    roles: ['editor'],
  })

  useEffect(() => {
    api
      .get('/me')
      .then((response) => {
        console.log(response)
      })
      .catch((error) => console.log(error))
  }, [])

  return (
    <>
      <h1>Dashboard: {user?.email}</h1>

      {userCanSeeMetrics && <div>Metricas</div>}
    </>
  )
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
  const apiClient = setupAPIClient(ctx)

  const response = await apiClient.get('/me')

  console.log(response.data)

  return {
    props: {},
  }
})
