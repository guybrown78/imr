import mysql from 'mysql2/promise';
import { config } from './config.js';

let pool;

export function db() {
  pool ??= mysql.createPool({ ...config.db, connectionLimit: 3, charset: 'utf8mb4', dateStrings: true });
  return pool;
}
