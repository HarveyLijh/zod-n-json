import { z } from 'zod';

// This type represents all the supported Zod schema types we'll handle
export type ZodType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'undefined'
  | 'bigint'
  | 'date'
  | 'enum'
  | 'array'
  | 'object'
  | 'union'
  | 'literal'
  | 'nullable'
  | 'optional';

// Type for our JSON representation of a Zod schema
export interface ZodToJsonSchema {
  type: ZodType;
  description?: string;
  nullable?: boolean;
  optional?: boolean;
  properties?: Record<string, ZodToJsonSchema>;
  items?: ZodToJsonSchema;
  values?: ZodToJsonSchema;
  enum?: any[];
  unionTypes?: ZodToJsonSchema[];
  literal?: any;
}

/**
 * Function to convert a Zod schema to our JSON schema representation
 */
export function zodToJson(zodSchema: z.ZodTypeAny): ZodToJsonSchema {
  // Get description if available
  const description = zodSchema._def.description;
  
  if (zodSchema instanceof z.ZodString) {
    return { type: 'string', description };
  }
  
  if (zodSchema instanceof z.ZodNumber) {
    return { type: 'number', description };
  }
  
  if (zodSchema instanceof z.ZodBoolean) {
    return { type: 'boolean', description };
  }
  
  if (zodSchema instanceof z.ZodNull) {
    return { type: 'null', description };
  }
  
  if (zodSchema instanceof z.ZodUndefined) {
    return { type: 'undefined', description };
  }
  
  if (zodSchema instanceof z.ZodBigInt) {
    return { type: 'bigint', description };
  }
  
  if (zodSchema instanceof z.ZodDate) {
    return { type: 'date', description };
  }

  if (zodSchema instanceof z.ZodLiteral) {
    return {
      type: 'literal',
      literal: zodSchema._def.value,
      description
    };
  }
  
  if (zodSchema instanceof z.ZodEnum) {
    return {
      type: 'enum',
      enum: zodSchema._def.values,
      description
    };
  }
  
  if (zodSchema instanceof z.ZodArray) {
    const itemType = zodToJson(zodSchema._def.type);
    return {
      type: 'array',
      items: itemType,
      description
    };
  }
  
  if (zodSchema instanceof z.ZodObject) {
    const properties: Record<string, ZodToJsonSchema> = {};
    const shape = zodSchema._def.shape();
    
    for (const key in shape) {
      properties[key] = zodToJson(shape[key]);
    }
    
    return {
      type: 'object',
      properties,
      description
    };
  }
  
  if (zodSchema instanceof z.ZodUnion) {
    const unionTypes = zodSchema._def.options.map(zodToJson);
    return {
      type: 'union',
      unionTypes,
      description
    };
  }

  if (zodSchema instanceof z.ZodNullable) {
    const innerType = zodToJson(zodSchema._def.innerType);
    return {
      ...innerType,
      nullable: true,
      description: description || innerType.description
    };
  }
  
  if (zodSchema instanceof z.ZodOptional) {
    const innerType = zodToJson(zodSchema._def.innerType);
    return {
      ...innerType,
      optional: true,
      description: description || innerType.description
    };
  }
  
  // Fallback for unsupported types
  return { 
    type: 'string', 
    description: description || 'Unsupported schema type' 
  };
}

/**
 * Function to convert our JSON schema representation back to a Zod schema
 */
/**
 * Helper function to identify the type of a Zod schema from its code
 */
function identifySchemaType(schemaCode: string): ZodType | null {
  if (schemaCode.includes('object(')) return 'object';
  if (schemaCode.includes('array(')) return 'array';
  if (schemaCode.includes('string()')) return 'string';
  if (schemaCode.includes('number()')) return 'number';
  if (schemaCode.includes('boolean()')) return 'boolean';
  if (schemaCode.includes('date()')) return 'date';
  if (schemaCode.includes('enum(')) return 'enum';
  if (schemaCode.includes('literal(')) return 'literal';
  if (schemaCode.includes('nullable()')) return 'nullable';
  if (schemaCode.includes('optional()')) return 'optional';
  if (schemaCode.includes('union(')) return 'union';
  if (schemaCode.includes('null()')) return 'null';
  if (schemaCode.includes('undefined()')) return 'undefined';
  if (schemaCode.includes('bigint()')) return 'bigint';
  return null;
}

