# Agent Skills Documentation

## Overview
This document describes all available agent skills, their capabilities, input/output schemas, and usage examples.

## File Purpose and Structure
The `skills.md` file serves as:
- **Central documentation** for all registered agent skills
- **API reference** for skill inputs and outputs
- **Usage guide** with examples for developers
- **Version history** and changelog

## Agent Runtime Parser

### How the Runtime Parses Skills
The `AgentRuntime` class uses the following process:
1. **Discovery** - Scan `agents/skills/` for skill files
2. **Loading** - Import and instantiate skill classes
3. **Validation** - Verify metadata and schemas
4. **Registration** - Store in skill registry
5. **Persistence** - Save to `registry.json`

## Skill Definitions

### 1. Calculator Skill
**Status:** Active | **Version:** 1.0.0

#### Purpose
Performs basic arithmetic operations (add, subtract, multiply, divide)

#### Input Schema
\`\`\`json
{
  "type": "object",
  "required": ["operation", "operand1", "operand2"],
  "properties": {
    "operation": {
      "type": "string",
      "enum": ["add", "subtract", "multiply", "divide"]
    },
    "operand1": { "type": "number" },
    "operand2": { "type": "number" }
  }
}
\`\`\`

#### Output Schema
\`\`\`json
{
  "result": 60,
  "operation": "12 multiply 5",
  "timestamp": "2026-01-09T11:45:05.000Z",
  "success": true
}
\`\`\`

#### Error Codes
- `INVALID_OPERATION` - Unknown operation type
- `DIVISION_BY_ZERO` - Attempted division by zero
- `INVALID_INPUT` - Input validation failed

#### Usage Example
\`\`\`javascript
const input = { operation: 'multiply', operand1: 12, operand2: 5 };
// Returns: { result: 60, operation: "12 multiply 5", success: true, ... }
\`\`\`

---

### 2. Weather Skill
**Status:** Active | **Version:** 1.0.0

#### Purpose
Retrieves current weather information for a specified city with optional caching

#### Input Schema
\`\`\`json
{
  "type": "object",
  "required": ["city"],
  "properties": {
    "city": { "type": "string", "description": "Target city name" },
    "units": {
      "type": "string",
      "enum": ["metric", "imperial"],
      "default": "metric"
    },
    "includeDetails": {
      "type": "boolean",
      "default": false,
      "description": "Include humidity and wind speed"
    }
  }
}
\`\`\`

#### Output Schema
\`\`\`json
{
  "city": "San Francisco",
  "temperature": 72,
  "condition": "clear",
  "units": "°F",
  "humidity": 65,
  "windSpeed": 12,
  "timestamp": "2026-01-09T11:45:05.000Z",
  "cached": false
}
\`\`\`

#### Features
- **Caching:** 1 hour cache duration with automatic cleanup
- **Timeout:** 5 second API timeout
- **Fallback:** Default values if API unavailable

#### Error Codes
- `API_ERROR` - External API request failed
- `TIMEOUT` - Request exceeded timeout threshold
- `INVALID_CITY` - City not found or invalid format

---

## Best Practices for Skill Definition

### 1. Naming Conventions
\`\`\`
✅ Valid:   calculator, weather, email-sender, data-parser
❌ Invalid: CalculatorSkill, Skill_Calculator, my skill
\`\`\`

### 2. Schema Validation
\`\`\`typescript
// ✅ Good: Explicit schema with validation
inputSchema: {
  type: 'object',
  required: ['city'],
  additionalProperties: false,
  properties: { ... }
}
\`\`\`

### 3. Error Handling
\`\`\`typescript
// ✅ Good: Specific error types with codes
throw {
  error: 'DIVISION_BY_ZERO',
  message: 'Cannot divide by zero',
  code: 400
};
\`\`\`

### 4. Documentation
\`\`\`typescript
/**
 * Clear JSDoc comments
 * @param input - Describe parameter
 * @returns Describe return value
 * @throws Describe possible errors
 */
async execute(input: any): Promise<any> { ... }
\`\`\`

### 5. Timeout Handling
Always set API timeouts:
\`\`\`typescript
axios.get(url, { timeout: 5000 });
\`\`\`

### 6. Input Validation
Validate before processing:
\`\`\`typescript
if (!this.validateInput(input)) {
  throw new Error('Invalid input');
}
\`\`\`

---

## Version Management

### Semantic Versioning (MAJOR.MINOR.PATCH)
- **MAJOR**: Breaking changes to skill API
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes and improvements

---

## Registry Structure (registry.json)

\`\`\`json
{
  "calculator": {
    "metadata": {
      "name": "calculator",
      "version": "1.0.0",
      "description": "Performs basic arithmetic operations"
    },
    "enabled": true
  },
  "weather": {
    "metadata": {
      "name": "weather",
      "version": "1.0.0",
      "description": "Retrieves current weather information"
    },
    "enabled": true
  }
}
\`\`\`

---

## Testing Skills

\`\`\`bash
# Compile TypeScript
npm run build

# Run unit tests (when added)
npm test

# Execute skill demo
npm run demo
\`\`\`

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Skill not found | Verify registration in runtime.ts |
| Input validation fails | Check schema against actual input |
| API timeout | Increase timeout, check network |
| Cache issues | Clear cache manually or restart |

---

**Last Updated:** 2026-01-09
**Maintainer:** Agent Development Team
