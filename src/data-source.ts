// src/data-source.ts
import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ['dist/**/*.entity.js'], // Important: point to compiled JS files
  migrations: ['dist/migrations/*.js'], // Important: point to compiled JS files
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;