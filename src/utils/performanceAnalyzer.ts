export interface AnalysisResult {
  severity: 'critical' | 'warning' | 'info';
  line?: number;
  message: string;
  suggestion: string;
}

export const analyzeCode = (code: string): AnalysisResult[] => {
  const results: AnalysisResult[] = [];
  const lines = code.split('\n');

  // Regex patterns
  const loops = /while\s+true\s+do/g;
  const waits = /(Citizen\.)?Wait\s*\(\s*0\s*\)/g;
  
  // Check for infinite loops without waits (Global check)
  if (loops.test(code)) {
    // This is a naive check, a real parser would be better but this catches the obvious "while true do end"
    const hasWait = /(Citizen\.)?Wait\(/.test(code);
    if (!hasWait) {
      results.push({
        severity: 'critical',
        message: 'Potential infinite loop detected without Wait()',
        suggestion: 'Ensure all "while true" loops contain a Wait(0) or similar to prevent crashes.'
      });
    }
  }

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    
    // Skip comments
    if (trimmed.startsWith('--') || trimmed.startsWith('//')) return;

    // 1. Legacy Distance Checks
    if (trimmed.includes('Vdist') || trimmed.includes('GetDistanceBetweenCoords')) {
      results.push({
        severity: 'warning',
        line: lineNum,
        message: 'Slow distance check detected',
        suggestion: 'Use Lua math syntax: #(vectorA - vectorB) which is significantly faster.'
      });
    }

    // 2. Synchronous SQL
    if (trimmed.includes('MySQL.Sync')) {
      results.push({
        severity: 'critical',
        line: lineNum,
        message: 'Synchronous SQL query blocks the main thread',
        suggestion: 'Use MySQL.Async or exports.oxmysql (await) to prevent server lag/freezes.'
      });
    }

    // 3. Debug Prints
    if (trimmed.match(/^(print|console\.log)\s*\(/)) {
      results.push({
        severity: 'info',
        line: lineNum,
        message: 'Debug print statement detected',
        suggestion: 'Remove before releasing to production to reduce console spam.'
      });
    }

    // 4. DrawText3D (often unoptimized)
    if (trimmed.includes('DrawText3D')) {
      results.push({
        severity: 'info',
        line: lineNum,
        message: '3D Text usage detected',
        suggestion: 'Ensure this is only called when close to the player to save FPS.'
      });
    }
    
    // 5. Deprecated Natives
    if (trimmed.includes('RegisterServerEvent')) {
      results.push({
        severity: 'info',
        line: lineNum,
        message: 'RegisterServerEvent is deprecated',
        suggestion: 'Use RegisterNetEvent instead.'
      });
    }
  });

  return results;
};
