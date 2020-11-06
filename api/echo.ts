import { Endpoint } from "../app/Endpoint.ts";
import { Handler } from "../app/Handler.ts";
import { lambda } from "../app/Lambda.ts";

const endpoint = new Endpoint();

endpoint.registerMessageHandler(Handler.map(input => input))

const handler = lambda(endpoint)
export default handler