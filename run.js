const puppeteer = require('puppeteer');
const config = require('./config.json');
const db = require('./database/database');
const twitter = require('./src/twitter');

let followCount = 0;
let unfollowCount = 0;

const throttle = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

(async () => {
  const browser = await puppeteer.launch({ headless: config.headless });
  const page = await browser.newPage();
  await page.goto('https://twitter.com/login');
  await twitter.login(page, config.account.email, config.account.password);
  await throttle(5000);

  const usersToUnfollow = await db.users.getUsersToUnfollow();
  for (let i = 0; i < usersToUnfollow.length; i++) {
    if (i > config.max.unfollow) break;
    const user = usersToUnfollow[i];
    await twitter.unfollowUser(page, user.name);
    unfollowCount++;
  }

  for (let i = 0; i < config.userBases.length; i++) {
    const username = config.userBases[i];
    const link = `https://twitter.com/${username}/followers`;

    // open new page without starting new session with page.goto
    await page.evaluate((link) => { window.location.href = link; }, link);
    await throttle(5000);

    // check which users match our criteria and return array of names
    const potentialFollows = await twitter.getPotentialFollows(page, config.searchCriteria);
    // filter users we already followed earlier or unfollowed already
    const usersToFollow = await db.users.getUsersToFollow(potentialFollows);
    // update session statistics
    followCount += usersToFollow.length;
    // click follow buttons for filtered users and throttle inbetween
    await twitter.followUsers(page, usersToFollow);
    if (followCount > config.max.follow) break;
  }

  console.log(`Followed ${followCount} users.`);
  console.log(`Unfollowed ${unfollowCount} users.`);
  
  await page.close();
  await browser.close();
  process.exit();
})();
