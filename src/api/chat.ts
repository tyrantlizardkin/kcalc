import { Repos } from '../db';
import { generateContent, GeminiContent, GeminiPart } from './gemini';
import { CHAT_FUNCTIONS, TOOL_HANDLERS } from './chatTools';
import { buildContext } from './chatPersona';

const MAX_TOOL_ITERATIONS = 5;

export async function sendChatMessage(userText: string, date: string, repos: Repos): Promise<string> {
  const { systemPrompt, contextBlock } = await buildContext(repos, date);
  const contents: GeminiContent[] = [{ role: 'user', parts: [{ text: `${contextBlock}\n\nUSER: ${userText}` }] }];

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const result = await generateContent({ contents, systemInstruction: systemPrompt, tools: CHAT_FUNCTIONS });

    if (result.functionCalls.length === 0) {
      return result.text ?? 'No response.';
    }

    contents.push({ role: 'model', parts: result.functionCalls.map((fc): GeminiPart => ({ functionCall: fc })) });

    const responseParts: GeminiPart[] = await Promise.all(
      result.functionCalls.map(async (fc): Promise<GeminiPart> => {
        const handler = TOOL_HANDLERS[fc.name];
        if (!handler) {
          return { functionResponse: { name: fc.name, response: { error: `Unknown function: ${fc.name}` } } };
        }
        const output = await handler(fc.args, repos, date);
        return { functionResponse: { name: fc.name, response: output } };
      })
    );
    contents.push({ role: 'user', parts: responseParts });
  }

  return 'Reached tool-call limit without a final reply -- try rephrasing.';
}
