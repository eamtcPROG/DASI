import { config } from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { hash, genSalt } from 'bcrypt';
import { User } from '../models/user.model';

const envPath = path.join(
  process.cwd(),
  'env',
  `.env.${process.env.NODE_ENV ?? 'development'}`,
);
config({ path: envPath });

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT
    ? parseInt(process.env.DATABASE_PORT, 10)
    : 5432,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [User],
});

const seedUsers = [
  {
    email: 'admin@example.com',
    password: 'password123',
    firstName: 'Admin',
    lastName: 'User',
  },
  {
    email: 'dev@example.com',
    password: 'password123',
    firstName: 'Dev',
    lastName: 'User',
  },
];

async function run(): Promise<void> {
  await dataSource.initialize();
  const userRepository = dataSource.getRepository(User);

  for (const plain of seedUsers) {
    const existing = await userRepository.findOne({ where: { email: plain.email } });
    if (existing) {
      console.log(`User ${plain.email} already exists, skipping.`);
      continue;
    }
    const hashedPassword = await hash(plain.password, await genSalt());
    await userRepository.save({
      email: plain.email,
      password: hashedPassword,
      firstName: plain.firstName,
      lastName: plain.lastName,
    });
    console.log(`Created user ${plain.email}.`);
  }

  await dataSource.destroy();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
