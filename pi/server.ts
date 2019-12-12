const fs = require("fs");
const http = require("http");
const ip = require("ip");
const port = 55;
const serverIndex = fs.readFileSync("./server-index.html", "utf8");
const serverThanks = fs.readFileSync("./server-thanks.html", "utf8");

// Start ngrok service for our http server
const ngrok = require("ngrok");
(async () => {
  const url = await ngrok.connect({
    port
  });
  console.log(
    `LCD: Go to ${url.replace("https://", "")}
        or ${ip.address()}:${port}
(Perhaps use port 80 on pi? ngrok still might be better. No same-wifi sitch)`
  );
})().catch(e => {
  console.error("Error", e);
});

// Serving HTML and listening for gold
const requestHandler = (request, response) => {
  if (request.url === "/favicon.ico") return; // does my head in
  console.log("Request:", request.url);
  const { url } = request;
  if (url.startsWith(`/?authToken=`)) {
    let token = url.replace("/?authToken=", "");
    if (token) {
      console.log("Sick, a token was submitted:", token);
      // Save it to disk

      // Let the app proper know about it
      response.end(serverThanks);
    }
  }
  response.end(serverIndex);
};

// Start http server
const server = http.createServer(requestHandler);
server.listen(port, err => {
  if (err) {
    return console.log("Couldn't start a http server. Probs port issues:", err);
  }
});