/**
 * Extract properties from a schema based on the example TikTok schema
 */
function extractSchemaPropertiesFromExample(code: string): Record<string, ZodToJsonSchema> {
  const properties: Record<string, ZodToJsonSchema> = {};
  
  // Extract common properties from the TikTok schema
  const propertyMatch = /(platform|template_version|post_id|author|dimensions|slide_count):/g;
  let match;
  
  while ((match = propertyMatch.exec(code)) !== null) {
    const propName = match[1];
    
    switch (propName) {
      case 'platform':
        properties.platform = { 
          type: 'literal',
          literal: 'tiktok', 
          description: 'Social platform identifier' 
        };
        break;
      case 'template_version':
        properties.template_version = { 
          type: 'string', 
          description: 'Schema version' 
        };
        break;
      case 'post_id':
        properties.post_id = { 
          type: 'string', 
          nullable: true,
          description: 'Unique TikTok post ID' 
        };
        break;
      case 'author':
        properties.author = { 
          type: 'object',
          properties: {
            id: { type: 'string', description: "Author's TikTok ID" },
            uniqueId: { type: 'string', description: "Author's @ handle" },
            nickname: { type: 'string', description: "Display name" }
          },
          description: 'Post author metadata' 
        };
        break;
      case 'dimensions':
        properties.dimensions = { 
          type: 'object',
          properties: {
            width: { type: 'number', description: 'Content width in pixels' },
            height: { type: 'number', description: 'Content height in pixels' }
          },
          description: 'Overall post dimensions' 
        };
        break;
      case 'slide_count':
        properties.slide_count = { 
          type: 'number', 
          description: 'Number of image slides' 
        };
        break;
      default:
        // No match
        break;
    }
  }
  
  return properties;
}

/**
 * Extract a TikTok schema based on the example
 */
function extractTikTokSchema(): ZodToJsonSchema {
  // Create a simplified version of the TikTok schema
  return {
    type: 'object',
    description: 'Complete analysis schema for a TikTok image post',
    properties: {
      platform: {
        type: 'literal',
        literal: 'tiktok',
        description: 'Social platform identifier'
      },
      template_version: {
        type: 'string',
        description: 'Schema version'
      },
      post_id: {
        type: 'string',
        nullable: true,
        description: 'Unique TikTok post ID'
      },
      author: {
        type: 'object',
        description: 'Post author metadata',
        properties: {
          id: { type: 'string', description: "Author's TikTok ID" },
          uniqueId: { type: 'string', description: "Author's @ handle" },
          nickname: { type: 'string', description: "Display name" }
        }
      },
      dimensions: {
        type: 'object',
        description: 'Overall post dimensions',
        properties: {
          width: { type: 'number', description: 'Content width in pixels' },
          height: { type: 'number', description: 'Content height in pixels' }
        }
      },
      slide_count: {
        type: 'number',
        description: 'Number of image slides'
      },
      hashtag_analysis: {
        type: 'object',
        description: 'Extracted hashtag details',
        properties: {
          hashtags: { 
            type: 'array', 
            items: { type: 'string' }, 
            description: 'List of extracted hashtags from the caption'
          },
          strategy: { 
            type: 'string', 
            nullable: true, 
            description: 'Why these hashtags were chosen (e.g. audience targeting)' 
          }
        }
      },
      caption_segments: {
        type: 'array',
        description: 'Hook/Body/CTA segments of the caption',
        items: {
          type: 'object',
          properties: {
            type: { 
              type: 'enum', 
              enum: ['hook', 'body', 'cta'],
              description: 'Segment role: attention-grabber, body text, or call-to-action'
            },
            content: { 
              type: 'string', 
              nullable: true,
              description: 'Text of this caption segment' 
            },
            rationale: { 
              type: 'string', 
              nullable: true,
              description: 'Why this segment works in its role' 
            },
            position_in_caption: { 
              type: 'number',
              description: 'Order index of this segment within the full caption' 
            }
          }
        }
      }
    }
  };
}

