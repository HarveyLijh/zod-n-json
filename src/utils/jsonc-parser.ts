import { ZodToJsonSchema } from './converter';

/**
 * Parse JSON with Comments (JSONC) into a JavaScript object
 * This parser handles both line comments (//) and block comments (/* *\/)
 * @param source The JSONC string to parse
 * @returns Parsed JavaScript object
 */
export function parseJsonc(source: string): ZodToJsonSchema {
  // First, remove comments from the JSON string
  const cleanedJsonString = removeComments(source);
  
  // Log the cleaned JSON string for debugging (first 200 chars)
  console.log("Cleaned JSON:", cleanedJsonString.substring(0, 200) + "...");
  
  // Fix common JSON issues like trailing commas and unquoted property names
  const fixCommonJsonIssues = (jsonString: string): string => {
    // Fix trailing commas in objects and arrays
    let fixed = jsonString.replace(/,(\s*[}\]])/g, '$1');
    
    // Handle the specific issue with comments after property names
    // This pattern searches for property names followed by a commented value
    // Look for the pattern: "property": something, // comment
    // And ensure it's properly formatted
    fixed = fixed.replace(/(".*?")(\s*:\s*)(.*?)(\s*)(,?)(\s*)/g, (match, propName, colon, value, space, comma, endSpace) => {
      // Make sure the value is properly formatted
      return `${propName}${colon}${value.trim()}${comma ? ',' : ''}${endSpace}`;
    });
    
    // Add double quotes to unquoted property names (one of the most common issues)
    // This regex looks for unquoted property names like 'foo:' and changes them to '"foo":'
    fixed = fixed.replace(/(\{|\,)\s*([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":');
    
    // Fix single-quoted strings to be double-quoted (another common issue)
    try {
      // We'll use a more reliable approach - tokenize the JSON-like string first
      let result = '';
      let inString = false;
      let stringQuote = '';
      let escaped = false;
      
      for (let i = 0; i < fixed.length; i++) {
        const char = fixed[i];
        
        if (!inString) {
          // If not in a string, check if we're starting one
          if (char === '"' || char === "'") {
            inString = true;
            stringQuote = char;
            result += char === "'" ? '"' : char;
          } else {
            result += char;
          }
        } else {
          // Inside a string
          if (escaped) {
            // If the previous character was a backslash, add this character as-is
            result += char;
            escaped = false;
          } else if (char === '\\') {
            // Escape the next character
            escaped = true;
            result += char;
          } else if (char === stringQuote) {
            // End of string
            inString = false;
            result += stringQuote === "'" ? '"' : char;
          } else {
            // Regular character inside string
            result += char;
          }
        }
      }
      
      fixed = result;
    } catch (e) {
      // If something goes wrong with our string conversion, fall back to the original
      console.error("Error converting single quotes:", e);
    }
    
    // Look for and fix specific patterns of malformed JSON
    // 1. Fix properties that look like type: "literal" to be "type": "literal"
    fixed = fixed.replace(/(\{|\,)\s*([a-zA-Z0-9_$]+)\s*:\s*(".*?"|\d+|true|false|null)/g, '$1"$2":$3');
    
    return fixed;
  };
  
  // Apply common JSON fixes
  const fixedJsonString = fixCommonJsonIssues(cleanedJsonString);
  
  // Debug: Log the problematic JSON area if parsing fails
  const debugJsonError = (errorMessage: string, jsonStr: string) => {
    // Extract position information from error message
    const posMatch = errorMessage.match(/position (\d+)/);
    if (posMatch) {
      const pos = parseInt(posMatch[1]);
      const start = Math.max(0, pos - 40);
      const end = Math.min(jsonStr.length, pos + 40);
      const contextBefore = jsonStr.substring(start, pos);
      const contextAfter = jsonStr.substring(pos, end);
      console.error(`JSON error at position ${pos}:`);
      console.error(`...${contextBefore}👉HERE👈${contextAfter}...`);
      
      // Count lines to provide more helpful position info
      let line = 1;
      let col = 1;
      for (let i = 0; i < pos; i++) {
        if (jsonStr[i] === '\n') {
          line++;
          col = 1;
        } else {
          col++;
        }
      }
      console.error(`Line ${line}, Column ${col}`);
    }
    return errorMessage;
  };
  
  // Try multiple parse attempts with progressive fallbacks
  try {
    // First attempt: Regular JSON parse
    return JSON.parse(fixedJsonString) as ZodToJsonSchema;
  } catch (error) {
    try {
      // Second attempt: Try using a more permissive parser if available
      // In a browser, we could use Function constructor, but it's not ideal
      // For now, let's try additional fixes first
      
      // Add some additional fixes for specific common issues
      const extraFixedJsonString = fixedJsonString
        // Fix single quotes that might be nested inside double quotes
        .replace(/(?<=:\s*"[^"]*)'([^']*)'([^"]*")/g, '"$1"$2')
        // Ensure property names in nested objects are quoted
        .replace(/(?<={[^{}]*)\b([a-zA-Z0-9_]+):/g, '"$1":');
      
      return JSON.parse(extraFixedJsonString) as ZodToJsonSchema;
    } catch (extraError) {
      if (error instanceof Error) {
        const errorMsg = debugJsonError(error.message, fixedJsonString);
        throw new Error(errorMsg);
      }
      throw new Error('Invalid JSON format');
    }
  }
}

/**
 * Remove comments from a JSONC string
 * @param source The JSONC string to clean
 * @returns A clean JSON string without comments
 */
function removeComments(source: string): string {
  enum State {
    DEFAULT,
    IN_STRING,
    IN_LINE_COMMENT,
    IN_BLOCK_COMMENT
  }

  let result = '';
  let state = State.DEFAULT;
  let i = 0;
  let escapeChar = false;
  
  while (i < source.length) {
    const char = source[i];
    const nextChar = i + 1 < source.length ? source[i + 1] : '';
    
    switch (state) {
      case State.DEFAULT:
        if (char === '"' && !escapeChar) {
          state = State.IN_STRING;
          result += char;
        } else if (char === '/' && nextChar === '/') {
          state = State.IN_LINE_COMMENT;
          i++; // Skip the next character ('/')
        } else if (char === '/' && nextChar === '*') {
          state = State.IN_BLOCK_COMMENT;
          i++; // Skip the next character ('*')
        } else {
          result += char;
        }
        break;
        
      case State.IN_STRING:
        result += char;
        if (char === '\\') {
          escapeChar = !escapeChar;
        } else if (char === '"' && !escapeChar) {
          state = State.DEFAULT;
        } else {
          escapeChar = false;
        }
        break;
        
      case State.IN_LINE_COMMENT:
        // When in a line comment, don't add any characters to the result
        // but when hitting a newline, go back to DEFAULT state
        if (char === '\n') {
          state = State.DEFAULT;
          result += '\n'; // Preserve the newline
        } else if (char === '\r') {
          // Handle Windows-style line endings (\r\n)
          state = State.DEFAULT;
          if (nextChar === '\n') {
            // Don't add '\r' yet, will add '\n' on next iteration
          } else {
            result += '\r'; // Single \r (rare, but possible)
          }
        }
        // Skip all other characters in the line comment
        break;
        
      case State.IN_BLOCK_COMMENT:
        if (char === '*' && nextChar === '/') {
          state = State.DEFAULT;
          i++; // Skip the next character ('/')
        }
        break;
    }
    
    i++;
  }
  
  return result;
}
