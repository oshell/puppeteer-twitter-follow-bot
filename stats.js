const db = require('./database/database');

(async () => {
  const count = await db.users.count();
  const countUnfollowed = await db.users.countUnfollowed();
  const usersToUnfollow = await db.users.getUsersToUnfollow();

  console.log(`Users followed: ${count}`);
  console.log(`Users unfollowed: ${countUnfollowed}`);
  console.log(`Users to unfollow: ${count - countUnfollowed}`);
  console.log(`Users to unfollow in next run: ${usersToUnfollow.length}`);
  
  process.exit();
})();