// Backward compatibility barrel — prefer direct imports from sub-modules
// APIClient alias → APIOrchestrator (orchestrazione multi-provider)
// ContentDetector, PromptBuilder, ProviderCaller, ResponseParser restano moduli separati
export { APIOrchestrator as APIClient } from './api-orchestrator.js';
export { DEFAULT_MODELS } from './api-orchestrator.js';
