import { Application as OakApplication } from "https://deno.land/x/oak/mod.ts";
import { Serializer } from "../components/Serializer.ts";
import { Endpoint } from './Endpoint.ts';


export class Application extends OakApplication {
  registerEndpoint(pathname: string, endpoint: Endpoint, serializer: Serializer = new Serializer()) {
    this.use(async (ctx, next) => {
      if (ctx.request.method === 'POST' && ctx.request.url.pathname === pathname && ctx.request.headers.get('content-type') === 'application/json') {


        try {
          const requestBody = ctx.request.body({ type: "json" })
          const request = serializer.parse(await requestBody.value)
          const response = await endpoint.processRequest(request)

          ctx.response.body = JSON.stringify(serializer.serialize(response))
        } catch (error) {
          console.error(error)
        }

      } else {
        next()
      }
    })
  }
}