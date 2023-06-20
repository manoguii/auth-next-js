# Auth next js

O projeto auth-next-js implementa todo fluxo de autenticação usando `JWT` para realizar login do usuário com email e senha, nesse projeto é feito o refresh do token do usuário toda vez que o token expira usando o conceito de fila, é usado funcionalidade de `SSR` do next para fazer o refresh do token pelo servidor, validar se o usuário tem permissão para acessar determinada rota ou ate mesmo um determinado componente, o projeto usa a api que se encontra na pasta `api` que tem algumas rotas para fazer a implementação da autenticação no front end, veja abaixo um pouco mais sobre o fluxo do app.

## Fluxo

- Login
  - O usuário começa digitando o email e a senha.
  - O app possui um método signIn que faz:
    - A chamada para api contendo os dados de email e senha.
    - Salva o token e o refresh token que o back end devolve nos cookies do navegador com nome `nextAuth.token` e `nextAuth.refreshToken`.
    - Salva os dados do usuário em um estado no contexto de autenticação.
    - Atualiza o header de `Authorization` com o valor do token que o back end devolve.
  - O contexto de autenticação guarda a variável `isAuthenticated` que verifica se o usuário esta ou não autenticado e compartilha com todo app.
  - Como o projeto lida com dados de permissão, toda vez que o app e carregado o contexto de autenticação usa o hook `useEffect` para recuperar o token do usuário nos cookies, caso o mesmo ja tenha feito login o app faz uma nova requisição ao back end para buscar os dados do usuário e garantir que os dados sempre estarão atualizados.
- Refresh Token
  - É usado a funcionalidade de `interceptors` do axios para lidar com o refresh token, que permite interceptar todas respostas do servidor.
  - Quando o token do usuário expira e acontece uma requisição com esse token que não esta mais valido, o back end devolve um erro com status `401` e um código nos dados da resposta como `token.expired`, nesse caso é um erro de token expirado e o token deve ser atualizado.
  - Para fazer o refresh token é usado uma estrategia de fila.
    - São adicionadas em uma fila as requisições feitas ao back end que teve o erro de token expirado.
    - É feito uma requisição ao back end na rota `/refresh` que por sua vez gera um novo token e refresh token e atualiza o header `Authorization` com o valor do token atualizado para as novas requisições.
    - Depois de fazer a requisição na rota `/refresh` para atualizar o token são refeitas as requisições que estavam na fila com erro de token expirado, porem agora com o novo token que foi salvo.

```js
if (error.response?.status === 401) {
const data = error.response.data as ExtendsErrorData

if (data.code === 'token.expired') {
  cookies = parseCookies(ctx)

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
  if (process.browser) {
    signOut()
  } else {
    return Promise.reject(new AuthTokenError())
  }
}
}
```

## Instalação

```zsh
git clone git clone git@github.com:manoguii/auth-next-js.git
```

- Para rodar o projeto localmente
  1. Instale as dependências ```pnpm install```
  2. Execute a aplicação. ```pnpm dev```
  3. Acesse `http://localhost:3000`

## Usuários para teste

```js
{
  email: 'guilhermedavidrk@gmail.com',
  password: '123456',
  permissions: ['users.list', 'users.create', 'metrics.list'],
  roles: ['administrator']
},
{
  email: 'estagiario@gmail.com',
  password: '123456',
  permissions: ['products.list'],
  roles: ['editor']
},
```

## Tecnologias utilizadas

Algumas tecnologias utilizadas para construção da aplicação.

- [ReactJS](https://reactjs.org/)
- [NextJS](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)

---

<center>Made with 💙 by Guilherme David</center>
