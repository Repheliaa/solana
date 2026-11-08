"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("./config/db"));
async function updateCategory() {
    try {
        await db_1.default.query("UPDATE categories SET name = 'Lepkom', slug = 'lepkom' WHERE slug = 'mengajar' OR name = 'Mengajar'");
        await db_1.default.query("ALTER TABLE events MODIFY COLUMN event_type ENUM('kuliah', 'lepkom', 'mengajar', 'personal', 'belajar', 'custom') DEFAULT 'personal'");
        await db_1.default.query("UPDATE events SET event_type = 'lepkom' WHERE event_type = 'mengajar'");
        console.log('✅ Successfully updated category and event_type to Lepkom');
        process.exit(0);
    }
    catch (error) {
        console.error('Error updating category:', error);
        process.exit(1);
    }
}
updateCategory();
