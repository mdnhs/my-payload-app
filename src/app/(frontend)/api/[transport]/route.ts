import { auth } from '@/lib/auth'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { withMcpAuth } from 'better-auth/plugins'
import { z } from 'zod'

const handler = withMcpAuth(auth, async (req, session) => {
  const server = new McpServer({
    name: 'MentorSpace MCP',
    version: '1.0.0',
  })

  server.tool('echo', 'Echo a message back to the caller', { message: z.string() }, async ({ message }) => ({
    content: [{ type: 'text', text: `Echo: ${message}` }],
  }))

  server.tool('whoami', 'Return the authenticated user info', {}, async () => ({
    content: [
      {
        type: 'text',
        text: JSON.stringify({ userId: session.userId, scopes: session.scopes }, null, 2),
      },
    ],
  }))

  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined })
  await server.connect(transport)
  return transport.handleRequest(req)
})

export { handler as GET, handler as POST, handler as DELETE }
