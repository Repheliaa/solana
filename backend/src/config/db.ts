import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'solana_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
});

export const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

export const initDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL database:', process.env.DB_NAME || 'solana_db');

    // 1. Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        avatar VARCHAR(255) DEFAULT NULL,
        points INT DEFAULT 0,
        streak INT DEFAULT 0,
        focus_time_total INT DEFAULT 0,
        default_timer INT DEFAULT 25,
        theme_preference VARCHAR(50) DEFAULT 'warm',
        notification_preference TINYINT(1) DEFAULT 1,
        last_active_date DATE DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Categories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        name VARCHAR(50) NOT NULL,
        slug VARCHAR(50) NOT NULL,
        color VARCHAR(20) NOT NULL,
        icon VARCHAR(50) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Classes table (mata kuliah / kelas)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        category_id INT DEFAULT NULL,
        name VARCHAR(150) NOT NULL,
        code VARCHAR(50) DEFAULT NULL,
        schedule VARCHAR(150) DEFAULT NULL,
        room VARCHAR(100) DEFAULT NULL,
        color VARCHAR(20) DEFAULT '#C66F80',
        day_of_week INT DEFAULT NULL,
        start_time VARCHAR(10) DEFAULT NULL,
        end_time VARCHAR(10) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure columns exist if table was already created
    await connection.query("ALTER TABLE classes MODIFY category_id INT DEFAULT NULL");
    const [cols]: any = await connection.query("SHOW COLUMNS FROM classes LIKE 'day_of_week'");
    if (cols.length === 0) {
      await connection.query("ALTER TABLE classes ADD COLUMN day_of_week INT DEFAULT NULL");
      await connection.query("ALTER TABLE classes ADD COLUMN start_time VARCHAR(10) DEFAULT NULL");
      await connection.query("ALTER TABLE classes ADD COLUMN end_time VARCHAR(10) DEFAULT NULL");
    }

    // 4. Tasks table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        class_id INT DEFAULT NULL,
        category_id INT DEFAULT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT DEFAULT NULL,
        priority ENUM('Low', 'Medium', 'High', 'Urgent') DEFAULT 'Medium',
        status ENUM('To Do', 'In Progress', 'Done') DEFAULT 'To Do',
        deadline DATETIME NOT NULL,
        estimated_minutes INT DEFAULT 30,
        completed_at DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Events table (kalender & jadwal kegiatan)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        class_id INT DEFAULT NULL,
        category_id INT DEFAULT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT DEFAULT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        event_type ENUM('kuliah', 'lepkom', 'mengajar', 'personal', 'belajar', 'custom') DEFAULT 'personal',
        color VARCHAR(20) DEFAULT '#C66F80',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 6. Focus sessions table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS focus_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        task_id INT DEFAULT NULL,
        duration_minutes INT NOT NULL,
        points_earned INT DEFAULT 0,
        notes TEXT DEFAULT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed default categories if none
    const [catRows]: any = await connection.query('SELECT id FROM categories LIMIT 1');
    if (catRows.length === 0) {
      await connection.query(`
        INSERT INTO categories (name, slug, color, icon) VALUES 
        ('Lecture', 'kuliah', '#C66F80', 'GraduationCap'),
        ('Lab', 'lepkom', '#4A6644', 'BookOpen'),
        ('Personal', 'personal', '#F4C7D0', 'User')
      `);
      console.log('Seeded default categories: Lecture, Lab, Personal');
    }

    connection.release();
    console.log('✨ Solana database verified & ready');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
};

export default pool;
