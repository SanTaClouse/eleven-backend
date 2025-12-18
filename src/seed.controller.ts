import { Controller, Post } from '@nestjs/common';
import { runSeeders } from './database/seeders/run-seeders';

@Controller('seed')
export class SeedController {
  @Post()
  async runSeed() {
    try {
      await runSeeders();
      return {
        success: true,
        message: 'Seeders ejecutados correctamente'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error ejecutando seeders',
        error: error.message
      };
    }
  }
}