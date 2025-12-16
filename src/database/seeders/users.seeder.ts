import { DataSource } from 'typeorm';
import { hash } from 'bcrypt';
import { User, UserRole } from '../../entities/user.entity';

export async function seedUsers(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);

  // Verificar si ya existen usuarios
  const existingUsers = await userRepository.count();
  if (existingUsers > 0) {
    console.log('⏭️  Usuarios ya existen, saltando seeder...');
    return;
  }

  const users = [
    {
      email: 'martin@eleven.com',
      password: await hash('AdminPass123!', 10),
      name: 'Martin Gola',
      role: UserRole.ADMIN,
      isActive: true,
    },
    {
      email: 'socio2@eleven.com',
      password: await hash('AdminPass123!', 10),
      name: 'Socio 2',
      role: UserRole.ADMIN,
      isActive: true,
    },
    {
      email: 'soporte@eleven.com',
      password: await hash('SupportSecure123!', 10),
      name: 'Soporte Técnico ELEVEN',
      role: UserRole.SUPPORT,
      isActive: true, 
    },
  ];

  await userRepository.save(users);
  console.log('✅ 3 usuarios creados:');
  console.log('   📧 martin@eleven.com (ADMIN) - Password: AdminPass123!');
  console.log('   📧 socio2@eleven.com (ADMIN) - Password: AdminPass123!');
  console.log('   📧 soporte@eleven.com (SUPPORT) - Password: SupportSecure123!');
}