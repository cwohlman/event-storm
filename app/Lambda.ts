import { ServerRequest } from 'https://deno.land/std@0.74.0/http/server.ts';
import { Serializer } from "../components/Serializer.ts";
import { Endpoint } from "./Endpoint.ts";

export function lambda(endpoint: Endpoint, serializer: Serializer = new Serializer()) {
  return async (request: ServerRequest) => {
    let body: unknown = null;
    try {
      const rawBody = await Deno.readAll(request.body)
      const decoder = new TextDecoder('utf-8');
      const stringBody = decoder.decode(rawBody)
      const jsonBody = JSON.parse(stringBody)
      
      body = serializer.parse(jsonBody)
    } catch (error) {
      console.error(error)

      request.respond({ body: JSON.stringify({ error: { message: error.message } }), status: 400 })
      return
    }

    try {
      const result = await endpoint.processRequest(body)
      const serializedResult = serializer.serialize(result)

      request.respond({ body: JSON.stringify(serializedResult), status: 200 })
      return
    } catch (error) {
      console.error(error)

      request.respond({ body: JSON.stringify({ error: { message: 'Internal server error' } }), status: 500 })
      return
    }
    
  }
}