//
// Noritake Itron GU140X32F-7000 140x32
// - Chars fixed at 7x8(room for 20x4), or var width with room for perhaps 30x4
// https://github.com/entozoon/noritake-vfd/
//
import Server from "./Server";
import Spotify from "./Spotify";
import Vfd from "./Vfd";

var uid = parseInt(process.env.SUDO_UID);
console.log(uid);

const spotifyCredentials = {
  clientId: "3f8c992f08c04ffd975d95665dad1318",
  clientSecret: "4d623279971343478816fa9c245a740c"
};

const spotify = new Spotify({ spotifyCredentials });
const server = new Server({ spotifyCredentials, spotify });
const vfd = new Vfd();
let playingNicely = false;

(async () => {
  await vfd
    .init()
    .catch(e => {
      console.log("Error::VFD can't init -", e);
      vfd.disable(); // continues on after this point but be reet
    })
    .then(async () => {
      await vfd.resetVFD();
      await vfd.resetFont();
      await vfd.setBrightness(5);
      // await vfd.drawLine();
    });

  // Dry run
  await spotify.setTokensOntoApiNonsense();
  await spotify
    .currentPlaybackState()
    // .catch(e => {
    //   return console.error("Error::dry run", e);
    // })
    .then(state => {
      playingNicely = true;
      vfd.displaySongState(state);
    })
    .catch(e => {
      console.log(
        "No joy with saved tokens. Creating a web server for user input"
      );
    });
})();

// Web server user input received
server.on("authToken", async code => {
  // Brand spanking new token, pass it over to spotify instanceAI
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
            vfd.displaySongState(state);
          })
          .catch(e => {
            console.error("Error::currentPlaybackState", e);
          });
      }, 2000);
    });
});

server.on("init", async ({ url, urlNgrok }) => {
  if (!playingNicely) {
    await vfd.echo(
      `
Go to ${url}
   or ${urlNgrok.replace("https://", "")}`,
      0.95
    );
  }
});

// Needs to refresh token, they last an hour but, yeah turning on and off..
let authRefreshInterval = setInterval(() => {
  spotify.refreshTokens().catch(async e => {
    await vfd.echo(
      `Could not refresh access tokens, probably the saved tokens are out of date.`,
      0.9
    );
  });
}, 600000); // 10m

// const updateCurrentSongOrWhatever = async () => {
//   // console.log(authToken.code);
//   const currentSong = await spotify.getCurrentSong();
//   console.log("Current song:", currentSong);
// };
// setInterval(updateCurrentSongOrWhatever, 30000);
