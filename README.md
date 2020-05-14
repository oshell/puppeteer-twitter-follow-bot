# puppeteer-twitter-follow-bot

Puppeteer twitter follow bot, which works without twitter api key.

This bot will simply go through a pre-defined array of users (`config.userBases`) and follow their latest followers, if their profile contains anything from `config.searchCriteria`. 

Each followed user is saved in a local sqlite3 database so we can unfollow them, once a certain threshold (`unfollowThreshold`) has passed. The database is also used, so we do not follow users, which we previously unfollowed.

## Setup
```
git clone https://github.com/oshell/puppeteer-twitter-follow-bot.git
cd puppeteer-twitter-follow-bot
npm i
node database/init
cp ./config.sample.json ./config.json
```

### config.json

- `account`:object (your twitter credentials)
	- `email`:string 
	- `password`:string
- `headless`: boolean (run browser in headless mode)
- `max`:object (maximum counts for follows/unfollows per run)
	- `follow`:integer 
	- `unfollow`:integer
- `unfollowThreshold`:integer (number of hours to wait before unfollow)
- `userBases`:array[string] (array of usernames to follow their followers)
- `searchCriteria`:array[string] (array of words to check against profile/bio)

Array in `searchCriteria` will be used on user profiles to determine if it should be followed: `RegExp(searchCriteria.join('|'), 'i')`.

## Usage
### Run
```
node run
```
### Stats
```
node stats
```
