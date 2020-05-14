const sqlite3 = require('sqlite3').verbose();
const dbPath = './twitter.sqlite';
const config = require('../config.json');
const db = new sqlite3.Database(dbPath);
const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: dbPath,
  },
  useNullAsDefault: true,
});

const dateThreshold = new Date();
dateThreshold.setHours(new Date().getHours() - config.unfollowThreshold);
const formattedDate = dateThreshold.toISOString().replace('T', ' ');

const database = {
  instance: knex,
  users: {
    insert: async (name) => {
      await knex('users').insert({
        name,
        unfollowed: false,
        created: knex.fn.now(),
      });
  
      return true;
    },
    getLatest: async () => {
      const users = await knex('users').limit(100).orderBy('created', 'desc');
      return users;
    },
    exists: async (name) => {
      const users = await knex('users').where({ name });
      return users.length;
    },
    unfollow: async (name) => {
      await knex('users').update({ unfollowed: true }).where({ name });
  
      return true;
    },
    getUsersToUnfollow: async () => {
      const users = await knex('users')
        .where('created', '<', formattedDate)
        .andWhere({ unfollowed: false })
        .orderBy('created', 'asc');
      return users;
    },
    getUsersToFollow: async (usernames) => {
      const usersToFollow = [];

      for (let u = 0; u < usernames.length; u++) {
        const name = usernames[u];
        const exists = await database.users.exists(name);
        if (!exists) {
          await database.users.insert(name);
          usersToFollow.push(name);
          console.log(`Follow @${name}`);
        }
      } 

      return usersToFollow;
    },
    count: async (name) => {
      const result = await knex('users').count('id as count');
      return result[0].count;
    },
    countUnfollowed: async (name) => {
      const result = await knex('users').count('id as count').where('unfollowed', true);
      return result[0].count;
    }
  }
};

module.exports = database;
