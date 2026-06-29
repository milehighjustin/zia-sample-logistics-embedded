"use server"

export default async function ziaBackendCall(route: string, method: string, data?: any) { 

    const request: { method: string; headers: { [key: string]: string }; body?: string; signal?: AbortSignal; cache?: RequestCache } = {
    method: method.toUpperCase(),
    headers: {
      'Content-Type': 'application/json'
    },
    cache: 'no-store'
    }

  if(method.toUpperCase() != 'GET'){
    request.body = JSON.stringify(data)
  }
  const url = `${process.env.NEXT_PUBLIC_APIURL}/${route}`
  console.log(url)
  const response = await fetch(url, request).then(res => res.json()).catch(e=>{
    return {error: 'Could not communicate with system'}
  })

  if(response?.error){
    return response
  }
  if(response){
    return {data: response}
  }


}