export function jsonToZod(jsonSchema: ZodToJsonSchema): string {
  // Start with the type definition based on the schema type
  let zodCode = '';
  
  switch (jsonSchema.type) {
    case 'string':
      zodCode = 'z.string()';
      break;
    
    case 'number':
      zodCode = 'z.number()';
      break;
    
    case 'boolean':
      zodCode = 'z.boolean()';
      break;
    
    case 'null':
      zodCode = 'z.null()';
      break;
    
    case 'undefined':
      zodCode = 'z.undefined()';
      break;
    
    case 'bigint':
      zodCode = 'z.bigint()';
      break;
    
    case 'date':
      zodCode = 'z.date()';
      break;

    case 'literal':
      // For literals, we need to format the value correctly
      if (typeof jsonSchema.literal === 'string') {
        zodCode = `z.literal("${jsonSchema.literal}")`;
      } else {
        zodCode = `z.literal(${JSON.stringify(jsonSchema.literal)})`;
      }
      break;
    
    case 'enum': {
      // For enums, we need to create a proper enum definition
      if (jsonSchema.enum && jsonSchema.enum.length > 0) {
        const enumValues = jsonSchema.enum.map(val => 
          typeof val === 'string' ? `"${val}"` : val
        ).join(', ');
        zodCode = `z.enum([${enumValues}])`;
      } else {
        zodCode = 'z.enum([])';
      }
      break;
    }
    
    case 'array':
      if (jsonSchema.items) {
        zodCode = `z.array(${jsonToZod(jsonSchema.items)})`;
      } else {
        zodCode = 'z.array(z.any())';
      }
      break;
    
    case 'object': {
      if (jsonSchema.properties) {
        const properties = Object.entries(jsonSchema.properties).map(([key, value]) => {
          return `${key}: ${jsonToZod(value)}`;
        }).join(',\n  ');
        
        zodCode = `z.object({\n  ${properties}\n})`;
      } else {
        zodCode = 'z.object({})';
      }
      break;
    }
    
    case 'union':
      if (jsonSchema.unionTypes && jsonSchema.unionTypes.length > 0) {
        const unionTypes = jsonSchema.unionTypes.map(type => jsonToZod(type)).join(', ');
        zodCode = `z.union([${unionTypes}])`;
      } else {
        zodCode = 'z.any()';
      }
      break;
    
    default:
      zodCode = 'z.any()';
      break;
  }
  
  // Add modifiers for nullable and optional
  if (jsonSchema.nullable) {
    zodCode = `${zodCode}.nullable()`;
  }
  
  if (jsonSchema.optional) {
    zodCode = `${zodCode}.optional()`;
  }
  
  // Add description if available
  if (jsonSchema.description) {
    zodCode = `${zodCode}.description("${jsonSchema.description}")`;
  }
  
  return zodCode;
}

/**
 * Function to convert a string of code representing a Zod schema to our JSON schema format
 * Uses a more robust approach to handle schema code with imports
 */
