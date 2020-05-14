const sqlite3 = require('sqlite3').verbose();
const dbPath = './twitter.sqlite';
const db = new sqlite3.Database(dbPath);
const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: dbPath
  },
  useNullAsDefault: true
});

(async () => {
  const hasTable = await knex.schema.hasTable('users');

  if (!hasTable) {
    await knex.schema.createTable('users', function (table) {
      table.increments();
      table.string('name');
      table.boolean('unfollowed');
      table.datetime('created');
    });
  }

  db.close();
  process.exit();
})();