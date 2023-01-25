import { AuthContext } from '@/contexts/AuthContext'
import { api } from '@/services/api'
import { withSSRAuth } from '@/utils/withSSRAuth'
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
  return {
    props: {},
  }
})
