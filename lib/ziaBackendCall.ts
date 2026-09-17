"use server"

/**
 * Calls the zia backend. When `token` is provided (a Shopify App Bridge session
 * token obtained client-side via `authenticatedZiaBackendCall`), it is forwarded
 * to the backend as `Authorization: Bearer <token>` so the backend can verify
 * the shop and user making the request.
 *
 * Page-load fetches (server components) pass no token; those routes are the
 * backend's public/optional-auth surface. Client-initiated mutations and reads
 * should always pass a token.
 */
export default async function ziaBackendCall(route: string, method: string, data?: any, token?: string) { 

    const request: { method: string; headers: { [key: string]: string }; body?: string; signal?: AbortSignal; cache?: RequestCache } = {
    method: method.toUpperCase(),
    headers: {
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
    }

  if (token) {
    request.headers['Authorization'] = `Bearer ${token}`
  }

  if(method.toUpperCase() != 'GET'){
    request.body = JSON.stringify(data)
  }
  const url = `${process.env.NEXT_PUBLIC_APIURL}/${route}`
  const response = await fetch(url, request).then(res => res.json()).catch(e=>{
    console.log(e)
    return {error: 'Could not communicate with system'}
  })

  if(response?.error){
    return response
  }
  if(response){
    return {data: response}
  }


}