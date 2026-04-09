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
  const firstOpen = Math.min(
    jsonText.indexOf('{') === -1 ? Infinity : jsonText.indexOf('{'),
    jsonText.indexOf('[') === -1 ? Infinity : jsonText.indexOf('['),
  );
  const lastClose = Math.max(jsonText.lastIndexOf('}'), jsonText.lastIndexOf(']'));

  if (!isFinite(firstOpen) || lastClose === -1) {
    throw new Error('No valid JSON found in LLM response');
  }

  jsonText = jsonText.substring(firstOpen, lastClose + 1);

  try {
    return JSON.parse(jsonText);
  } catch {
    Logger.warn('Malformed JSON from LLM, attempting repair...');
  }

  // Repair: balance braces and brackets
  let repaired = jsonText;
  const openBraces = (repaired.match(/\{/g) || []).length;
  const closeBraces = (repaired.match(/\}/g) || []).length;
  if (openBraces > closeBraces) repaired += '}'.repeat(openBraces - closeBraces);

  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/\]/g) || []).length;
  if (openBrackets > closeBrackets) repaired += ']'.repeat(openBrackets - closeBrackets);

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
