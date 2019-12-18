const rpio = require("rpio");

rpio.open(4, rpio.INPUT);
setInterval(() => {
  console.log("Pin 4 is currently " + (rpio.read(4) ? "high" : "low"));
}, 500);
