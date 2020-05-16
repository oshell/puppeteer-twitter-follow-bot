const db = require('./database/database');

(async () => {
  const count = await db.users.count();
  const countUnfollowed = await db.users.countUnfollowed();

  console.log(`Users followed: ${count}`);
  console.log(`Users unfollowed: ${countUnfollowed}`);
  
  process.exit();
})();