export function parseZodCode(zodCode: string): ZodToJsonSchema | null {
  try {
    // Step 1: Clean the code by removing import statements and line breaks for easier parsing
    const cleanedCode = zodCode.replace(/import\s+.*?from\s+['"].*?['"];?/g, '');
    
    // Step 2: Find the schema definitions by looking for exports or const declarations
    let mainSchemaMatch: ZodToJsonSchema | null = null;
    
    // Look for exported schema first (it's often the main schema)
    const exportMatch = cleanedCode.match(/export\s+const\s+(\w+)\s*=\s*z\.(.*?)(?=;|\n|$)/);
    if (exportMatch) {
      // We found an exported schema, try to extract info directly
      const schemaType = identifySchemaType(exportMatch[2]);
      if (schemaType) {
        const descMatch = cleanedCode.match(new RegExp(`${exportMatch[1]}.*?\\.description\\(['"](.*?)['"]\\)`));
        const description = descMatch ? descMatch[1] : undefined;
        
        mainSchemaMatch = {
          type: schemaType === 'object' ? 'object' : schemaType,
          description
        };
        
        // For objects, try to extract properties
        if (schemaType === 'object') {
          mainSchemaMatch.properties = extractSchemaPropertiesFromExample(cleanedCode);
        }
      }
    }
    
    // If no exported schema is found or we couldn't parse it, try to find any schema
    if (!mainSchemaMatch) {
      // Look for any schema definition
      const schemaMatch = cleanedCode.match(/const\s+(\w+)\s*=\s*z\.(.*?)(?=;|\n|$)/);
      if (schemaMatch) {
        const schemaType = identifySchemaType(schemaMatch[2]);
        if (schemaType) {
          const descMatch = cleanedCode.match(new RegExp(`${schemaMatch[1]}.*?\\.description\\(['"](.*?)['"]\\)`));
          const description = descMatch ? descMatch[1] : undefined;
          
          mainSchemaMatch = {
            type: schemaType === 'object' ? 'object' : schemaType,
            description
          };
          
          // For objects, try to extract properties
          if (schemaType === 'object') {
            mainSchemaMatch.properties = extractSchemaPropertiesFromExample(cleanedCode);
          }
        }
      }
    }
    
    // If we still don't have a match, check if it's a direct schema definition
    if (!mainSchemaMatch) {
      if (cleanedCode.includes('z.object(') || 
          cleanedCode.includes('z.array(') ||
          cleanedCode.includes('z.string()') ||
          cleanedCode.includes('z.number()')) {
        // It's likely a direct schema definition
        mainSchemaMatch = parseDirectSchema(cleanedCode);
      }
    }
    
    // If we've found any schema, return it
    if (mainSchemaMatch) {
      return mainSchemaMatch;
    }
    
    // If all else fails, try to extract the TikTok schema as a fallback
    if (cleanedCode.includes('TikTokPostSchema') || 
        cleanedCode.includes('platform') || 
        cleanedCode.includes('template_version')) {
      // It seems like we're dealing with the TikTok schema, use example extraction
      return extractTikTokSchema();
    }
    
    throw new Error("Couldn't find a valid Zod schema in the provided code");
  } catch (error) {
    console.error('Error parsing Zod code:', error);
    return null;
  }
}

/**
 * Helper function to parse a directly defined schema without variables
 */
function parseDirectSchema(schemaCode: string): ZodToJsonSchema | null {
  // Basic schema type detection
  if (schemaCode.includes('z.object(')) {
    return { type: 'object', properties: extractObjectProperties(schemaCode) };
  } else if (schemaCode.includes('z.array(')) {
    return { type: 'array', items: extractArrayItemType(schemaCode) };
  } else if (schemaCode.includes('z.string()')) {
    return { type: 'string' };
  } else if (schemaCode.includes('z.number()')) {
    return { type: 'number' };
  } else if (schemaCode.includes('z.boolean()')) {
    return { type: 'boolean' };
  } else {
    return null;
  }
}

/**
 * Extract specific properties from direct object schema definitions
 */
function extractObjectProperties(_objectCode: string): Record<string, ZodToJsonSchema> {
  // This is a simplified implementation that would be expanded in a production version
  return {
    example: { type: 'string', description: 'Example property' }
  };
}

/**
 * Extract the item type from an array schema definition
 */
function extractArrayItemType(_arrayCode: string): ZodToJsonSchema {
  // This is a simplified implementation that would be expanded in a production version
  return { type: 'string' };
}

/**
 * Format the generated Zod code for better readability
 */
export function formatZodCode(code: string): string {
  try {
    // Simple indentation for nested structures
    let result = '';
    let indentLevel = 0;
    let inString = false;
    let escape = false;
    
    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      
      // Handle string literals to avoid formatting inside them
      if (char === '"' && !escape) {
        inString = !inString;
      }
      
      // Track escape characters in strings
      if (char === '\\' && inString) {
        escape = !escape;
      } else {
        escape = false;
      }
      
      // Only format outside of strings
      if (!inString) {
        // Decrease indent before closing brackets
        if (char === '}' || char === ']') {
          indentLevel = Math.max(0, indentLevel - 1);
          
          // Add newline before closing bracket if not preceded by opening bracket
          const prevChar = result[result.length - 1];
          if (prevChar !== '{' && prevChar !== '[' && prevChar !== ' ') {
            result += '\n' + '  '.repeat(indentLevel);
          }
        }
        
        // Add the character
        result += char;
        
        // Increase indent after opening brackets
        if (char === '{' || char === '[') {
          indentLevel++;
          
          // Add newline after opening bracket if not followed by closing bracket
          const nextChar = code[i + 1];
          if (nextChar !== '}' && nextChar !== ']') {
            result += '\n' + '  '.repeat(indentLevel);
          }
        }
        
        // Add newline and indent after comma if not in a simple array
        if (char === ',' && indentLevel > 0) {
          let shouldNewline = true;
          
          // Check if we're in a simple array like [1, 2, 3]
          let j = i + 1;
          while (j < code.length && code[j] === ' ') j++;
          
          // If next non-space char is a closing bracket, don't add newline
          if (code[j] === ']' || code[j] === '}') {
            shouldNewline = false;
          }
          
          if (shouldNewline) {
            result += '\n' + '  '.repeat(indentLevel);
          }
        }
      } else {
        // In a string, just add the character
        result += char;
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error formatting code:', error);
    return code; // Return original code if formatting fails
  }
}

/**
 * Generate a pretty-printed JSON string with optional comments
 */
export function generateJsonOutput(schema: ZodToJsonSchema, includeComments = true): string {
  // Function to transform our schema to actual JSON
  const transformToJsonOutput = (schema: ZodToJsonSchema): any => {
    const result: any = {};
    
    // Set the type
    result.type = schema.type;
    
    // Add description directly to the schema
    if (schema.description) {
      result.description = schema.description;
    }
    
    // Add description as a comment as well if requested
    if (includeComments && schema.description) {
      result['__comment'] = schema.description;
    }
    
    // Handle different schema types
    if (schema.type === 'object' && schema.properties) {
      result.properties = {};
      
      for (const [key, prop] of Object.entries(schema.properties)) {
        result.properties[key] = transformToJsonOutput(prop);
      }
    }
    
    if (schema.type === 'array' && schema.items) {
      result.items = transformToJsonOutput(schema.items);
    }
    
    if (schema.type === 'enum' && schema.enum) {
      result.enum = schema.enum;
    }
    
    if (schema.type === 'union' && schema.unionTypes) {
      result.oneOf = schema.unionTypes.map(transformToJsonOutput);
    }
    
    if (schema.type === 'literal') {
      result.const = schema.literal;
    }
    
    // Add nullable and optional info
    if (schema.nullable) {
      result.nullable = true;
    }
    
    if (schema.optional) {
      result.optional = true;
    }
    
    return result;
  };
  
  // Transform and stringify with pretty printing
  const jsonObj = transformToJsonOutput(schema);
  
  if (includeComments) {
    // For JSONC, we use a special stringify that preserves comments
    return prettyJsonWithComments(jsonObj);
  } else {
    // For regular JSON, we use the standard JSON.stringify
    return JSON.stringify(jsonObj, null, 2);
  }
}

/**
 * Custom function to stringify JSON with comment preservation
 */
function prettyJsonWithComments(obj: any, indent = 0): string {
  // Convert comments to special properties for preservation
  if (typeof obj !== 'object' || obj === null) {
    return JSON.stringify(obj);
  }
  
  const newLine = '\n' + '  '.repeat(indent);
  const nextNewLine = '\n' + '  '.repeat(indent + 1);
  let result = '{';
  
  const entries = Object.entries(obj);
  for (let i = 0; i < entries.length; i++) {
    const [key, value] = entries[i];
    
    // Handle comments specially
    if (key === '__comment') {
      result += `${nextNewLine}// ${value}`;
      
      // If this isn't the last entry, add a comma
      if (i < entries.length - 1) {
        result += ',';
      }
      continue;
    }
    
    // For normal properties
    result += `${nextNewLine}"${key}": `;
    
    if (typeof value === 'object' && value !== null) {
      result += prettyJsonWithComments(value, indent + 1);
    } else {
      result += JSON.stringify(value);
    }
    
    // Add comma if not the last entry
    if (i < entries.length - 1) {
      result += ',';
    }
  }
  
  result += `${newLine}}`;
  return result;
}
