# Anilist Notification Reporter
This project is for self use only, not made to be profited by any means.  
It wasn't made by Anilist, it's an unofficial release.

This is a mini web server that will let you get a full report of your notifications.  
The report includes:
- A list of users and how many likes they gave you.
- Activity's comment sections / Forum thread's comment section that has a reply/mention for you.
- List of users that started following you.
- Any media updates to the site (adding/removing/merging entry).

## Installation
This project was written in Node.js and was tested on v14.18.1 .  
To install it on linux machine run the following:
```
sudo apt install nodejs
```
To install the required dependencies, `cd` into the project folder and run:
```
npm install
```
## How to use the server
To start the server, `cd` to the project folder and run:
```
npm run main
```
Once it says that the server started listening,  
go to your browser into the following website:
```
http://localhost:3000/
```
(The port above is subject to change, it should be the same port as the one found in the `.env` file)   
To stop the server, simply press `Ctrl` + `C` in your terminal.  
Note: the server will shutdown afte single use of the report button.

In this website, you will have a single link, click to run the script.  
Until the next page loads, the server will load all your notifications into his report,
once the page loads it will print a JSON report of your notifications.

### Soft-block
There are an option to soft block users from being added into the "likes" list.
Note: they will still appear in the other lists! (like following, messages, replays, etc. Only on "likes your activity" they won't appear).  

To do so, in the `resources/input` folder add a file `softBlock.json` with array of strings of the usernames to be softblocked.  
For example:
```json
[
  "Name1",
  "Name2"
]
```

## Further places to expand the project
- Currently, it only works with a single user, it can be easily implemented to support more.  
In the meantime deleting all the files inside the `resources/output` and `resources/input/softBlock.json` will let you run it like a new user.
- Might be a problem if `resources/output` folder doesn't exist, need to add a check for that.
files will allow it to work with a new user.
-  The HTML side of the server is bear bones, can be made much more pretty and to support editing
the result report in it (and saving locally).
- Port `3000` is permanent currently, as it is also hard-coded on Anilist client side.
- ~~Can change this whole project from web server to a CLI script.~~ Can't be done since the user need to go to the external website (Anilist) and accept giving token to this app.  

# Credit
This project was written by [@github/NineLord](https://github.com/NineLord).