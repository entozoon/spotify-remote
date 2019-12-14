//
// Noritake Itron GU140X32F-7000
//
import Server from "./Server";
import Spotify from "./Spotify";
import Vfd from "./Vfd";

const spotifyCredentials = {
  clientId: "3f8c992f08c04ffd975d95665dad1318",
  clientSecret: "4d623279971343478816fa9c245a740c"
};

const spotify = new Spotify({ spotifyCredentials });
// Boot server regardless. Might want to override the saved tokens
const server = new Server({ spotifyCredentials, spotify });
const vfd = new Vfd();

(async () => {
  await vfd.init().catch(e => {
    console.log("Error::VFD can't init -", e);
  });
  await vfd.resetVFD();
  await vfd.resetFont();
  await vfd.setBrightness(5);
  await vfd.drawLine();
  await vfd.echo("Bam!", 1);
})();

// Web server user input received
server.on("authToken", async code => {
  // Brand spanking new token, pass it over to spotify instance
  spotify.saveTokens({ code });
  await spotify
    .authorise()
    .catch(e => {
      // If submitting an old authToken url somehow
      console.error("VFD: Authorise failure");
      console.error("Error::authorise", e);
    })
    .then(() => {
      setTimeout(() => {
        spotify
          .currentPlaybackState()
          .then(state => {
            vfdDisplaySongState(state);
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
      vfdDisplaySongState(state);
    })
    .catch(e => {
      console.log(
        "No joy with saved tokens. Creating a web server for user input"
      );
      server.on("init", ({ url, urlNgrok }) => {
        console.log(
          `VFD: Go to ${url}
      or ${urlNgrok.replace("https://", "")}
(Perhaps use port 80 on pi? ngrok still might be better. No same-wifi sitch)`
        );
      });
    });
})();

const vfdDisplaySongState = state => {
  console.log("VFD:", state);
};

// Needs to refresh token, they last an hour but, yeah turning on and off..
let authRefreshInterval = setInterval(spotify.refreshTokens, 600000);

// const updateCurrentSongOrWhatever = async () => {
//   // console.log(authToken.code);
//   const currentSong = await spotify.getCurrentSong();
//   console.log("Current song:", currentSong);
// };
// setInterval(updateCurrentSongOrWhatever, 30000);
