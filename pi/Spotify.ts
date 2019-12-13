const fs = require("fs");
const SpotifyWebApi = require("spotify-web-api-node");
const EventEmitter = require("events");
const TokenFilename = "./spotify-auth-token.saved.json";

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
  saveTokenCode = code => {
    const token = {
      code,
      date: Date.now()
    };
    fs.writeFileSync(TokenFilename, JSON.stringify(token));
    this.token = token;
  };
  get Token() {
    // If booting on a cold day, try and dig one from the saved file, never know.. it might work
    if (!this.token) {
      this.token = JSON.parse(fs.readFileSync(TokenFilename, "utf8"));
    }
    return this.token;
  }
  refreshToken = () => {
    console.log("Refreshing token");
    console.log("!! TO DO !! Via Spotify class function to help us out");
    // ....
    // this.spotifyApi.refreshAccessToken().then(
    //   data => {
    //     console.log("The access token has been refreshed!");
    //     spotifyApi.setAccessToken(data.body["access_token"]);
    //   },
    //   err => {
    //     console.log("Could not refresh access token", err);
    //   }
    // );
    this.save("refreshed" + Math.random());
  };
  get authoriseURL() {
    return this.spotifyApi.createAuthoriseURL([
      "user-read-playback-state",
      "user-modify-playback-state"
    ]);
  }
  authorise = () => {
    console.log(":: authorise");
    this.spotifyApi.authorizationCodeGrant(this.token.code).then(
      data => {
        console.log("Authorised!");
        // console.log("The token expires in " + data.body["expires_in"]);
        // console.log("The access token is " + data.body["access_token"]);
        // console.log("The refresh token is " + data.body["refresh_token"]);
        // // Set the access token on the API object to use it in later calls
        this.spotifyApi.setAccessToken(data.body["access_token"]);
        this.spotifyApi.setRefreshToken(data.body["refresh_token"]);
        // it's the ACCESS TOKEN THAT YOU FRICKIN use
      },
      err => {
        console.log("Something went wrong!", err);
      }
    );
  };
  letsTryOurToken = () => {
    console.log(":: letsTryOurToken");
    this.spotifyApi.setAccessToken(this.token.code);
    this.spotifyApi.getMyCurrentPlaybackState({}).then(
      function(data) {
        // Output items
        console.log("Now Playing: ", data.body);
      },
      function(err) {
        console.log("Something went wrong!", err);
      }
    );
  };
  getCurrentSong = () =>
    new Promise(resolve => {
      resolve(`song name or whatevs`);
    });
}
