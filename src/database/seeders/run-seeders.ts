import { DataSource } from 'typeorm';
import { typeOrmConfig } from '../../config/typeorm.config';
import { seedUsers } from './users.seeder';

export async function runSeeders() {
  const dataSource = new DataSource(typeOrmConfig);

  try {
    await dataSource.initialize();
    console.log('🔗 Conectado a la base de datos');

    console.log('\n🌱 Ejecutando seeders...\n');

    // Ejecutar seeder de usuarios
    await seedUsers(dataSource);

    console.log('\n✨ Seeders completados!');
  } catch (error) {
    console.error('❌ Error ejecutando seeders:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

// Solo ejecutar si se llama directamente desde CLI
if (require.main === module) {
  runSeeders();
}