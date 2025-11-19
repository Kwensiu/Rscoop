// PowerShell error patterns that should be highlighted as errors even when they appear in stdout
export const PS_ERROR_PATTERNS = [
  "access to the path",
  "denied",
  "cannot",
  "failed",
  "error",
  "remove-item"
];

/**
 * Checks if a line contains PowerShell error patterns
 * @param line - The line to check for error patterns
 * @returns true if the line contains PowerShell error keywords
 */
export function hasPSError(line: string): boolean {
  const cleanLine = line.toLowerCase();
  return PS_ERROR_PATTERNS.some(pattern => 
    cleanLine.includes(pattern.toLowerCase())
  );
}

/**
 * Determines if a line should be displayed as an error
 * @param line - The line to check
 * @param isStderr - Whether the line came from stderr stream
 * @returns true if the line should be displayed as an error
 */
export function isErrorLine(line: string, isStderr?: boolean): boolean {
  return isStderr || hasPSError(line);
}