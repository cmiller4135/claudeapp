import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function getSystemMessage(modelName: string, isGrok = false): string {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  let basePrompt = `You are ${modelName}. Today's date is ${today}.`;

  if (isGrok) {
    basePrompt += ` IMPORTANT: You are being accessed via the xAI API, which does NOT have live access to X (Twitter) posts or trends. You cannot see real-time X data. If asked about current X trends, tweets, or posts, you must clearly state that you don't have live X access via the API and cannot provide real-time information.`;
  }

  basePrompt += ` Answer the user's questions helpfully and accurately. If you don't have access to real-time information or are uncertain about something, say so clearly. Never fabricate specific facts, statistics, URLs, or citations.`;

  return basePrompt;
}

async function callOpenAI(messages: Array<{role: string, content: string}>): Promise<string> {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: getSystemMessage('ChatGPT (GPT-4o by OpenAI)') },
        ...messages
      ],
      max_tokens: 1000
    })
  })
  const data = await response.json()
  if (data.error) throw new Error(data.error.message)
  return data.choices[0].message.content
}

async function callClaude(messages: Array<{role: string, content: string}>): Promise<string> {
  const apiKey = Deno.env.get('CLAUDE_API_KEY')
  if (!apiKey) throw new Error('CLAUDE_API_KEY not configured')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1000,
      system: getSystemMessage('Claude (Sonnet 4.5 by Anthropic)'),
      messages: messages
    })
  })
  const data = await response.json()
  if (data.error) throw new Error(data.error.message)
  return data.content[0].text
}

async function callGrok(messages: Array<{role: string, content: string}>): Promise<string> {
  const apiKey = Deno.env.get('GROK_API_KEY')
  if (!apiKey) throw new Error('GROK_API_KEY not configured')

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'grok-4',
      messages: [
        { role: 'system', content: getSystemMessage('Grok 4 by xAI', true) },
        ...messages
      ],
      max_tokens: 1000
    })
  })
  const data = await response.json()
  if (data.error) throw new Error(data.error.message)
  return data.choices[0].message.content
}

async function callPerplexity(messages: Array<{role: string, content: string}>): Promise<string> {
  const apiKey = Deno.env.get('PERPLEXITY_API_KEY')
  if (!apiKey) throw new Error('PERPLEXITY_API_KEY not configured')

  // Perplexity requires strict user/assistant alternation
  const lastUserMessage = messages.filter(m => m.role === 'user').pop()
  const formattedMessages = lastUserMessage
    ? [{ role: 'user', content: lastUserMessage.content }]
    : []

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: getSystemMessage('Perplexity (Sonar Pro)') },
        ...formattedMessages
      ],
      max_tokens: 1000
    })
  })
  const data = await response.json()
  if (data.error) throw new Error(data.error.message)
  return data.choices[0].message.content
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { provider, messages } = await req.json()

    if (!provider || !messages) {
      throw new Error('Missing provider or messages')
    }

    let result: string

    switch (provider) {
      case 'openai':
        result = await callOpenAI(messages)
        break
      case 'claude':
        result = await callClaude(messages)
        break
      case 'grok':
        result = await callGrok(messages)
        break
      case 'perplexity':
        result = await callPerplexity(messages)
        break
      default:
        throw new Error(`Unknown provider: ${provider}`)
    }

    return new Response(
      JSON.stringify({ content: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
