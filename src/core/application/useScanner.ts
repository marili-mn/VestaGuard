import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Artifact } from '../domain/types';
import { HybridAnalyzer } from '../../infrastructure/adapters/HybridAnalyzer';

const analyzer = new HybridAnalyzer(); // Dependency Injection could go here

export function useScanner() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);

  const addArtifact = useCallback((file: File) => {
    const newArtifact: Artifact = {
      id: uuidv4(),
      name: file.name,
      type: 'file',
      content: file,
      size: file.size,
      timestamp: new Date(),
      status: 'pending'
    };
    
    setArtifacts(prev => [newArtifact, ...prev]);
    scanArtifact(newArtifact);
  }, []);

  const scanArtifact = async (artifact: Artifact) => {
    // 1. Set to scanning
    setArtifacts(prev => prev.map(a => a.id === artifact.id ? { ...a, status: 'scanning' } : a));

    // 2. Perform Analysis (Async)
    try {
      const result = await analyzer.analyze(artifact);
      
      // 3. Update with Result
      setArtifacts(prev => prev.map(a => a.id === artifact.id ? 
        { ...a, status: 'complete', result } : a
      ));
    } catch (error) {
      setArtifacts(prev => prev.map(a => a.id === artifact.id ? 
        { ...a, status: 'error' } : a
      ));
    }
  };

  return {
    artifacts,
    addArtifact
  };
}
