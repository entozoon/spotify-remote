const rpio = require("rpio");
const pin = 16; // GPIO4
rpio.init({
  mapping: "physical" // Use the P1-P40 numbering scheme
  // mapping: "gpio" // Use GPIO numbers (they're not.. correct)
});

rpio.open(pin, rpio.INPUT);
setInterval(() => {
  console.log(`Pin ${pin} is currently ${rpio.read(pin) ? "high" : "low"}`);
  // Not much point being faster, it stays HIGH for 2s each trigger
}, 500);
