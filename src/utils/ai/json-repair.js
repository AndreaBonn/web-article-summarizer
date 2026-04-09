// JSON Repair — robust parsing for LLM-generated JSON responses
import { Logger } from '../core/logger.js';

/**
 * Parse JSON from LLM responses with automatic repair for common issues.
 * Handles: markdown code fences, unbalanced brackets, trailing commas.
 *
 * @param {string} text - Raw LLM response text
 * @returns {object} Parsed JSON object
 * @throws {Error} If JSON cannot be parsed or repaired
 */
export function parseLLMJson(text) {
  // Strip markdown code fences
  let jsonText = text.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '');

  // Extract outermost JSON object or array
  const firstBrace = jsonText.indexOf('{');
  const firstBracket = jsonText.indexOf('[');
  const firstOpen = Math.min(
    firstBrace === -1 ? Infinity : firstBrace,
    firstBracket === -1 ? Infinity : firstBracket,
  );

  if (!isFinite(firstOpen)) {
    throw new Error('No valid JSON found in LLM response');
  }

  const lastClose = Math.max(jsonText.lastIndexOf('}'), jsonText.lastIndexOf(']'));
  // If no closer found, take everything from first opener (repair will add closers)
  jsonText =
    lastClose > firstOpen
      ? jsonText.substring(firstOpen, lastClose + 1)
      : jsonText.substring(firstOpen);

  try {
    return JSON.parse(jsonText);
  } catch {
    Logger.warn('Malformed JSON from LLM, attempting repair...');
  }

  // Repair: balance braces and brackets in correct nesting order
  let repaired = jsonText;
  const stack = [];
  let inString = false;
  let escape = false;
  for (const ch of repaired) {
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if (ch === '}' || ch === ']') stack.pop();
  }
  repaired += stack.reverse().join('');

  // Remove trailing commas before } or ]
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

  try {
    const result = JSON.parse(repaired);
    Logger.info('JSON repaired successfully');
    return result;
  } catch (repairError) {
    Logger.error('JSON repair failed:', repairError);
    throw new Error('Malformed JSON from LLM that could not be repaired');
  }
}
