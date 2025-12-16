import { DataSource } from 'typeorm';
import { typeOrmConfig } from '../config/typeorm.config';

async function resetDatabase() {
  // Create a config without synchronize to avoid conflicts
  const resetConfig = {
    ...typeOrmConfig,
    synchronize: false,
  };

  const dataSource = new DataSource(resetConfig);

  try {
    await dataSource.initialize();
    console.log('🔗 Conectado a la base de datos');

    // Drop the database completely
    await dataSource.dropDatabase();
    console.log('🗑️  Base de datos eliminada');

    // Manually synchronize the schema
    await dataSource.synchronize();
    console.log('✅ Esquema recreado');

    console.log('\n✨ Base de datos reseteada correctamente!');
    console.log('👉 Ahora ejecuta: npm run seed\n');
  } catch (error) {
    console.error('❌ Error reseteando la base de datos:', error);
  } finally {
    await dataSource.destroy();
  }
}

resetDatabase();