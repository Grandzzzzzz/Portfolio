import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const siteContent = sqliteTable('site_content', {
 id: integer('id').primaryKey(),
 content: text('content').notNull(),
 version: integer('version').notNull(),
 updatedAt: text('updated_at').notNull(),
});
