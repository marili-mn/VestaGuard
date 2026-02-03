import type { AnalyzerPort, Artifact, AnalysisResult } from '../../core/domain/types';

/**
 * HybridAnalyzer
 * 
 * Demonstrates the "Strangler Fig" pattern:
 * 1. Checks if real API keys are present.
 * 2. If yes, calls the real API (VirusTotal / OpenAI).
 * 3. If no, falls back to the deterministic Mock for demos.
 */
export class MockHybridAnalyzer implements AnalyzerPort {
  
  async analyze(_artifact: Artifact): Promise<AnalysisResult> {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      riskLevel: 'SAFE',
      score: 95,
      summary: 'MOCK: Analysis completed successfully (Simulated).',
      complianceGaps: [],
      threats: [],
      engines: { reputation: true, aiContext: false }
    };
  }

  async chat(message: string): Promise<string> {
    return `MOCK: I received your message "${message}". This is a simulated response.`;
  }
}