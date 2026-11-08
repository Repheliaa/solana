import pool from './config/db';

async function updateCategory() {
  try {
    await pool.query("UPDATE categories SET name = 'Lepkom', slug = 'lepkom' WHERE slug = 'mengajar' OR name = 'Mengajar'");
    await pool.query("ALTER TABLE events MODIFY COLUMN event_type ENUM('kuliah', 'lepkom', 'mengajar', 'personal', 'belajar', 'custom') DEFAULT 'personal'");
    await pool.query("UPDATE events SET event_type = 'lepkom' WHERE event_type = 'mengajar'");
    console.log('✅ Successfully updated category and event_type to Lepkom');
    process.exit(0);
  } catch (error) {
    console.error('Error updating category:', error);
    process.exit(1);
  }
}

updateCategory();
