// const raspi = require("raspi");
// const Serial = require("raspi-serial").Serial;

// raspi.init(() => {
//   var serial = new Serial({
//     baudRate: 19200
//     // parity: PARITY_NONE
//   });
//   serial.open(() => {
//     serial.on("data", data => {
//       process.stdout.write(data);
//     });
//     serial.write("Hello");
//   });
// });

// var SerialPort = require("serialport");
// var port = new SerialPort("/dev/ttyAMA0");
// port.on("open", function() {
//   port.write("main screen turn on", function(err) {
//     if (err) {
//       return console.log("Error on write: ", err.message);
//     }
//     console.log("message written");
//   });
// });
// // open errors will be emitted as an error event
// port.on("error", function(err) {
//   console.log("Error: ", err.message);
// });

// #####################################

const SerialPort = require("serialport");
const Readline = require("@serialport/parser-readline");

const vfd = new SerialPort(
  // /dev/ttyS0 refers to the mini UART, and /dev/ttyAMA0 refers to the PL011. The primary UART is the one assigned to the Linux console
  "/dev/ttyAMA0",
  {
    // https://serialport.io/docs/api-stream
    autoOpen: true, // Automatically opens the port on `nextTick`.
    endOnClose: false,
    baudRate: 38400,
    dataBits: 8, // Must be one of these: 8, 7, 6, or 5.
    // hupcl: true,
    // lock: true, // Prevent other processes from opening the port.
    // In the esp code, I had to enable 'invert', so might have a similar issue here..
    parity: "none", //'none', 'even', 'mark', 'odd', 'space'
    startBits: 1, // Must be one of these: 1 or 2.
    stopBits: 1 // Must be one of these: 1 or 2.
    // rtscts: false, // flow control setting
    // xany: false, // flow control setting
    // xoff: false, // flow control setting
    // xon: false, // flow control setting
    // highWaterMark: 12 // 64 * 1024, // The size of the read and write buffers defaults to 64k.
  },
  false
);

const parser = new Readline();
vfd.pipe(parser);
parser.on("data", line => console.log(`> ${line}`)); // won't happen tbh

const resetVFD = mode => {
  // performs a software reset on the VFD controller
  // VFD.write(0x1b); // ESC
  // VFD.write(0x40); // software reset
  // VFD.write(0x1f);
  // VFD.write(mode); // select scroll mode (0x01 over, 0x02 vert, 0x03 horiz)

  let buffer = new Buffer(4);
  buffer[0] = 0x1b;
  buffer[1] = 0x40;
  buffer[2] = 0x1f;
  buffer[3] = mode;

  vfd.write(buffer, (err, result) => {
    if (err) {
      console.log("Error while sending message : " + err);
    } else {
      console.log("okay..");
      vfd.write("Hello");
    }
    if (result) {
      console.log("Response received after sending message : " + result);
    }
  });
};

vfd.on("error", err => {
  console.log(err.message);
  process.exit(1);
});

vfd.on("open", () => {
  console.log("Port Opened");
  resetVFD(0x02);

  setTimeout(() => {
    process.exit();
  }, 6000);
});
