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
    this.setTokensOntoApiNonsense();
  };
  get tokens() {
    return JSON.parse(fs.readFileSync(tokensFilename, "utf8"));
  }
  setTokensOntoApiNonsense = () =>
    new Promise((resolve, reject) => {
      // console.log(":: setTokensOntoApiNonsense", this.tokens);

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
          // Probably the saved tokens are out of date
          return reject(err);
        }
      );
    });
  refreshTokens = () =>
    new Promise((resolve, reject) => {
      console.log(":: refreshTokens");
      this.spotifyApi.refreshAccessToken().then(
        data => {
          console.log("Refreshed!");
          this.saveTokens(data.body);
          resolve();
        },
        e => reject
      );
    });
  currentPlaybackState = async () =>
    new Promise((resolve, reject) => {
      // console.log("dry run problems", this.spotifyApi);
      this.spotifyApi.getMyCurrentPlaybackState().then(
        data => {
          if (!data.body.is_playing) return resolve(null);
          const { progress_ms } = data.body,
            { name, album, duration_ms } = data.body.item,
            { volume_percent } = data.body.device,
            volumeFraction = volume_percent / 100,
            // artistName = artists ? artists[0].name : null,
            artist = album.artists.map(a => a.name).join(", "),
            albumName = album.name,
            progressFraction = progress_ms / duration_ms,
            state = {
              name,
              artist,
              albumName,
              duration_ms,
              progress_ms,
              progressFraction,
              volume_percent,
              volumeFraction
            };
          return resolve(state);
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
