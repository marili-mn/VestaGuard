export type ArtifactType = 'file' | 'log' | 'text';

export type RiskLevel = 'SAFE' | 'SUSPICIOUS' | 'MALICIOUS' | 'CRITICAL';

export interface ComplianceGap {
  controlId: string; // e.g., "ISO-27001-A.12.3.1"
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ThreatIoC {
  type: 'IP' | 'HASH' | 'PATTERN';
  value: string;
  confidence: number;
}

export interface AnalysisResult {
  riskLevel: 'CRITICAL' | 'SUSPICIOUS' | 'SAFE' | 'UNKNOWN';
  score: number;
  summary: string;
  complianceGaps: Array<{
    controlId: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
  }>;
  threats: Array<{
    type: string;
    value: string;
    confidence: number;
  }>;
  engines: {
    reputation: boolean;
    aiContext: boolean;
  };
  // Nuevo campo para el flujo agéntico
  agentHistory?: Array<{
    name: string;
    content: string;
    role?: string;
  }>;
}

export interface Artifact {
  id: string;
  name: string;
  type: ArtifactType;
  content: string | File; // Text content or File object
  size: number;
  timestamp: Date;
  status: 'pending' | 'scanning' | 'complete' | 'error';
  result?: AnalysisResult;
}

// Port (Interface) for the Infrastructure Adapters
export interface AnalyzerPort {
  analyze(artifact: Artifact): Promise<AnalysisResult>;
  chat(message: string): Promise<string>;
}
