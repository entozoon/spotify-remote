const http = require("http");
const port = 5555;

const requestHandler = (request, response) => {
  console.log(request.url);
  response.end("Hello Node.js Server!");
};

const server = http.createServer(requestHandler);

server.listen(port, err => {
  if (err) {
    return console.log("something bad happened", err);
  }

  console.log(`server is listening on ${port}`);
});

// Ngrok doesn't have custom subdomains anymore
// and, I mean.. the spotify auth callback URL has to be set explicitly
// So, I couldn't even serve up 192.168.0.66:5555
// Only a fixed tunnel would work unless I can think of something else
// some server-side magic.. erm.. ?? think about that later.
// what about
// ngrok a little webpage, with that link to click.
// the callback url being some other static site (or example.com)
// cutting and pasting the code back into the ngrok mini site
// having it store it then and there with node?
//

const ngrok = require("ngrok");
(async () => {
  console.log("Starting..");
  const url = await ngrok.connect({
    port: 5555
  });
  console.log(url.replace("https://", ""));
})().catch(e => {
  console.error("Error", e);
});
