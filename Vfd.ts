//
// https://forum.arduino.cc/index.php?topic=198201.0
//
// import * as SerialPort from "serialport";
const SerialPort = require("serialport");
import {
  msToTime,
  logBmp,
  logVerticalRun,
  numberToBinary,
  whatTheFuckIsThis,
  logVerticalRunBytes,
  convertVerticalRunBytesToVerticalRun
} from "./utils";
// import Readline from "@serialport/parser-readline";
// const parser = new Readline();
// vfd.pipe(parser);
// parser.on("data", line => console.log(`> ${line}`)); // won't happen tbh
export default class Vdf {
  serial = null;
  initialised = false;
  disabled = false;
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
        // false
        e => {
          console.error(e);
          reject(e);
        }
      );
      this.serial.on("error", e => {
        console.error(e);
        reject(e);
      });
      this.serial.on("open", () => {
        console.log("Serial ready");
        this.initialised = true;
        resolve();
      });
    });
  }
  close() {
    if (!this.disabled) {
      this.serial.close();
    }
  }
  disable() {
    this.disabled = true;
  }
  writeBytes(byteArray) {
    if (this.disabled) return;
    return new Promise((resolve, reject) => {
      // Convert array of bytes to a buffer array (similar)
      // let buffer = new Buffer(byteArray.length);
      let buffer = Buffer.alloc(byteArray.length);
      byteArray.forEach((b, i) => {
        buffer[i] = b;
      });
      // console.log("Writing", JSON.stringify(byteArray));
      // Write said buffer, resolving as appr
      this.serial.write(buffer, e => {
        return e ? reject(e) : resolve();
      });
    });
  }
  // this.resetVFD = this.writeBytes([
  resetVFD() {
    console.log(":: resetVFD");
    return this.writeBytes([
      0x1b, // ESC
      0x40, // software reset
      0x1f,
      0x02 // select scroll mode (0x01 over, 0x02 vert, 0x03 horiz)
    ]);
  }
  setInverse(binary = 1) {
    // 0 or 1
    return this.writeBytes([0x1f, 0x72, binary]);
  }
  // this.setBrightness = level1to8 => {
  setBrightness(level1to8) {
    console.log(":: setBrightness", level1to8);
    return this.writeBytes([0x1f, 0x58, level1to8]);
  }
  // normal, and, or, xor
  setMixtureMode(mode) {
    console.log(":: setMixtureMode", mode);
    const modeByte = ["normal", "and", "or", "xor"].indexOf(mode);
    return this.writeBytes([0x1f, 0x77, modeByte]);
  }
  // this.clear = () => {
  clear() {
    console.log(":: clear");
    return this.writeBytes([0x0c]);
  }
  // x (pixels), y (row)
  setCursor(x, y) {
    //     Code: 1FH 24H xL xH yL yH
    //  xL: Cursor position x Lower byte (1 dot/unit)
    //  xH: Cursor position x Upper byte (1 dot/unit)
    let x2 = 0x00; // always be 0
    //  yL: Cursor position y Lower byte (8 dot/unit)
    //  yH: Cursor position y Upper byte(8 dot/unit)
    let y2 = 0x00; // always be 0
    // Definable area:
    // 0 ≦ (xL + xH x 255) ≦ 255
    // 0 ≦ (yL + yH x 255) ≦ 3
    // Might be affected by the mixture mode.. this'll take some playing with
    return this.writeBytes([0x1f, 0x24, x, x2, y, y2]);
  }
  // speed: 0 -> 1
  // this.echo = (verse, speed) => {
  echo = async (verse, x, y, speed) => {
    if (this.disabled) return console.log(verse);
    if (!this.initialised) return;
    console.log(":: echo");
    await this.setCursor(x, y);
    speed = typeof speed == "undefined" ? 1 : speed;
    return new Promise(resolve => {
      // console.log("Echoing to screen, pacedly..");
      let _verse = verse.split("").reverse();
      let lettering = setInterval(() => {
        let letter = _verse.pop();
        process.stdout.write(letter);
        this.serial.write(letter);
        if (_verse.length <= 0) {
          process.stdout.write("\n");
          clearInterval(lettering);
          resolve();
        }
      }, (1 - speed) * 500); // 500 -> 0ms between each letter
    });
  };
  setCode(set, code) {
    console.log(":: setKerning", set, code);
    return this.writeBytes([0x1b, 0x52, set, 0x1b, 0x74, code]);
  }
  // this.setKerning = size0to3 =>
  setKerning(size0to3) {
    // Looking for font size? There's a magnification concept. Default is smallest, so meh.
    // 0: Fixed Font Size with 1 dot space
    // 1: Fixed Font Size with 2 dot space
    // 2: Proportional Font Size with 1 dot space (narrowest)
    // 3: Proportional Font Size with 2 dot space
    console.log(":: setKerning", size0to3);
    return this.writeBytes([0x1f, 0x28, 0x67, 0x03, size0to3 % 0x100]);
  }
  // this.resetFont = () => {
  async resetFont() {
    console.log(":: resetFont ");
    // England
    await this.setCode(3, 0);
    await this.setKerning(2);
    return;
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
  // drawLine(x, y, length) {
  //   //
  //   //
  //   //
  //   // PROBLEM
  //   // this draws at the current cursor!
  //   //
  //   //
  //   // REALISTICALLY
  //   // this might just use bitmap function above, get that workin
  //   //
  //   // 11111111111111111010101010101010
  //   // let bmp = [0xff, 0xff, 0x55, 0xaa];
  //   // let blank = [0x00, 0x00, 0x00, 0x00];
  //   // bmp = [
  //   //   ...bmp,
  //   //   ...blank,
  //   //   ...blank,
  //   //   ...blank,
  //   //   ...blank,
  //   //   ...blank,
  //   //   ...blank,
  //   //   ...blank
  //   // ];
  //   //
  //   // OH FUCK
  //   // It draws them at 8 pixel vertical columns at a time
  //   // deja frickin vous
  //   //
  //   // 1 1 1 1 111111111111 1010101010101010
  //   // 0 0 0 0 000000000000 0000000000000000
  //   // 0 0 0 0 000000000000 0000000000000000
  //   // 0 0 0 0 000000000000 0000000000000000
  //   // 0 0 0 0 000000000000 0000000000000000
  //   // 0 0 0 0 000000000000 0000000000000000
  //   // 0 0 0 0 000000000000 0000000000000000
  //   // 0 0 0 0 000000000000 0000000000000000
  //   //
  //   // Maybe it'd be smarter to be like
  //   // drawRect(x1,y1,x2,y2);
  //   // drawRectDotty(x1,y1,x2,y2);
  //   //
  //   /* prettier-ignore */
  //   let bmp = [
  //     0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x80,0x80, 0x80,0x00,0x80,0x00,0x80,0x00,0x80,0x00,0x80,0x00,0x80,0x00,0x80,0x00,0x80,0x00,
  //   ];
  //   // Gotta like, be a block of 8 high right? maybe not?
  //   const width = 32;
  //   const height = 8;
  //   let heightBits = Math.ceil(height / 8); // because.. bytes
  //   const setup = [
  //     0x1f,
  //     0x28,
  //     0x66,
  //     0x11,
  //     width % 256,
  //     width / 256,
  //     heightBits % 256,
  //     heightBits / 256,
  //     0x01
  //   ];
  //   const bytes = setup.concat(bmp);
  //   // for (let i = 0; i < X * Y; i++) {
  //   //   VFD.write(bmp[i]);
  //   // }
  //   console.log(bytes);
  //   return this.writeBytes(bytes);
  // }
  // x (pixels), y (row)
  drawBitmapProper = async ({ bmp, x, y, mode }) => {
    //
    // ASSUMPTIONS (that may not be correct!)
    //
    //  - Any width is okay
    //  - It magically handles multiple rows of 8 pixels (I THINK THIS IS WRONG)
    //    Starting to think it doesn't have to be 8 pixels at all
    //   and maybe vertically it draws the full column?
    //  - You can write integers to the VFD, not just hex values
    //  - xH and yH need math.floor
    //

    /* prettier-ignore */
    // bmp = [
    //   [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    //   [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1],
    //   [1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1],
    //   [1,1,1,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1],
    //   [1,1,1,1,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1],
    //   [1,1,1,1,1,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
    //   [1,1,1,1,1,1,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1],
    //   [1,1,1,1,1,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1],
    //   [1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1],
    //   [1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1],
    //   [1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1],
    //   [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    //   [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    //   [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    //   [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1],
    //   [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1],
    //   [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    //   [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1],
    //   [1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1],
    //   [1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0,0,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1],
    //   [1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,0,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1],
    //   [1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1],
    //   [1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1],
    //   [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1],
    //   [1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,1,1,1,1,1,1,1,1],
    //   [1,1,1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1],
    //   [1,1,1,1,1,1,1,1,1,0,0,0,0,1,1,0,1,1,1,1,1,0,0,1,1,1,1,1,1,1,0,0,0,1,1,1,1,1,1,1],
    //   [1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1,1,1,0,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1],
    //   [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1],
    //   [1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1],
    // ];
    bmp = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1],
    [1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1],
    [1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1],
    [1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1],
    [1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1],
    [1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1],
    [1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1],
    [1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1],
    [1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1],
    [1,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1],
    [1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1],
    [1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1],
    [1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1],
    [1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,1,1],
    [1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,1,1],
    [1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1],
    [1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1],]

    await this.setCursor(x, y);
    // Lump it up to vertical runs of 8
    // const width = bmp[0].length;
    const width = Math.ceil(bmp[0].length / 8) * 8; // round up to nearest multiple of 8
    const height = Math.ceil(bmp.length / 8) * 8; // round up to nearest multiple of 8
    const heightBits = Math.ceil(height / 8); // because a bytes is a column
    // Force fill 0 values for whatever extra y pixels we've added
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!bmp[y]) {
          bmp[y] = Array(width).fill(0);
        }
        if (!bmp[y][x]) {
          bmp[y][x] = 0;
        }
      }
    }
    // console.log(bmp);

    if (mode == "halftone") {
      // It probably has to be like, generate the same pattern every time so it doesn't randomise
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          // Complete guess! Nailed it!
          bmp[y][x] = bmp[y][x] ? ((x + y) % 2 == 0 ? 1 : 0) : 0;
        }
      }
    }

    logBmp(bmp);

    console.log({ x, y, width, height, heightBits });

    // Convert 2D array into a single run of bytes - each being an 8 pixel column. Woooooosh!
    // let verticalRun = [];
    // for (let row = 0; row < height; row += 8) {
    //   for (let x = 0; x < width; x++) {
    //     for (let y = row; y < row + 8; y++) {
    //       verticalRun.push(bmp[y][x]);
    //       // process.stdout.write(bmp[row + y][x] ? "1" : "-");
    //       // process.stdout.write(`${x},${row + y} `);
    //     }
    //     // process.stdout.write("\n");
    //   }
    // }
    // Convert 2D array into a single run of bytes - each being the full vertical column
    let verticalRun = [];
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        verticalRun.push(bmp[y][x]);
      }
    }
    logVerticalRun(verticalRun, width, height);

    // for (let x = 0; x < width; x++) {
    //   for (let y = 0; y < height; y++) {
    //     verticalRun.push(bmp[y][x]);
    //     process.stdout.write(bmp[y][x] ? "1" : "-");
    //     // process.stdout.write(`${x},${row + y} `);
    //   }
    //   process.stdout.write("\n");
    // }
    // console.log("this is right but it goes along, drawing the vertical columns for too long horizontal when it should have popped to line below. perhaps width is being set wrong? or maybe not that at all. Like, it should indeed be going along for 16 columns.. but I mean, it must be the run right? like, it goes along okay but then the columns start beginning with the row below");
    // console.log(JSON.stringify(verticalRun));
    // verticalRun[1] = 0;
    // Convert each 8 bits into a hex byte
    let verticalRunBytes = [];
    let byteString = "";
    verticalRun.forEach((p, i) => {
      // Create a string "01010110"
      byteString += "" + p;
      if (byteString.length === 8) {
        // if 8 long, convert to integer and push to array
        // console.log(parseInt(byteString, 2));
        verticalRunBytes.push(parseInt(byteString, 2));
        // process.stdout.write("\n" + byteString);
        // process.stdout.write(" " + parseInt(byteString, 2));
        // (I think integer is probably fine, like, 0x07 is the same as 7, right?
        byteString = "";
      }
    });
    // console.log(JSON.stringify(verticalRunBytes));
    console.log("that said, it all looks legit to me up to here");
    const setup = [
      0x1f,
      0x28,
      0x66,
      0x11,
      // Pretty certain this is all correct, re apf200_r201et.pdf and http://tpcg.io/pGmbavGR
      width % 256, // xL
      Math.floor(width / 256), // xH      (added floor because.. it just must be)
      heightBits % 256, // yL
      Math.floor(heightBits / 256), // yH (added floor because.. it just must be)
      //  xL: Bit image X size lower byte ( by 1dot)
      //  xH: Bit image X size upper byte ( by 1dot)
      //  yL: Bit image Y size lower byte ( by 8dots)
      //  yH: Bit image Y size upper byte ( by 8dots)
      0x01
    ];
    const bytes = setup.concat(verticalRunBytes);
    // console.log(JSON.stringify(bytes));

    console.log(
      "This is an image a guy feeds in as an example. I don't think it's columns of 8 at all!"
    );
    /* prettier-ignore */
    let logo = [ 0xff,0xf0,0x0f,0xff,0xff,0x80,0x01,0xff,0xfe,0x00,0x00,0x7f,0xfc,0x00,0x00,0x3f,
      0xf8,0x00,0x00,0x1f,0xf0,0x00,0x00,0x0f,0xe0,0x0f,0xf0,0x07,0xc0,0x3f,0xfc,0x07,
      0xc0,0x7f,0xfe,0x03,0x80,0xff,0xff,0x01,0x81,0xff,0xff,0x01,0x81,0xff,0xff,0x81,
      0x01,0xfc,0x3f,0x81,0x03,0xfc,0x3f,0xc0,0x03,0xfc,0x3f,0xc0,0x03,0xfc,0x3f,0xc0,
      0x03,0xfc,0x3f,0xc0,0x03,0xfc,0x3f,0xc0,0x03,0xfc,0x3f,0xc0,0x03,0xfc,0x3f,0xc0,
      0x03,0xfc,0x3f,0x80,0x81,0xfc,0x3f,0x81,0x81,0xff,0xff,0x81,0x80,0xff,0xff,0x01,
      0xc0,0x7f,0xfe,0x03,0xc0,0x7f,0xfe,0x03,0xe0,0x3f,0xf8,0x07,0xf0,0x0f,0xf0,0x0f,
      0xf0,0x07,0xe0,0x1f,0xf8,0x03,0xc0,0x1f,0xfc,0x00,0x00,0x3f,0xfe,0x00,0x00,0x7f,
      0xff,0x80,0x01,0xff,0xff,0xc0,0x03,0xff,0xff,0x80,0x01,0xff,0xfe,0x00,0x00,0x7f,
      0xfe,0x00,0x00,0x7f,0xf8,0x03,0x80,0x1f,0xf0,0x07,0xe0,0x1f,0xf0,0x0f,0xf0,0x0f,
      0xe0,0x3f,0xf8,0x07,0xc0,0x7f,0xfc,0x03,0xc0,0x7f,0xfe,0x03,0x80,0xff,0xff,0x01,
      0x81,0xff,0xff,0x81,0x81,0xfc,0x3f,0x81,0x03,0xfc,0x3f,0x80,0x03,0xfc,0x3f,0xc0,
      0x03,0xe0,0x07,0xc0,0x03,0xe0,0x07,0xc0,0x03,0xe0,0x07,0xc0,0x03,0xe0,0x07,0xc0,
      0x03,0xfc,0x3f,0xc0,0x03,0xfc,0x3f,0xc0,0x01,0xfc,0x3f,0x81,0x81,0xff,0xff,0x81,
      0x81,0xff,0xff,0x81,0x80,0xff,0xff,0x01,0xc0,0x7f,0xfe,0x03,0xc0,0x1f,0xf8,0x07,
      0xe0,0x0f,0xf0,0x07,0xf0,0x00,0x00,0x0f,0xf8,0x00,0x00,0x1f,0xfc,0x00,0x00,0x3f,
      0xfe, 0x00, 0x00, 0x7f, 0xff, 0x80, 0x01, 0xff, 0xff, 0xf8, 0x1f, 0xff]
    let logoBinary = [];
    logo.forEach((byte, i) => {
      let binString = `${numberToBinary(byte, 8)}`;
      binString.split("").forEach((c, ci) => {
        logoBinary.push(parseInt(c));
      });
    });
    // console.log(logoBinary);
    // logVerticalRun(logoBinary, 64, 32);

    console.log(
      "Okay, so we've also got this whatTheFuck function.. lifted from Java docs. It looks to me to output the same as my functions (but just in an absolutely batty coding style)"
    );

    const whatTheFuckBytes = whatTheFuckIsThis(bmp, width, height);
    const whatTheFuckBytesAsVerticalRun = convertVerticalRunBytesToVerticalRun(
      whatTheFuckBytes
    );
    // console.log(JSON.stringify(whatTheFuckBytes));
    // console.log(JSON.stringify(whatTheFuckBytesAsVerticalRun));
    logVerticalRun(whatTheFuckBytesAsVerticalRun, width, height);
    // logVerticalRunBytes(whatTheFuck, 8);

    return this.writeBytes(bytes);
  };
  drawRect = async ({ x, y, width, height, mode }) => {
    console.log(":: drawRect");
    // const width = x2 - x1,
    //   height = y2 - y1;
    let bmp = [];
    //[[0, 1, 0],
    // [1, 0, 1],
    // [0, 1, 0]]
    for (let y = 0; y < height; y++) {
      bmp[y] = Array(width).fill(0);
      for (let x = 0; x < width; x++) {
        bmp[y][x] = 1;
      }
    }
    return this.drawBitmapProper({ bmp, x, y, mode });
  };
  drawRectDotty = async (x1, y1, x2, y2) => {
    // You know what'd be sick
    // Is if it kinda.. had a halftone gradient left to right?
  };
  drawProgressBar = async fraction => {
    //
  };
  drawVolumeBar = async (progress, fraction, duration) => {
    await this.echo(`${progress}`, 0, 3, 0.9);
    await this.echo(`${duration}`, 100, 3, 0.9);
    // this.drawLine(30, 3, fraction * 70);
    // this.drawRect(30, 3, 30 + fraction * 70, 3); //hmmm arrrghhh
    // this.drawRectDotty(30 + fraction * 70, 3, 70 - fraction * 70);
  };
  displaySongState = async state => {
    this.clear();
    if (state) {
      console.log(state);
      let {
        name,
        artist,
        progress_ms,
        duration_ms,
        progressFraction,
        volume_percent,
        volumeFraction
      } = state;
      await this.echo(`${name}`, 0, 0, 0.9);
      await this.echo(`${artist}`, 0, 1, 0.9);
      await this.echo(
        `${msToTime(progress_ms)} / ${msToTime(duration_ms)}`,
        0,
        2,
        0.9
      );
      await this.drawProgressBar(progressFraction);
      // await this.echo(`Volume: ${volume_percent}`, 0, 3, 0.9);
      await this.drawVolumeBar(
        msToTime(progress_ms),
        volumeFraction,
        msToTime(duration_ms)
      );
    } else {
      console.log("No song playing");
      // Myke: there's a write mixture display mode. insert style and shit
      await this.echo(`No song playing`, 0, 0, 0.9);
    }
  };
}
