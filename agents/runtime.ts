/**
 * Agent Runtime - Loads and executes skills
 */

import { CalculatorSkill } from './skills/calculator-skill';
import { WeatherSkill } from './skills/weather-skill';
import fs from 'fs';
import path from 'path';

interface SkillRegistry {
  [skillName: string]: {
    instance: any;
    metadata: any;
    enabled: boolean;
  };
}

class AgentRuntime {
  private skillRegistry: SkillRegistry = {};
  private registryFile = process.env.SKILL_REGISTRY_PATH || './agents/skills/registry.json';

  async initialize(): Promise<void> {
    console.log('🚀 Initializing Agent Runtime...');
    
    try {
      this.registerSkill(CalculatorSkill);
      this.registerSkill(WeatherSkill);
      await this.loadRegistry();
      console.log(`✅ Runtime initialized with ${Object.keys(this.skillRegistry).length} skills`);
    } catch (error) {
      console.error('Failed to initialize runtime:', error);
      throw error;
    }
  }

  private registerSkill(SkillClass: any): void {
    const metadata = SkillClass.metadata;
    const instance = new SkillClass();
    this.skillRegistry[metadata.name] = {
      instance,
      metadata,
      enabled: true
    };
    console.log(`📝 Registered skill: ${metadata.name} v${metadata.version}`);
  }

  async executeSkill(skillName: string, input: any): Promise<any> {
    const skillEntry = this.skillRegistry[skillName];
    if (!skillEntry) {
      throw new Error(`Skill not found: ${skillName}`);
    }
    if (!skillEntry.enabled) {
      throw new Error(`Skill is disabled: ${skillName}`);
    }
    console.log(`▶️  Executing skill: ${skillName}`);
    try {
      const result = await skillEntry.instance.execute(input);
      console.log(`✅ Skill execution completed: ${skillName}`);
      return result;
    } catch (error) {
      console.error(`❌ Skill execution failed: ${error}`);
      throw error;
    }
  }

  listSkills(): Array<{ name: string; version: string; description: string }> {
    return Object.values(this.skillRegistry).map(entry => ({
      name: entry.metadata.name,
      version: entry.metadata.version,
      description: entry.metadata.description
    }));
  }

  async saveRegistry(): Promise<void> {
    const registry: any = {};
    for (const [name, entry] of Object.entries(this.skillRegistry)) {
      registry[name] = {
        metadata: entry.metadata,
        enabled: entry.enabled
      };
    }
    try {
      fs.writeFileSync(this.registryFile, JSON.stringify(registry, null, 2));
      console.log('✅ Registry saved');
    } catch (error) {
      console.error('Failed to save registry:', error);
    }
  }

  private async loadRegistry(): Promise<void> {
    try {
      if (fs.existsSync(this.registryFile)) {
        const data = fs.readFileSync(this.registryFile, 'utf-8');
        const registry = JSON.parse(data);
        for (const [skillName, config] of Object.entries(registry)) {
          if (this.skillRegistry[skillName]) {
            this.skillRegistry[skillName].enabled = (config as any).enabled;
          }
        }
        console.log('✅ Registry loaded');
      }
    } catch (error) {
      console.warn('Could not load registry:', (error as any).message);
    }
  }
}

export const agentRuntime = new AgentRuntime();
export { AgentRuntime };
