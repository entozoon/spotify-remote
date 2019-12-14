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
  saveTokens = ({ code, date = Date.now(), access = "" }) => {
    fs.writeFileSync(tokensFilename, JSON.stringify({ code, date, access }));
    // this._tokens = tokens;
  };
  get tokens() {
    // // If booting on a cold day, try and dig them from the saved file, never know.. it might work
    // return this._tokens
    //   ? this._tokens :
    return JSON.parse(fs.readFileSync(tokensFilename, "utf8"));
  }
  refreshTokens = () => {
    console.log("Refreshing tokens");
    console.log("!! TO DO !! Via Spotify class function to help us out");
    // ....
    // this.spotifyApi.refreshAccessTokens().then(
    //   data => {
    //     console.log("The access tokens has been refreshed!");
    //     spotifyApi.setAccessTokens(data.body["access_tokens"]);
    //   },
    //   err => {
    //     console.log("Could not refresh access tokens", err);
    //   }
    // );
    this.save("refreshed" + Math.random());
  };
  get authoriseURL() {
    return this.spotifyApi.createAuthorizeURL([
      "user-read-playback-state",
      "user-modify-playback-state"
    ]);
  }
  authorise = () => {
    console.log(":: authorise");
    this.spotifyApi.authorizationCodeGrant(this.tokens.code).then(
      data => {
        console.log("Authorised!");
        // console.log("The tokens expires in " + data.body["expires_in"]);
        // console.log("The access tokens is " + data.body["access_tokens"]);
        // console.log("The refresh tokens is " + data.body["refresh_tokens"]);
        // // Set the access tokens on the API object to use it in later calls
        this.spotifyApi.setAccessToken(data.body["access_token"]);
        this.spotifyApi.setRefreshToken(data.body["refresh_token"]);
        // it's the ACCESS TOKENs THAT YOU FRICKIN use
        let tokens = this.tokens;
        tokens.access = data.body["access_token"];
        this.saveTokens(tokens);
      },
      err => {
        console.error("Something went wrong!", err);
      }
    );
  };
  letsTryOurTokens = () => {
    console.log(":: letsTryOurTokens");
    this.spotifyApi.setAccessToken(this.tokens.access);
    this.spotifyApi.getMyCurrentPlaybackState({}).then(
      data => {
        const { is_playing, progress_ms, item } = data.body;
        const { name } = item;
        const artistName = item.artists[0].name;
        console.log(name, "-", artistName);
        console.log("is_playing", is_playing);
        console.log("progress_ms", progress_ms);
      },
      err => {
        console.error("Something went wrong!", err);
      }
    );
  };
  getCurrentSong = () =>
    new Promise(resolve => {
      resolve(`song name or whatevs`);
    });
}
