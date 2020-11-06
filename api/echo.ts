import { Endpoint } from "../app/Endpoint.ts";
import { Handler } from "../app/Handler.ts";
import { lambda } from "../app/Lambda.ts";
import { Serializer } from "../components/Serializer.ts";

const endpoint = new Endpoint();
const serializer = new Serializer()

class Example {}
serializer.registerType('example', Example)

endpoint.registerMessageHandler(Handler.map(input => input))

const handler = lambda(endpoint, serializer)
export default handler