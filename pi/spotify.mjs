// import axios from "axios";
// // https://developer.spotify.com/dashboard/applications/3f8c992f08c04ffd975d95665dad1318
// // client_id 3f8c992f08c04ffd975d95665dad1318
// // client_secret 4d623279971343478816fa9c245a740c
// // Base64 client_id M2Y4Yzk5MmYwOGMwNGZmZDk3NWQ5NTY2NWRhZDEzMTg6NGQ2MjMyNzk5NzEzNDM0Nzg4MTZmYTljMjQ1YTc0MGM=M2Y4Yzk5MmYwOGMwNGZmZDk3NWQ5NTY2NWRhZDEzMTg=
// // Base64 client_id:client_secret M2Y4Yzk5MmYwOGMwNGZmZDk3NWQ5NTY2NWRhZDEzMTg6NGQ2MjMyNzk5NzEzNDM0Nzg4MTZmYTljMjQ1YTc0MGM=
// //
// // Initial auth code, in browser from:
// // https://accounts.spotify.com/authorize/?client_id=3f8c992f08c04ffd975d95665dad1318&response_type=code&redirect_uri=https%3A%2F%2Fexample.com&scope=user-read-private%20user-read-currently-playing%20user-read-playback-state%20user-modify-playback-state&show_dialog=true
// // Yields:
// // example.com/?code=AQABTcURF4FCPVm1m8alyxKMe4rcnCGVyggy-sz9q7zLWB7SOzzM6e4L5_ZB75GAUZKuJT72SNBT-l4YOFDfXw0lw7QCVO4SieE9_bf8Wu152hjoBYKaJGX1aamkMEJeesiEuYhNxR5HHCcW7C9Gck1wQuP67uhaA5CQIitaUt_WjEbJ2PrcgKAqO70eT91WspNb5_ig_XtFW-icxNf8EvJkDQGuoXSNaKxGikwAdKbopOXM3i0-595BOUQ_a_Majfl77wybzx816MVhrdchzhdjbADkUlTPasbPpUX_KN6wxfWb58t5WCcilEir8jE
// // Valid for 1 hour

// let accessToken =
//   "AQABTcURF4FCPVm1m8alyxKMe4rcnCGVyggy-sz9q7zLWB7SOzzM6e4L5_ZB75GAUZKuJT72SNBT-l4YOFDfXw0lw7QCVO4SieE9_bf8Wu152hjoBYKaJGX1aamkMEJeesiEuYhNxR5HHCcW7C9Gck1wQuP67uhaA5CQIitaUt_WjEbJ2PrcgKAqO70eT91WspNb5_ig_XtFW-icxNf8EvJkDQGuoXSNaKxGikwAdKbopOXM3i0-595BOUQ_a_Majfl77wybzx816MVhrdchzhdjbADkUlTPasbPpUX_KN6wxfWb58t5WCcilEir8jE";

// const api = axios.create({
//   baseURL: "https://api.spotify.com/v1/me/player/",
//   timeout: 60000,
//   headers: {
//     "Content-Type": "application/json",
//     // "Content-Type": "application/x-www-form-urlencoded",
//     Authorization: "Bearer " + accessToken
//   }
// });

// async function getCurrent() {
//   let url = "currently-playing";
//   const res = await api.post(url, {
//     headers: {
//       Authorization: "Bearer " + accessToken
//     }
//   });
//   let data = await res.json();
//   console.log(data);
// }

// getCurrent().catch(e => {
//   console.error("Error", e.message);
// });

import SpotifyWebApi from "spotify-web-api-node";

var scopes = ["user-read-playback-state", "user-modify-playback-state"],
  redirectUri = "https://example.com/callback",
  clientId = "5fe01282e44241328a84e7c5cc169165";

const spotifyApi = new SpotifyWebApi({
  // https://developer.spotify.com/dashboard/applications/3f8c992f08c04ffd975d95665dad1318
  clientId: "3f8c992f08c04ffd975d95665dad1318",
  clientSecret: "4d623279971343478816fa9c245a740c",
  redirectUri: "https://example.com"
});

// ****** GENERATE AUTH TOKEN FIRST TIME ****** //
const authorizeURL = spotifyApi.createAuthorizeURL(scopes);
console.log(authorizeURL);
// https://accounts.spotify.com/authorize?client_id=3f8c992f08c04ffd975d95665dad1318&response_type=code&redirect_uri=https://example.com&scope=user-read-playback-state%20user-modify-playback-state
// ******************************************** //

// Needs updating every damn time it starts running
const accessToken =
  "AQCMW6egq5bHWQqe9bda23vM4DC-ujHBQPyus1PB5CFxo6vr6Kgg0sib_MfqIGV3A4_y5fQQ-ySviHNRoJ0AkS_pSrjYQGuPyGjjxsh9wYFv0f4dtxwluT0KN3p7ffJBUzwaWrgM-JqKlVRaB42Qxt8nq3X5OOVsEzWGpvoIV_0E-0osG9SR_526lEvi8La8py-T-ccm90kCh1joZbWzDSsNWsLg1grfd63ri61z5H897143gSFPl1UT8EKz5Ec";

const refreshToken = () => {
  spotifyApi.refreshAccessToken().then(
    data => {
      console.log("The access token has been refreshed!");
      spotifyApi.setAccessToken(data.body["access_token"]);
    },
    err => {
      console.log("Could not refresh access token", err);
    }
  );
};
setInterval(refreshToken, 600000); // 10 mins

spotifyApi.authorizationCodeGrant(accessToken).then(
  data => {
    console.log("The token expires in " + data.body["expires_in"]);
    console.log("The access token is " + data.body["access_token"]);
    console.log("The refresh token is " + data.body["refresh_token"]);
    // Set the access token on the API object to use it in later calls
    spotifyApi.setAccessToken(data.body["access_token"]);
    spotifyApi.setRefreshToken(data.body["refresh_token"]);
  },
  err => {
    console.log("Something went wrong!", err);
  }
);

// spotifyApi.getMyCurrentPlaybackState({}).then(
//   function(data) {
//     // Output items
//     console.log("Now Playing: ", data.body);
//   },
//   function(err) {
//     console.log("Something went wrong!", err);
//   }
// );
