//
// https://forum.arduino.cc/index.php?topic=198201.0
//
// import * as SerialPort from "serialport";
const SerialPort = require("serialport");
import {
  msToTime,
  bmpFillToGivenDimensions,
  runToRunBytes,
  bmpToVerticalRun,
  logBmp
} from "./utils";
// import Readline from "@serialport/parser-readline";
// const parser = new Readline();
// vfd.pipe(parser);
// parser.on("data", line => console.log(`> ${line}`)); // won't happen tbh
export default class Vdf {
  serial = null;
  initialised = false;
  disabled = false;
  progressStore;
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
    // console.log(":: echo");
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
    console.log(":: setCode", set, code);
    // Set: 0 America, 1 France, 2 Germany, 3 England, 4 Denmark 1, 5 Sweden, 6 Italy, 7 Spain1, 8 Japan, 9 Norway, 10 Denmark2, 11 Spain2, 12 Latin America, 13 Korea
    // Code: 0 PC437(USA – Euro std), 1 Katakana – Japanese, 2 PC850 (Multilingual), 3 PC860 (Portuguese), 4 PC863 (Canadian-French), 5 PC865 (Nordic), 16 WPC1252, 17 PC866 (Cyrillic #2), 18 PC852 (Latin 2), 19 PC858 ,
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
    await this.setCode(0, 0); // US (no £, but you get #)
    // await this.setCode(3, 0); // England
    await this.setKerning(2);
    return;
  }
  drawBitmapTest = async () => {
    // No explanations here, See drawBitmap
    /* prettier-ignore */
    let bmp = [
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,1,1,1,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0],
      [0,0,0,0,0,0,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0],
      [0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0],
      [0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,1,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,1,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,0,0,1,0,0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0],
    ];
    return this.drawBitmap({ bmp, x: 20, y: 0, mode: "halftone" });
  };
  // x (pixels), y (row)
  drawBitmap = async ({ bmp, x, y, mode = "normal" }) => {
    // console.log(":: drawBitmap");
    //
    // HOW IT WORKS
    // It draws vertical columns top to bottom, using a big long run of bytes.
    // You chunk these columns up into 8 pixels at a time (image must have a multiple of 8)
    // Take the binary number it represents, convert that to a byte and queue it up.
    //
    // ASSUMPTIONS (empirically correct)
    //  - Any width is okay
    //  - It magically handles multiple columns of 8 pixels
    //  - You can write integers to the VFD, not just hex values
    //  - xH and yH need math.floor
    //
    // Force a height increase to multiple of 8, with empty pixels
    const width = bmp[0].length;
    const height = Math.ceil(bmp.length / 8) * 8;
    const heightBits = Math.ceil(height / 8);
    bmp = bmpFillToGivenDimensions({ bmp, width, height });
    // console.log({ x, y, width, height, heightBits });
    if (mode == "halftone") {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          // Complete guess! Nailed it!
          bmp[y][x] = bmp[y][x] ? ((x + y) % 2 == 0 ? 1 : 0) : 0;
        }
      }
    } else if (mode == "quartertone") {
      let seed = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          bmp[y][x] = bmp[y][x] ? (++seed % 4 == 0 ? 1 : 0) : 0;
        }
      }
    } else if (mode == "random") {
      var seedrandom = require("seedrandom");
      let seed = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          bmp[y][x] = bmp[y][x]
            ? // ? Math.sin(x * 99999 + y * 99999) > 0.1
              // Math.sin((seed += 1000)) * 10000 > 0.4
              seedrandom(++seed)() > 0.7
              ? 1
              : 0
            : 0;
        }
      }
    } else if (mode == "gradient") {
      // It probably has to be like, generate the same pattern every time so it doesn't randomise
    }
    ///////////////////////
    ///////////////////////
    // logBmp(bmp);
    ///////////////////////
    ///////////////////////
    // Create array of vertical columns of pixels
    let run = bmpToVerticalRun({ bmp, width, height });
    // Chunk columns into groups of 8 pixels and convert each to a byte value
    let runBytes = runToRunBytes({ run, width, height });
    const setup = [
      0x1f,
      0x28,
      0x66,
      0x11,
      width % 256,
      Math.floor(width / 256),
      heightBits % 256,
      Math.floor(heightBits / 256),
      0x01
    ];
    const bytes = setup.concat(runBytes);
    ///////////////////////
    ///////////////////////
    // console.log(JSON.stringify(bytes));
    ///////////////////////
    ///////////////////////
    await this.setCursor(x, y);
    return this.writeBytes(bytes);
  };
  drawRect = async ({
    x,
    y, // row
    width,
    height,
    mode = "normal"
  }) => {
    // Any x and width are fine, but y is an 8px row and height is rounded up to 8 pixels and blank the rest
    let bmp = [];
    //[[0, 1, 0],
    // [1, 0, 1],
    // [0, 1, 0]]
    for (let y = 0; y < height; y++) {
      bmp[y] = Array(width).fill(mode === "invert" ? 1 : 0);
      for (let x = 0; x < width; x++) {
        bmp[y][x] = mode === "invert" ? 0 : 1;
      }
    }
    return this.drawBitmap({ bmp, x, y, mode });
  };
  drawRectDotty = async (x1, y1, x2, y2) => {
    // You know what'd be sick
    // Is if it kinda.. had a halftone gradient left to right?
  };
  drawProgressBar = async fraction => {
    //
  };
  drawVolumeBar = async (progress, fraction, duration) => {
    // await this.echo(`${progress}`, 0, 3, 0.9);
    // await this.echo(`${duration}`, 100, 3, 0.9);
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
        volumeFraction,
        key
      } = state;
      if (name) await this.echo(`${name}`, 0, 0, 1);
      if (artist) await this.echo(`${artist}`, 0, 1, 1);
      if (key) await this.echo(`Key ${key}`, 140 - 25 - key.length * 7, 2, 1);
      // Stop initial render, having issuess with progressFraction..
      // await this.displayProgress(state);

      // await this.drawProgressBar(progressFraction);
      // await this.echo(`Volume: ${volume_percent}`, 0, 3, 1);
      // await this.drawVolumeBar(
      //   msToTime(progress_ms),
      //   volumeFraction,
      //   msToTime(duration_ms)
      // );
    } else {
      console.log("No song playing");
      // Myke: there's a write mixture display mode. insert style and shit
      await this.echo(`No song playing`, 0, 0, 1);
    }
  };
  displayVolumeArray = async volumeArray => {
    let width = 140,
      height = 8;
    let bmp = []; //Array(height).fill([]);
    let volumeChunks = volumeArray.map((v, x) => {
      let chunk = [];
      for (let y = height - 1; y >= 0; y--) {
        chunk.push(y < v ? 1 : 0);
      }
      return chunk;
    });
    // console.log("volumeChunks", JSON.stringify(volumeChunks));
    for (let y = 0; y < height; y++) {
      if (!bmp[y]) bmp[y] = [];
      for (let x = 0; x < width; x++) {
        bmp[y][x] = volumeChunks[x][y] ? 1 : 0;
      }
    }
    return this.drawBitmap({ bmp, x: 0, y: 3 });
  };
  displayProgress = async ({ progress_ms, duration_ms, progressFraction }) => {
    const progressStore = `${msToTime(progress_ms)} / ${msToTime(
      duration_ms
    )}      `;
    if (this.progressStore != progressStore) {
      this.progressStore = progressStore;
      await this.echo(progressStore, 0, 2, 1);
      await this.drawProgressLine({ progressFraction });
    }
  };
  drawProgressLine = async ({ progressFraction }) => {
    await this.drawRect({
      x: 0,
      y: 3,
      width: Math.floor(progressFraction * 140) || 0,
      height: 7,
      mode: "quartertone"
    });
  };
}
