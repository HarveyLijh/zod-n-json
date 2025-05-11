# Zod ↔️ JSON Converter

A simple, elegant web tool for converting between Zod schemas and JSON Schema/JSONC.

## Features

- **Bidirectional Conversion**: Convert from Zod to JSON and vice versa
- **Full JSONC Support**: Generate JSONC (JSON with Comments) output and parse JSONC input with proper comment handling
- **Modern UI**: Clean, responsive interface with dark mode support
- **Code Editor**: Syntax highlighting and formatting for both Zod and JSON
- **Preserves Metadata**: Maintains descriptions, nullable fields, and optional flags

## Usage

Visit the [live demo](https://harveyli.github.io/zod-n-json/) to use the tool directly.

### Converting Zod to JSON

1. Paste your Zod schema into the left editor
2. Choose whether to include comments in the JSON output
3. Click the "Zod → JSON" button
4. The converted JSON will appear in the right editor

#### Tips for Zod to JSON Conversion
- For complex schemas, make sure to include all schema definitions in the correct order
- Add an `export` statement to your main schema to help the tool identify it
- Remove any import statements that aren't directly related to Zod
- The tool will handle descriptions, nullable and optional fields

### Converting JSON to Zod

1. Click the "Switch to JSON → Zod" button at the top
2. Paste your JSON or JSONC schema into the left editor
3. Click the "JSON → Zod" button
4. The converted Zod schema will appear in the right editor

#### Tips for JSON to Zod Conversion

- The input should follow the custom JSON format produced by this tool (not standard JSON Schema)
- JSONC (JSON with Comments) is fully supported - both `//` and `/* */` style comments will be properly handled
- Comments in JSONC will be converted to Zod descriptions
- The resulting Zod code can be directly used in TypeScript projects

## Frequently Asked Questions

### Why am I getting a "Failed to parse Zod schema" error?
This usually happens when:
1. Your Zod schema contains syntax errors
2. You're using advanced Zod features that our parser doesn't yet support
3. The schema is too complex with circular references

Try simplifying your schema or exporting only the main schema you want to convert.

### Can I convert TypeScript interfaces to Zod?
No, this tool specifically converts between Zod schemas and our custom JSON format. 
For TypeScript interfaces to Zod conversion, consider using tools like 
[zod-to-ts](https://github.com/sachinraja/zod-to-ts) or 
[ts-to-zod](https://github.com/fabien0102/ts-to-zod).

### Is my data safe?
Yes, all conversions happen entirely in your browser. No data is sent to any server.

## Local Development

```bash
# Clone the repository
git clone https://github.com/harveyli/zod-n-json.git
cd zod-n-json

# Install dependencies
yarn install

# Start the development server
yarn dev
```

## Building for Production

```bash
# Build the application
yarn build

# Preview the production build
yarn preview
```

## Deployment

The project is set up for easy deployment to GitHub Pages:

```bash
# Deploy to GitHub Pages
yarn deploy
```

## Built With

- [React](https://reactjs.org/) - UI Framework
- [TypeScript](https://www.typescriptlang.org/) - Type Safety
- [Zod](https://github.com/colinhacks/zod) - TypeScript-first schema validation
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor component
- [Vite](https://vitejs.dev/) - Frontend build tool

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.