import Server from "./Server";
import Spotify from "./Spotify";

const spotifyCredentials = {
  clientId: "3f8c992f08c04ffd975d95665dad1318",
  clientSecret: "4d623279971343478816fa9c245a740c"
};
const spotify = new Spotify({ spotifyCredentials });
const server = new Server({ spotifyCredentials, spotify });

// Pass user input from web server to the authToken instance
server.on("authToken", code => {
  console.log("Initial auth token received!", code);
  spotify.saveTokens({ code });
  // We've got a brand spanking new token, so let spotify instance know
  spotify.authorise();
});
// Also try on init, with whatever's saved
spotify.letsTryOurTokens();

// Needs to refresh token, say every half hour
// let authRefreshInterval = setInterval(authToken.refresh, 1800000);
// let authRefreshInterval = setInterval(authToken.refresh, 30000);
// ********** disabling for now

const updateCurrentSongOrWhatever = async () => {
  // console.log(authToken.code);
  const currentSong = await spotify.getCurrentSong();
  console.log("Current song:", currentSong);
};
setInterval(updateCurrentSongOrWhatever, 5000);
