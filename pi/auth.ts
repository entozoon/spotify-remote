const fs = require("fs");
const EventEmitter = require("events");
const authTokenFilename = "./spotify-auth-token.saved.json";

export default class extends EventEmitter {
  authTokenSave = authToken => {
    fs.writeFileSync(
      authTokenFilename,
      JSON.stringify({
        authToken,
        date: Date.now()
      })
    );
  };

  authTokenRefresh = () => {};
}
