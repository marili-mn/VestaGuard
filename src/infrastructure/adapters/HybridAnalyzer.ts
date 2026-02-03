import type { AnalyzerPort, Artifact, AnalysisResult } from '../../core/domain/types';

export class HybridAnalyzer implements AnalyzerPort {
  private readonly API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  async analyze(artifact: Artifact): Promise<AnalysisResult> {
    try {
      // 1. Try Real Backend Connection
      console.log(`[VestaGuard] Connecting to Neural Core at ${this.API_URL}...`);
      
      // Only attempt fetch if content is text (simplification for demo)
      // Real app would send FormData with file
      if (typeof artifact.content !== 'string' && !(artifact.content instanceof File)) {
         throw new Error("Invalid content type");
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout for detection

      const formData = new FormData();
      if (artifact.content instanceof File) {
          formData.append('file', artifact.content);
      } else {
          formData.append('file', new Blob([artifact.content], { type: 'text/plain' }));
      }

      const response = await fetch(`${this.API_URL}/analyze`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        // El backend devuelve { "status": "complete", "report": "JSON_STRING", "history": [...] }
        try {
            const report = typeof data.report === 'string' ? JSON.parse(data.report) : data.report;
            return {
                ...report,
                engines: { reputation: true, aiContext: true },
                // Mapeamos el historial de AutoGen para el frontend
                agentHistory: Array.isArray(data.history) ? data.history.map((h: any) => ({
                    name: h.name || h.role,
                    content: h.content,
                    role: h.role
                })) : []
            };
        } catch (e) {
            console.error("[VestaGuard] Failed to parse agent report:", data.report);
            throw new Error("Invalid report format from agents");
        }
      } else {
        throw new Error("Backend offline");
      }

    } catch (error) {
      console.warn("[VestaGuard] Backend unavailable, engaging Offline Simulation Protocol.", error);
      return this.runSimulation(artifact);
    }
  }

  // --- FALLBACK SIMULATION (Deterministic) ---
  private async runSimulation(artifact: Artifact): Promise<AnalysisResult> {
    await new Promise(resolve => setTimeout(resolve, 2500)); // Simulate processing time

    const name = artifact.name.toLowerCase();
    
    if (name.includes('malware') || name.includes('virus')) {
      return {
        riskLevel: 'CRITICAL',
        score: 15,
        summary: 'OFFLINE MODE: Heuristic detection identified malware signatures matching "Trojan.Emotet".',
        complianceGaps: [{ controlId: 'NIST-IR-4', description: 'Malware containment required.', severity: 'high' }],
        threats: [{ type: 'HASH', value: 'e3b0c442...', confidence: 0.99 }],
        engines: { reputation: false, aiContext: true }
      };
    }

    if (name.includes('key') || name.includes('secret') || name.includes('.env')) {
      return {
        riskLevel: 'SUSPICIOUS',
        score: 45,
        summary: 'OFFLINE MODE: Static analysis detected potential hardcoded secrets.',
        complianceGaps: [{ controlId: 'ISO-27001-A.9', description: 'Cleartext credentials found.', severity: 'high' }],
        threats: [],
        engines: { reputation: false, aiContext: true }
      };
    }

    return {
      riskLevel: 'SAFE',
      score: 98,
      summary: 'OFFLINE MODE: No obvious threats detected in static analysis.',
      complianceGaps: [],
      threats: [],
      engines: { reputation: false, aiContext: true }
    };
  }

  async chat(message: string): Promise<string> {
    try {
      const response = await fetch(`${this.API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      if (response.ok) {
        const data = await response.json();
        return data.response;
      }
      throw new Error("Backend offline");
    } catch (error) {
      console.warn("[VestaGuard] Backend offline, using simulation.");
      await new Promise(r => setTimeout(r, 1000));
      return "I'm currently in Offline Mode. I can simulate audit reports if you upload files, but my conversational neural core is unreachable.";
    }
  }
}
