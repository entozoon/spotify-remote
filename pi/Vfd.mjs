//
// https://forum.arduino.cc/index.php?topic=198201.0
//
import SerialPort from "serialport";
// import Readline from "@serialport/parser-readline";
// const parser = new Readline();
// vfd.pipe(parser);
// parser.on("data", line => console.log(`> ${line}`)); // won't happen tbh

export default class Vdf {
  constructor() {}
  init() {
    console.log(":: init");
    return new Promise((resolve, reject) => {
      this.serial = new SerialPort(
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
      this.serial.on("error", err => {
        console.log("Error:", err.message);
        reject(err.message);
        // process.exit(1);
      });
      this.serial.on("open", () => {
        resolve();
      });
    });
  }
  writeBytes(byteArray) {
    return new Promise((resolve, reject) => {
      // Convert array of bytes to a buffer array (similar)
      let buffer = new Buffer(byteArray.length);
      byteArray.forEach((b, i) => {
        buffer[i] = b;
      });
      // console.log("Writing", byteArray);
      // Write said buffer, resolving as appr
      this.serial.write(buffer, (err, result) => {
        return err ? reject(err) : resolve();
      });
    });
  }
  resetVFD() {
    console.log(":: resetVFD");
    return this.writeBytes([
      0x1b, // ESC
      0x40, // software reset
      0x1f,
      0x02 // select scroll mode (0x01 over, 0x02 vert, 0x03 horiz)
    ]);
  }
  // this.resetVFD = this.writeBytes([
  resetVFD() {
    return this.writeBytes([
      0x1b, // ESC
      0x40, // software reset
      0x1f,
      0x02 // select scroll mode (0x01 over, 0x02 vert, 0x03 horiz)
    ]);
  }
  // this.setBrightness = level1to8 => {
  setBrightness(level1to8) {
    console.log(":: setBrightness", level1to8);
    return this.writeBytes([0x1f, 0x58, level1to8]);
  }
  // this.clear = () => {
  clear() {
    console.log(":: clear");
    return this.writeBytes([0x0c]);
  }
  // speed: 0 -> 1
  // this.echo = (verse, speed) => {
  echo(verse, speed) {
    console.log(":: echo");
    speed = typeof speed == "undefined" ? 1 : speed;
    return new Promise(resolve => {
      // console.log("Echoing to screen, pacedly..");
      let _verse = verse.split("").reverse();
      let lettering = setInterval(() => {
        let letter = _verse.pop();
        process.stdout.write(letter);
        this.serial.write(letter);
        if (_verse.length <= 0) {
          console.log("");
          clearInterval(lettering);
          resolve();
        }
      }, (1 - speed) * 500); // 500 -> 0ms between each letter
    });
  }
  // this.setKerning = size0to3 =>
  setKerning(size0to3) {
    // 0: Fixed Font Size with 1 dot space
    // 1: Fixed Font Size with 2 dot space
    // 2: Proportional Font Size with 1 dot space (narrowest)
    // 3: Proportional Font Size with 2 dot space
    console.log(":: setKerning", size0to3);
    return this.writeBytes([0x1f, 0x28, 0x67, 0x03, size0to3 % 0x100]);
  }
  // this.resetFont = () => {
  resetFont() {
    console.log(":: resetFont");
    // England
    const set = 3;
    const code = 0;
    return this.writeBytes([0x1b, 0x52, set, 0x1b, 0x74, code]);
  }
  drawBitmap(bmp, width, height) {
    /* prettier-ignore */
    bmp = [
      // 11111000  00011111
      //  = F8      = 1F
      0xf8, 0x1f, // ^ a 16 pixels row
      0xe7, 0xa7,
      0xcb, 0xd3,
      0x9d, 0xe9,
      0xa0, 0x0d,
      0x5d, 0xe2,
      0x3d, 0xec,
      0x3d, 0xec,
      0x40, 0x00,
      0x3d, 0xec,
      0x5d, 0xea,
      0xa5, 0xe5,
      0x98, 0x09,
      0xcb, 0xd3,
      0xe7, 0xa7,
      0xf8, 0x1f
    ];
    width = 16;
    height = 16;

    /* prettier-ignore */
    // let bmpMyke = [
    //   [0, 0, 0, 1, 0, 0, 0],
    //   [0, 0, 1, 0, 1, 0, 0],
    //   [0, 1, 0, 0, 0, 1, 0],
    //   [0, 0, 1, 0, 1, 0, 0],
    //   [0, 0, 0, 1, 0, 0, 0]
    // ];
    // OOF - now that's an algorithm to figure out. I mean, they _have_ to be in
    // chunks of 8, even if the rows aren't long enough..
    // But, hol' up for a minute because I might not even be bothering with graphics.

    let heightBits = height / 8; // because.. bytes
    const setup = [
      0x1f,
      0x28,
      0x66,
      0x11,
      width % 256,
      width / 256,
      heightBits % 256,
      heightBits / 256,
      0x01
    ];
    const bytes = setup.concat(bmp);
    // for (let i = 0; i < X * Y; i++) {
    //   VFD.write(bmp[i]);
    // }
    console.log(bytes);
    return this.writeBytes(bytes);
  }
  drawLine() {
    //
    //
    //
    // PROBLEM
    // this draws at the current cursor!
    //
    //
    // REALISTICALLY
    // this might just use bitmap function above, get that workin
    //
    // 11111111111111111010101010101010
    // let bmp = [0xff, 0xff, 0x55, 0xaa];
    // let blank = [0x00, 0x00, 0x00, 0x00];
    // bmp = [
    //   ...bmp,
    //   ...blank,
    //   ...blank,
    //   ...blank,
    //   ...blank,
    //   ...blank,
    //   ...blank,
    //   ...blank
    // ];

    //
    // OH FUCK
    // It draws them at 8 pixel vertical columns at a time
    // deja frickin vous
    //
    // 1 1 1 1 111111111111 1010101010101010
    // 0 0 0 0 000000000000 0000000000000000
    // 0 0 0 0 000000000000 0000000000000000
    // 0 0 0 0 000000000000 0000000000000000
    // 0 0 0 0 000000000000 0000000000000000
    // 0 0 0 0 000000000000 0000000000000000
    // 0 0 0 0 000000000000 0000000000000000
    // 0 0 0 0 000000000000 0000000000000000
    //
    // Now this reaaaaaaally is a fucking algorithm to figure out. Holy satan.
    //
    /* prettier-ignore */
    let bmp = [
      0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x80, 0x80,0x00,0x80,0x00,0x80,0x00,0x80,0x00,0x80,0x00,0x80,0x00,0x80,0x00,0x80,0x00,
    ];
    // Gotta like, be a block of 8 high right? maybe not?
    const width = 32;
    const height = 8;
    let heightBits = Math.ceil(height / 8); // because.. bytes
    const setup = [
      0x1f,
      0x28,
      0x66,
      0x11,
      width % 256,
      width / 256,
      heightBits % 256,
      heightBits / 256,
      0x01
    ];
    const bytes = setup.concat(bmp);
    // for (let i = 0; i < X * Y; i++) {
    //   VFD.write(bmp[i]);
    // }
    console.log(bytes);
    return this.writeBytes(bytes);
  }
}
