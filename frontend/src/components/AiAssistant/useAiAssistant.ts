/**
 * useAiAssistant.ts — Convenience hook wrapping AiAssistantContext.
 *
 * Re-exports everything from AiAssistantContext so consumers can do:
 *   import { useAiAssistant } from 'components/AiAssistant';
 * instead of the longer context import.
 */

export { useAiAssistantContext as useAiAssistant } from "./AiAssistantContext";
