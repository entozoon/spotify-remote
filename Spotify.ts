const fs = require("fs");
const SpotifyWebApi = require("spotify-web-api-node");
const EventEmitter = require("events");
const tokensFilename = "./spotify-tokens.saved.json";
import { humanKey } from "./utils";
//
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
            { id, name, album, duration_ms } = data.body.item,
            { volume_percent } = data.body.device,
            volumeFraction = volume_percent / 100,
            // artistName = artists ? artists[0].name : null,
            artist = album.artists.map(a => a.name).join(", "),
            albumName = album.name,
            progressFraction = progress_ms / duration_ms,
            state = {
              id,
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
  audioFeatures = async id =>
    new Promise((resolve, reject) => {
      // console.log("dry run problems", this.spotifyApi);
      this.spotifyApi.getAudioFeaturesForTrack(id).then(
        data => {
          let { key, mode } = data.body;
          resolve({
            key: humanKey({ key, mode })
          });
        },
        err => {
          return reject(err);
        }
      );
    });
  audioAnalysis = async id =>
    new Promise((resolve, reject) => {
      // console.log("dry run problems", this.spotifyApi);
      this.spotifyApi.getAudioAnalysisForTrack(id).then(
        data => {
          let { segments } = data.body;
          let volumeArray = segments ? this.createVolumeArray(segments) : [];
          resolve({
            volumeArray
          });
        },
        err => {
          return reject(err);
        }
      );
    });
  createVolumeArray = segments => {
    const width = 140,
      height = 8,
      minVolume = -30;
    let volumeArray: number[] = Array(width).fill(0);
    console.log(
      "!! These little half second segments do have a pitches array, so I could totally do an equalizer. Itd have to be draw the current frame with clever timing though, and creating the graphic might be tricky.."
    );
    volumeArray = volumeArray.map((v, i) => {
      let percentThrough = i / width;
      let volume =
        segments[Math.floor(segments.length * percentThrough)].loudness_start;
      volume = volume < minVolume ? minVolume : volume;
      return volume;
    });
    // Normalize everything from like -60db -> -2db, to 0 -> 8
    const maxVolume = Math.max(...volumeArray);
    volumeArray = volumeArray.map((v, i) => {
      return Math.round(((v - minVolume) / (maxVolume - minVolume)) * height);
    });
    return volumeArray;
  };
}
