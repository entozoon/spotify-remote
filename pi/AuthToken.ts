const fs = require("fs");
const EventEmitter = require("events");
const authTokenFilename = "./spotify-auth-token.saved.json";

export default class extends EventEmitter {
  save = code => {
    const token = {
      code,
      date: Date.now()
    };
    fs.writeFileSync(authTokenFilename, JSON.stringify(token));
    this.token = token;
  };
  refresh = () => {
    console.log("Refreshing token");
    console.log(
      "!! TO DO !! Probably have some kind of Spotify class function to help us out"
    );
    // ....
    this.save("refreshed" + Math.random());
  };
  get code() {
    // If booting on a cold day, try and dig one from the saved file, never know.. it might work
    if (!this.token) {
      this.token = JSON.parse(fs.readFileSync(authTokenFilename, "utf8"));
    }
    return this.token.code;
  }
}
