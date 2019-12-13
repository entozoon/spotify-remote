import Server from "./Server";
import AuthToken from "./AuthToken";

const server = new Server();
const authToken = new AuthToken();

// Pass user input from web server to the authToken instance
server.on("authToken", token => {
  console.log("Initial auth token received!", token);
  authToken.save(token);
  // We've got a brand spanking new token ...
  // But it might work already without needing initial input ..
});

// Needs to refresh token, say every half hour
// let authRefreshInterval = setInterval(authToken.refresh, 1800000);
let authRefreshInterval = setInterval(authToken.refresh, 30000);

setInterval(() => {
  // console.log(authToken.code);
  // Have some kind of spotify class on the go at this point
  console.log("Current song:");
}, 5000);
