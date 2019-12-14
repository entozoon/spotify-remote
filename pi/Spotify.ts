const fs = require("fs");
const SpotifyWebApi = require("spotify-web-api-node");
const EventEmitter = require("events");
const tokensFilename = "./spotify-tokens.saved.json";

export default class extends EventEmitter {
  constructor({ spotifyCredentials }) {
    super();
    const { clientId, clientSecret } = spotifyCredentials;
    this.spotifyApi = new SpotifyWebApi({
      // https://developer.spotify.com/dashboard/applications/3f8c992f08c04ffd975d95665dad1318
      clientId,
      clientSecret,
      redirectUri: "https://querystrings.netlify.com"
    });
  }
  saveTokens = ({
    code = this.tokens.code,
    access_token = "",
    refresh_token = "",
    // expires_in is also a thing
    date = Date.now()
  }) => {
    // Spotify gives you a code, you give that back, it gives you an access token, you suicide
    fs.writeFileSync(
      tokensFilename,
      JSON.stringify({ code, access_token, refresh_token, date })
    );
    this.setTokensOnApiNonsense();
  };
  get tokens() {
    return JSON.parse(fs.readFileSync(tokensFilename, "utf8"));
  }
  setTokensOnApiNonsense = () =>
    new Promise((resolve, reject) => {
      // console.log(":: setTokensOnApiNonsense", this.tokens);

      this.tokens.access_token &&
        this.spotifyApi.setAccessToken(this.tokens.access_token);
      this.tokens.refresh_token &&
        this.spotifyApi.setRefreshToken(this.tokens.refresh_token);
      resolve();
    });

  get authoriseURL() {
    return this.spotifyApi.createAuthorizeURL([
      "user-read-playback-state",
      "user-modify-playback-state"
    ]);
  }
  authorise = async () =>
    new Promise((resolve, reject) => {
      this.spotifyApi.authorizationCodeGrant(this.tokens.code).then(
        data => {
          console.log("Authorised!");
          this.saveTokens(data.body);
          return resolve();
        },
        err => {
          return reject(err);
        }
      );
    });
  refreshTokens = () => {
    console.log(":: refreshTokens");
    this.spotifyApi.refreshAccessToken().then(
      data => {
        console.log("Refreshed!");
        this.saveTokens(data.body);
      },
      err => {
        console.error("Could not refresh access tokens", err);
      }
    );
  };
  currentPlaybackState = async () =>
    new Promise((resolve, reject) => {
      // console.log("dry run problems", this.spotifyApi);
      this.spotifyApi.getMyCurrentPlaybackState().then(
        data => {
          const { is_playing, progress_ms, item } = data.body;
          const { name } = item;
          const artistName = item.artists[0].name;
          return resolve({ name, artistName, is_playing, progress_ms });
        },
        err => {
          return reject(err);
        }
      );
    });

  getCurrentSong = () =>
    new Promise(resolve => {
      resolve(`song name or whatevs`);
    });
}
