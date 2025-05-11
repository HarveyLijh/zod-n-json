import React, { useState } from 'react';
import { editor } from 'monaco-editor';
import Editor from '@monaco-editor/react';
import './styles/App.css';
import { parseZodCode, jsonToZod, formatZodCode, generateJsonOutput, ZodToJsonSchema } from './utils/converter';
import {parseJsonc} from './utils/jsonc-parser';

// Example schemas for reference
import { exampleZodSchema } from './utils/examples';

// Define the conversion direction
type Direction = 'zod-to-json' | 'json-to-zod';

const App: React.FC = () => {
  const [direction, setDirection] = useState<Direction>('zod-to-json');
  const [includeComments, setIncludeComments] = useState<boolean>(true);
  const [sourceCode, setSourceCode] = useState<string>(exampleZodSchema);
  const [targetCode, setTargetCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Handle conversion process
  const handleConvert = () => {
    setError(null);
    
    try {
      if (direction === 'zod-to-json') {
        // For Zod to JSON, we need either a schema object or an exported schema
        if (!sourceCode.trim()) {
          throw new Error('Please enter a Zod schema to convert');
        }

        // If the code has import statements, extract the main schema components
        const jsonSchema = parseZodCode(sourceCode);
        
        if (!jsonSchema) {
          throw new Error(
            'Failed to parse Zod schema. Make sure you\'re providing a valid schema. ' +
            'For complex schemas with imports, ensure there is an exported schema using "export const YourSchema = ..."'
          );
        }
        
        const jsonOutput = generateJsonOutput(jsonSchema, includeComments);
        setTargetCode(jsonOutput);
      } else {
        // Convert JSON to Zod schema
        try {
          // Use our JSONC parser to support comments in the JSON input
          const jsonSchema: ZodToJsonSchema = parseJsonc(sourceCode);
          const zodCode = jsonToZod(jsonSchema);
          setTargetCode(formatZodCode(zodCode));
        } catch (parseErr) {
          throw new Error(`Invalid JSON: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`);
        }
      }
    } catch (err) {
      console.error('Conversion error:', err);
      setError(`Error during conversion: ${err instanceof Error ? err.message : String(err)}`);
      setTargetCode('');
    }
  };

  // Switch conversion direction
  const toggleDirection = () => {
    const newDirection = direction === 'zod-to-json' ? 'json-to-zod' : 'zod-to-json';
    setDirection(newDirection);
    setSourceCode('');
    setTargetCode('');
    setError(null);
  };

  // Copy target code to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(targetCode)
      .then(() => {
        // Could add a toast notification here
        console.log('Copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy:', err);
      });
  };

  // Editor options
  const editorOptions: editor.IStandaloneEditorConstructionOptions = {
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    glyphMargin: false,
    folding: true,
    lineDecorationsWidth: 7,
    lineNumbersMinChars: 3,
    automaticLayout: true,
  };

  return (
    <div className="app">
      <header>
        <div className="logo-container">
          <img src="/zod-icon.svg" alt="Zod icon" className="logo" />
          <h1>Zod ↔️ JSON Converter</h1>
        </div>
        <div className="header-controls">
          <button
            onClick={toggleDirection}
            className="toggle-button"
          >
            {direction === 'zod-to-json' ? 'Switch to JSON → Zod' : 'Switch to Zod → JSON'}
          </button>
        </div>
      </header>

      <main>
        {error && (
          <div className="error-container">
            <p className="error-message">{error}</p>
          </div>
        )}
        
        <div className="helper-panel">
          <div className="helper-text">
            <h3>How to use:</h3>
            <p>
              {direction === 'zod-to-json' 
                ? 'Paste your Zod schema code below. Make sure to include any schema variable definitions and exports.'
                : 'Paste your JSON or JSONC (JSON with Comments) schema below. The structure should match the Zod converter format.'}
            </p>
          </div>
          
          <div className="tips">
            <h4>{direction === 'zod-to-json' ? 'Tips for Zod conversion:' : 'Tips for JSON conversion:'}</h4>
            <ul>
              {direction === 'zod-to-json' ? (
                <>
                  <li>Include all schema definitions in the correct order</li>
                  <li>Export your main schema with <code>export const YourSchema = ...</code></li>
                  <li>Remove non-zod imports</li>
                </>
              ) : (
                <>
                  <li>Use the format generated by this tool (not standard JSON Schema)</li>
                  <li>Both description fields and comments will be converted to Zod descriptions</li>
                  <li>Make sure JSON is valid with proper nesting</li>
                </>
              )}
            </ul>
            <p className="more-help">
              <a href="/user-guide.md" target="_blank" rel="noopener noreferrer">
                Need more help? View the full user guide
              </a>
            </p>
          </div>
        </div>
        
        <div className="converter-container">
          <div className="editor-container">
            <div className="editor-header">
              <h2>{direction === 'zod-to-json' ? 'Zod Schema' : 'JSON Schema'}</h2>
            </div>
            <Editor
              height="100%"
              language={direction === 'zod-to-json' ? 'typescript' : 'json'}
              theme="vs-dark"
              value={sourceCode}
              options={editorOptions}
              onChange={(value) => setSourceCode(value || '')}
            />
          </div>

          <div className="controls">
            {direction === 'zod-to-json' && (
              <div className="options">
                <label>
                  <input
                    type="checkbox"
                    checked={includeComments}
                    onChange={(e) => setIncludeComments(e.target.checked)}
                  />
                  Include additional comments (JSONC)
                </label>
                <div className="option-info">
                  Descriptions are always added to the schema. This adds extra comments.
                </div>
              </div>
            )}
            <button 
              onClick={handleConvert}
              className="convert-button"
            >
              {direction === 'zod-to-json' ? 'Zod → JSON' : 'JSON → Zod'}
            </button>
          </div>

          <div className="editor-container">
            <div className="editor-header">
              <h2>{direction === 'zod-to-json' ? 'JSON Output' : 'Zod Schema Output'}</h2>
              {targetCode && (
                <button 
                  onClick={copyToClipboard}
                  className="copy-button"
                >
                  Copy
                </button>
              )}
            </div>
            <Editor
              height="100%"
              language={direction === 'zod-to-json' ? 'json' : 'typescript'}
              theme="vs-dark"
              value={targetCode}
              options={{ ...editorOptions, readOnly: true }}
            />
          </div>
        </div>

      </main>

      <footer>
        <p>
          Built with <a href="https://github.com/colinhacks/zod" target="_blank" rel="noopener noreferrer">Zod</a> and 
          <a href="https://reactjs.org/" target="_blank" rel="noopener noreferrer"> React</a>
        </p>
        <p>
          <a href="/user-guide.md" target="_blank" rel="noopener noreferrer">User Guide</a> | 
          <a href="https://github.com/harveyli/zod-n-json" target="_blank" rel="noopener noreferrer"> View on GitHub</a>
        </p>
      </footer>
    </div>
  );
};

export default App;
