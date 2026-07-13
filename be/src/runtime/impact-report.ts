import { readServerEnv } from '../config/env';
import { handleCreateImpactReport } from '../routes/ai-impact-report';
import { callGeminiJson } from '../services/ai-provider';

export async function createImpactReportWithGemini(body: unknown, env = readServerEnv()) {
  return handleCreateImpactReport(body, (prompt) =>
    callGeminiJson(prompt, {
      apiKey: env.aiApiKey,
      model: env.aiModel,
    }),
  );
}
