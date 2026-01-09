# Agent Skills System

## Quick Start

```bash
# Build the TypeScript
npm run build

# Run the demo
npm run demo

# Watch for changes
npm run dev
```

## Project Structure

```
agents/
├── index.ts                 # Main application entry point
├── runtime.ts               # Agent runtime (skill loader/executor)
├── skills.md                # Skills documentation
├── skills/                  # Skills directory
│   ├── calculator-skill.ts  # Calculator skill (add, subtract, multiply, divide)
│   ├── weather-skill.ts     # Weather skill (temperature, caching)
│   └── registry.json        # Skills registry (auto-generated)
├── config/                  # Configuration directory
├── examples/                # Example files
└── README.md                # This file
```

## Available Skills

### 1. Calculator Skill
Performs basic arithmetic operations:
- add, subtract, multiply, divide
- Input validation and error handling
- Example: `{ operation: 'multiply', operand1: 12, operand2: 5 }`

### 2. Weather Skill
Retrieves weather information with caching:
- Supports metric and imperial units
- Automatic 1-hour cache with cleanup
- Example: `{ city: 'San Francisco', units: 'metric', includeDetails: true }`

## Adding New Skills

1. Create skill file in `agents/skills/skill-name.ts`
2. Implement `static metadata` with skill definition
3. Implement `async execute(input: any): Promise<any>`
4. Register in `agents/runtime.ts`

## Documentation

See `agents/skills.md` for complete skill documentation, schemas, and best practices.
