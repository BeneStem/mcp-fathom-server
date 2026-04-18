import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
  ListToolsRequest,
  CallToolRequest,
  ListResourcesRequest,
  ListPromptsRequest
} from "@modelcontextprotocol/sdk/types.js";
import { FathomClient } from './fathom-client.js';
import { toolDefinitions, handleToolCall } from './tools/index.js';
import { SERVER_NAME, SERVER_VERSION, SERVER_INSTRUCTIONS } from './constants.js';

export function createServer(apiKey: string): Server {
  const fathomClient = new FathomClient(apiKey);

  const server = new Server({
    name: SERVER_NAME,
    version: SERVER_VERSION
  }, {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {}
    },
    instructions: SERVER_INSTRUCTIONS
  });

  server.setRequestHandler(ListToolsRequestSchema, async (_request: ListToolsRequest) => ({
    tools: toolDefinitions
  }));

  server.setRequestHandler(ListResourcesRequestSchema, async (_request: ListResourcesRequest) => ({
    resources: []
  }));

  server.setRequestHandler(ListPromptsRequestSchema, async (_request: ListPromptsRequest) => ({
    prompts: []
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
    const { name, arguments: args } = request.params;
    return await handleToolCall(fathomClient, name, args);
  });

  return server;
}
