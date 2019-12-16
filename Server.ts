const fs = require("fs"),
  http = require("http"),
  ngrok = require("ngrok"),
  ip = require("ip"),
  port = 80,
  serverTimeout = 5000,
  EventEmitter = require("events");

export default class extends EventEmitter {
  constructor({ spotifyCredentials, spotify }) {
    super();
    const { clientId } = spotifyCredentials;
    // let authoriseURL = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=https://querystrings.netlify.com&scope=user-read-playback-state&user-modify-playback-state`;
    let authoriseURL = spotify.authoriseURL;
    this.serverHtml = fs.readFileSync("./Server.html", "utf8");
    this.serverHtml = this.serverHtml.replace("{authoriseURL}", authoriseURL);

    // Start ngrok service for our http server
    (async () => {
      const url = `${ip.address()}:${port}`;
      const urlNgrok = await ngrok.connect({ port });
      this.emit("init", { url, urlNgrok });
    })().catch(e => {
      console.error("Error", e);
    });

    // Start http server, after a breather because.. ideally the dry run will work first
    setTimeout(() => {
      const server = http.createServer(this.requestHandler);
      server.on("error", e => {
        return console.log(
          "Couldn't start a http server. Probs port issues, are you running as sudo?:",
          e
        );
      });
      server.listen(port, e => {
        if (e) {
          console.log(e);
        }
      });
    }, serverTimeout);
  }
  // Serving HTML and listening for gold
  requestHandler = (request, response) => {
    if (request.url === "/favicon.ico") return; // does my head in
    // console.log("Request:", request.url);
    const { url } = request;
    if (url.startsWith(`/?authToken=`)) {
      let authToken = url.replace("/?authToken=", "");
      if (authToken) {
        // Let the app proper know about it
        this.emit("authToken", authToken);
        // Say thanks
      }
    }
    response.end(this.serverHtml);
  };
}
