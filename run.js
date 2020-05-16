const puppeteer = require('puppeteer');
const config = require('./config.json');
const db = require('./database/database');
const twitter = require('./src/twitter');
const fs = require('fs').promises;

let followCount = 0;
let unfollowCount = 0;

const throttle = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

(async () => {
  console.log('Launching Chrome.');
  const browser = await puppeteer.launch({ headless: config.headless });
  const page = await browser.newPage();

  try {
    const cookiesString = await fs.readFile('./cookies.json');
    const cookies = JSON.parse(cookiesString);
    console.log('Set cookies.');
    await page.setCookie(...cookies);
  } catch(e) {
    console.log('No cookies set yet.');
  }

  console.log('Open twitter.com');
  await page.goto('https://twitter.com/login');
  await throttle(3000);

  console.log('Initialize Login.');
  const success = await twitter.login(page, config.account.email, config.account.password);
  const logMsg = success ? 'Login successfull.' : 'Login Session restored from cookies.'

  console.log(logMsg);
  await throttle(5000);

  console.log('Update cookies.');
  const cookies = await page.cookies();
  await fs.writeFile('./cookies.json', JSON.stringify(cookies, null, 2));


  console.log('Start unfollowing users.');
  const usersToUnfollow = await db.users.getUsersToUnfollow();
  for (let i = 0; i < usersToUnfollow.length; i++) {
    if (i > config.max.unfollow) break;
    const user = usersToUnfollow[i];
    const success = await twitter.unfollowUser(page, user.name);
    if (success) unfollowCount++;
    if (i > 0 && i % 10 === 0) {
      console.log('30 seconds pause before resuming unfollow action.');
      await throttle(30000);
    }
  }

  // user bases from config are used as starting point
  // once we followed some users, we will start scanning their followers too
  const latestUsers = await db.users.getLatest();
  const followedUsernames = latestUsers.map(user => user.name);
  const usersBases = [...config.userBases, ...followedUsernames];

  console.log('Start following users.');
  for (let i = 0; i < usersBases.length; i++) {
    const username = usersBases[i];
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
  console.log(`Run finished. Shutting down.`);
  
  await page.close();
  await browser.close();
  process.exit();
})();
