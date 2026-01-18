#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { createServer } from "./server.js";

dotenv.config();

const apiKey = process.env.FATHOM_API_KEY;
if (!apiKey) {
  console.error("Error: FATHOM_API_KEY environment variable is required");
  console.error("Please set it in your environment variables or Claude Desktop config");
  console.error("See README.md for setup instructions");
  process.exit(1);
}

async function main() {
  const server = createServer(apiKey as string);
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error("Fathom MCP Server started successfully");
  console.error("Connected to Fathom API");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
