/**
 * Calculator Skill - Basic arithmetic operations
 * Demonstrates: Input validation, error handling, output formatting
 */

interface CalculatorInput {
  operation: 'add' | 'subtract' | 'multiply' | 'divide';
  operand1: number;
  operand2: number;
}

interface CalculatorOutput {
  result: number;
  operation: string;
  timestamp: string;
  success: boolean;
}

class CalculatorSkill {
  static metadata = {
    name: 'calculator',
    version: '1.0.0',
    description: 'Performs basic arithmetic operations',
    author: 'Agent Team',
    capabilities: ['add', 'subtract', 'multiply', 'divide'],
    inputSchema: {
      type: 'object',
      required: ['operation', 'operand1', 'operand2'],
      properties: {
        operation: {
          type: 'string',
          enum: ['add', 'subtract', 'multiply', 'divide'],
          description: 'Arithmetic operation to perform'
        },
        operand1: {
          type: 'number',
          description: 'First number'
        },
        operand2: {
          type: 'number',
          description: 'Second number'
        }
      }
    }
  };

  async execute(input: CalculatorInput): Promise<CalculatorOutput> {
    try {
      if (!this.validateInput(input)) {
        throw new Error('Invalid input parameters');
      }

      let result: number;
      switch (input.operation) {
        case 'add':
          result = input.operand1 + input.operand2;
          break;
        case 'subtract':
          result = input.operand1 - input.operand2;
          break;
        case 'multiply':
          result = input.operand1 * input.operand2;
          break;
        case 'divide':
          if (input.operand2 === 0) {
            throw new Error('Division by zero');
          }
          result = input.operand1 / input.operand2;
          break;
        default:
          throw new Error(`Unknown operation: ${input.operation}`);
      }

      return {
        result: parseFloat(result.toFixed(2)),
        operation: `${input.operand1} ${input.operation} ${input.operand2}`,
        timestamp: new Date().toISOString(),
        success: true
      };
    } catch (error: any) {
      console.error(`Calculator skill error: ${error.message}`);
      throw {
        error: 'CALCULATION_FAILED',
        message: error.message,
        timestamp: new Date().toISOString(),
        success: false
      };
    }
  }

  private validateInput(input: any): boolean {
    return (
      input &&
      typeof input.operation === 'string' &&
      typeof input.operand1 === 'number' &&
      typeof input.operand2 === 'number' &&
      ['add', 'subtract', 'multiply', 'divide'].includes(input.operation)
    );
  }
}

export { CalculatorSkill, CalculatorInput, CalculatorOutput };
