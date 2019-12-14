import Server from "./Server";
import Spotify from "./Spotify";

const spotifyCredentials = {
  clientId: "3f8c992f08c04ffd975d95665dad1318",
  clientSecret: "4d623279971343478816fa9c245a740c"
};
const spotify = new Spotify({ spotifyCredentials });

// Boot server regardless. Might want to override the saved tokens
const server = new Server({ spotifyCredentials, spotify });

// Web server user input received
server.on("authToken", async code => {
  // Brand spanking new token, pass it over to spotify instance
  spotify.saveTokens({ code });
  await spotify
    .authorise()
    .catch(e => {
      // If submitting an old authToken url somehow
      console.error("LCD: Authorise failure");
      console.error("Error::authorise", e);
    })
    .then(() => {
      setTimeout(() => {
        spotify
          .currentPlaybackState()
          .then(state => {
            lcdDisplaySongState(state);
          })
          .catch(e => {
            console.error("Error::currentPlaybackState", e);
          });
      }, 2000);
    });
});

// Dry run
(async () => {
  await spotify.setTokensOnApiNonsense();
  await spotify
    .currentPlaybackState()
    .catch(e => {
      console.error("Error::dry run", e);
    })
    .then(state => {
      lcdDisplaySongState(state);
    })
    .catch(e => {
      console.log(
        "No joy with saved tokens. Creating a web server for user input"
      );
      server.on("init", ({ url, urlNgrok }) => {
        console.log(
          `LCD: Go to ${url}
      or ${urlNgrok.replace("https://", "")}
(Perhaps use port 80 on pi? ngrok still might be better. No same-wifi sitch)`
        );
      });
    });
})();

const lcdDisplaySongState = state => {
  console.log("LCD:", state);
};

// Needs to refresh token, they last an hour but, yeah turning on and off..
let authRefreshInterval = setInterval(spotify.refreshTokens, 600000);

// const updateCurrentSongOrWhatever = async () => {
//   // console.log(authToken.code);
//   const currentSong = await spotify.getCurrentSong();
//   console.log("Current song:", currentSong);
// };
// setInterval(updateCurrentSongOrWhatever, 30000);
