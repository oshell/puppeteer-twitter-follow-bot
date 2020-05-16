const db = require('../database/database');

const throttle = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const twitter = {
  login: async function (page, email, password) {
    await page.evaluate(() => {
      window.throttle = (ms) => {
        return new Promise((resolve) => {
          setTimeout(resolve, ms);
        });
      };
    });
  
    const focused = await page.evaluate(async () => {
      const nodes = document.querySelectorAll('form input');
      const emailField = nodes[5];
      if (!emailField) return false;

      emailField.focus();
      await throttle(2000);
      return true;
    });

    if (!focused) return false;
  
    await page.keyboard.type(email);
  
    await page.evaluate(async () => {
      const nodes = document.querySelectorAll('form input');
      const passwordField = nodes[6];
      passwordField.focus();
      await throttle(2000);
    });
  
    await page.keyboard.type(password);
  
    await page.evaluate(async () => {
      const button = document.querySelector('form div[role="button"]');
      button.click();
    });

    return true;
  },
  getPotentialFollows: async function(page, searchValues) {
    return await page.evaluate(async (searchValues) => {
      const throttle = () => {
        return new Promise((resolve) => {
          setTimeout(resolve, 1000 + Math.floor(Math.random() * 5000));
        });
      };

      await throttle();
      scrollTo({ top: 1000 });
      await throttle();
      scrollTo({ top: 2000 });
      await throttle();
      scrollTo({ top: 3000 });

      const userDivs = document.querySelectorAll('[aria-label="Timeline: Followers"] > div > div');
      const users = [];
      
      for (let j = 0; j < userDivs.length; j++) {
        const div = userDivs[j];
        if (div === null) continue;

        const desc = div.innerText;
        const regexResult = new RegExp(/(^|[^@\w])@(\w{1,15})\b/).exec(desc);
        if (regexResult === null) continue;

        const twitterUser = regexResult[0].trim().replace('@', '');
        const match = new RegExp(searchValues.join('|'), 'i').test(desc);
        const button = div.querySelector('div[role] div[role]');
        if (button === null) continue;
        const action = button.innerText;

        if (action === 'Follow' && match) {
          users.push(twitterUser);
        }
      }

      return users;
    }, searchValues);
  },
  followUsers: async function(page, usersToFollow) {
    for (let i = 0; i < usersToFollow.length; i++) {
      const username = usersToFollow[i];
      await db.users.insert(username);
    }

    return await page.evaluate(async (usersToFollow) => {
      const throttle = () => {
        return new Promise((resolve) => {
          setTimeout(resolve, 1000 + Math.floor(Math.random() * 5000));
        });
      };

      const userDivs = document.querySelectorAll('[aria-label="Timeline: Followers"] > div > div');
      for (let j = 0; j < userDivs.length; j++) {
        const div = userDivs[j];
        if (div === null) continue;

        const desc = div.innerText;
        const regexResult = new RegExp(/(^|[^@\w])@(\w{1,15})\b/).exec(desc);
        if (regexResult === null) continue;

        const twitterUser = regexResult[0].trim().replace('@', '');
        const match = usersToFollow.includes(twitterUser);
        const button = div.querySelector('div[role] div[role]');
        if (button === null) continue;
        const action = button.innerText;

        if (action === 'Follow' && match) {
          button.click();
          await throttle();
        }
      }
    }, usersToFollow);
  },
  unfollowUser: async function(page, username) {
    const link = `https://twitter.com/${username}`;
    await page.evaluate((link) => { window.location.href = link; }, link);
    await throttle(4000);
    const success = await page.evaluate(() => {
      const unfollowButton = document.querySelector('div[role="button"][data-testid*="follow"]');
      if (!unfollowButton) return;
      const action = unfollowButton.innerText;
      if (unfollowButton && action === 'Following') {
        unfollowButton.click();
        return true;
      } else {
        return false;
      }
    });

    if (success) {
      await throttle(1000);
      await page.evaluate(() => {
        const confirmButton = document.querySelector('div[role="button"][data-testid*="confirmationSheetConfirm"]');
        if (!confirmButton) return;
        if (confirmButton) confirmButton.click();
      });
      await throttle(2000);
      console.log(`Unfollowed @${username}`);
    } else {
      console.log(`Unable to unfollow @${username}. (already unfollowed)`);
    }

    await db.users.unfollow(username);

    return success;
  }
}

module.exports = twitter;