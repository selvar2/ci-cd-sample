/**
 * Main Agent Application
 */

import { agentRuntime } from './runtime';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  try {
    await agentRuntime.initialize();

    console.log('\n📚 Available Skills:');
    const skills = agentRuntime.listSkills();
    skills.forEach(skill => {
      console.log(`  - ${skill.name} (v${skill.version}): ${skill.description}`);
    });

    console.log('\n🧮 Calculator Skill Example:');
    const calcResult = await agentRuntime.executeSkill('calculator', {
      operation: 'multiply',
      operand1: 12,
      operand2: 5
    });
    console.log('Result:', calcResult);

    console.log('\n🌤️  Weather Skill Example:');
    try {
      const weatherResult = await agentRuntime.executeSkill('weather', {
        city: 'San Francisco',
        units: 'metric',
        includeDetails: true
      });
      console.log('Result:', weatherResult);
    } catch (error) {
      console.log('(Weather API requires configuration, skipping)');
    }

    await agentRuntime.saveRegistry();

  } catch (error) {
    console.error('Application error:', error);
    process.exit(1);
  }
}

main();
