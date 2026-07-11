import { GoogleGenerativeAI } from '@google/generative-ai';
import * as repositoryService from '../repository/repository.service.js';

export const getAISuggestions = async (owner, repo, repoStats) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null; // Return null so service falls back to local heuristics
  }

  try {
    // 1. Fetch directory tree for architectural analysis
    const codebaseTree = await repositoryService.getCodebaseComposition(owner, repo);

    // 2. Initialize Gemini API Client
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ 
      model: 'gemini-flash-latest',
      // Configure structured JSON output formatting
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });

    // 3. Define structured instructions prompt
    const prompt = `You are a Senior Software Architect auditing the repository: "${owner}/${repo}".
    
    Repository Statistics:
    ${JSON.stringify(repoStats, null, 2)}
    
    Repository Directory Tree (showing folders & file sizes):
    ${JSON.stringify(codebaseTree, null, 2)}
    
    Examine the codebase structure, languages, commits activity, open issues, and developer stats.
    Generate 3 to 5 highly specific, actionable advancements or refactoring suggestions to improve the repository's code quality, architecture, governance, workflow, or community.
    
    For each suggestion, provide:
    1. Category: Must be exactly one of: "Workflow", "Governance", "Quality", or "Community".
    2. Title: A concise name of the suggestion.
    3. Description: What the issue is and what to change.
    4. AI Reasoning: Detailed, contextual analysis explaining the 'why' (e.g. why the current architecture has bottlenecks).
    5. Urgency: Must be exactly one of: "High", "Medium", or "Low".
    6. Projected Impact: What are the expected benefits (e.g. "Saves 4 hours in PR validations", "Decouples code dependencies").
    7. Actionable Step: Exact next step (e.g. specific file creations, command lines, folder renames, or configuration additions).
    
    You MUST output the result as a raw JSON array matching this exact schema:
    [
      {
        "category": "Workflow|Governance|Quality|Community",
        "title": "suggestion title",
        "description": "suggestion description",
        "aiReasoning": "AI reasoning analysis details",
        "urgency": "High|Medium|Low",
        "impact": "projected impact statistic or benefit",
        "actionableStep": "exact next action step"
      }
    ]
    
    Do not add any conversational text before or after the JSON array. Output only the raw valid JSON.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    try {
      const parsed = JSON.parse(responseText);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (parseError) {
      console.error('[Gemini AI] Failed to parse JSON response from LLM:', parseError, responseText);
    }
  } catch (error) {
    console.error('[Gemini AI] Network or model error calling Gemini API:', error);
  }

  return null;
};
