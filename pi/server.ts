const http = require("http");
const port = 55;

const ngrok = require("ngrok");
(async () => {
  const url = await ngrok.connect({
    port
  });
  console.log(
    `LCD: Go to ${url.replace(
      "https://",
      ""
    )} (perhaps use port 80 on pi if poss)`
  );
})().catch(e => {
  console.error("Error", e);
});

const requestHandler = (request, response) => {
  console.log(request.url);
  response.end("Hello Node.js Server!");
};

const server = http.createServer(requestHandler);

server.listen(port, err => {
  if (err) {
    return console.log("Something bad happened", err);
  }
  console.log(`server is listening on ${port}`);
});
