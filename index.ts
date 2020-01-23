//
// Noritake Itron GU140X32F-7000 140x32
// - Chars fixed at 7x8(room for 20x4), or var width with room for perhaps 30x4
// https://github.com/entozoon/noritake-vfd/
//
import Server from "./Server";
import Spotify from "./Spotify";
import Vfd from "./Vfd";
import { delay, msToTime } from "./utils";
import * as spotifyCredentials from "./spotify-credentials.json";

// var uid = parseInt(process.env.SUDO_UID);
// console.log(uid);

const spotify = new Spotify({ spotifyCredentials });
const server = new Server({ spotifyCredentials, spotify });
const vfd = new Vfd();
let playingNicely = false;
let loopTimeout;
let progressUpdateInterval;
let state: any = {};

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
      await vfd.setBrightness(8);
      await vfd.echo(`--== Spotify Display ==--`, 5, 0, 0.85);
      // await vfd.drawLine();
    });

  // Dry run
  await spotify.setTokensOntoApiNonsense();
  // Leave some time to like, see the current IP
  setTimeout(() => {
    loop();
  }, 10000);
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
      // Needs to refresh token, they last an hour but, yeah turning on and off..
      setInterval(() => {
        spotify.refreshTokens().catch(async e => {
          await vfd.echo(
            `Could not refresh access tokens, probably the saved tokens are out of date.`,
            0,
            0,
            0.9
          );
        });
      }, 600000); // 10m
      // ^In theory, you could start it running a few mins before the saved token is expiring and it'll jank but.. I just don't have the energy anymore

      // Main loop
      loop();
    });
});

server.on("init", async ({ url, urlNgrok }) => {
  console.log(":: Index: server init");
  if (!playingNicely) {
    await vfd.echo(`Go to ${url.replace(":80", "")}`, 0, 2, 0.95);
    urlNgrok &&
      (await vfd.echo(`or ${urlNgrok.replace("https://", "")}`, 0, 3, 0.95));
  }
});

const loop = async () => {
  console.log("loop()");
  await spotify
    .currentPlaybackState()
    // .catch(e => {
    //   return console.error("Error::dry run", e);
    // })
    .then(async (_state: any) => {
      // This is an absolute ballachington
      // console.log(state);
      // console.log(typeof state);
      // console.log(JSON.stringify(state));
      let isNewSong =
        (state && JSON.stringify(state) === "{}") ||
        // state != _state ||
        // typeof state != typeof _state ||
        // JSON.stringify(state) != JSON.stringify(state) ||
        (state && state.name && state.name != _state.name);
      state = _state; // global
      state.isNewSong = isNewSong;
      // Only bother our arse with a full render if song has changed
      if (!isNewSong) return state;
      playingNicely = true;
      // Try to only render once
      if ((!state || !state.id) && isNewSong) {
        await vfd.clear();
        await vfd.echo(`No song playing`, 30, 3, 1);
        return state;
      }
      const { id } = state;
      await spotify.audioFeatures(id).then(async (info: any) => {
        // console.log("audioFeatures", info);
        state.key = info.key;
        if (isNewSong) {
          await vfd.displaySongState(state);
        }
      });
      return state;
    })
    .catch(e => {
      console.log(
        "No joy with saved tokens. Await response from web server for user input.",
        e
      );
      return {};
    })
    .then(async state => {
      if (!state || !state.id || !playingNicely) {
        return {};
      }
      const { id, isNewSong } = state;
      if (isNewSong) {
        await spotify.audioAnalysis(id).then(async (analysis: any) => {
          // console.log(analysis);
          const { volumeArray } = analysis;
          if (volumeArray) {
            await vfd.displayVolumeArray(analysis.volumeArray);
          }
        });
      }
    })
    .then(() => {
      if (!state || !state.id || !playingNicely) {
        return {};
      }
      // Have a timeout fallback if no song playing
      let timeout = state ? state.duration_ms - state.progress_ms : 10000;
      // Retry every min of every ten seconds regardless.
      // Rate limits are like, dozens a second so it should be fine(?)
      timeout = timeout < 10000 ? timeout : 10000;
      clearInterval(loopTimeout);
      loopTimeout = setTimeout(() => {
        loop();
      }, timeout || 10000);

      // 3:12 progress updater
      // Have a breather before firing up the loop,
      // so it can finish up drawing the volume array
      clearInterval(progressUpdateInterval);
      progressUpdateInterval = setInterval(() => {
        if (state) progressUpdate();
      }, 100);
    })
    .catch(e => {
      console.log("Error::", e);
    });
};

// This is getting a little filthy
let progressTicker = 0;
const progressUpdate = () => {
  // End of song
  if (state.progress_ms > state.duration_ms) {
    progressTicker = 0;
    return;
  }
  // New song
  if (progressTicker === 0) {
    // Abritrary jump at the start, allowing for displayVolumeArray
    // because I don't have the energy to write the timing script
    state.progress_ms += 1000;
  }
  // Manually update progress, rather than polling API
  state.progress_ms += 100;
  state.progressFraction = state.progress_ms / state.duration_ms;
  // console.log(state);
  // Draw to screen
  vfd.displayProgress(state);
  progressTicker++;
};

// setTimeout(async () => {
//   await vfd.clear();
//   await vfd.echo("I'm out", 0, 0, 1);
//   console.log("Exiting");
//   process.exit();
// }, 60000);
