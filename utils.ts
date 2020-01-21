const chunk = require("lodash.chunk");

export const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export const msToTime = ms => {
  // https://stackoverflow.com/a/37770048
  let s = ~~(ms / 1000);
  return (s - (s %= 60)) / 60 + (9 < s ? ":" : ":0") + s;
};

export const bmpFillToGivenDimensions = ({ bmp, width, height }) => {
  // Force fill 0 values for whatever extra pixels we've added
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
  return bmp;
};

export const bmpToVerticalRun = ({ bmp, width, height }) => {
  let verticalRun = [];
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      verticalRun.push(bmp[y][x]);
    }
  }
  return verticalRun;
};

// 01100001 -> 48
export const binaryToNumber = binary => parseInt(binary, 2);

// [0,1,1,1,0,0,0,1] -> 0x24 (of 8 length)
export const binarychunkToByte = chunk => {
  return binaryToNumber(chunk.join(""));
};

// [0,1,1,1,0,0,0,1,0,1,0,1,0,1,0] -> [0x24, 0x10, ..]
export const runToRunBytes = ({ run, width, height }) => {
  return chunk(run, 8).map(c => binarychunkToByte(c));
};

export const logBmp = bmp => {
  const width = bmp[0].length,
    height = bmp.length;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      process.stdout.write(bmp[y][x] ? "1" : "-");
    }
    process.stdout.write("\n");
  }
};

// A -> G#m
export const humanKey = ({ key, mode }) => {
  if (key == -1) return "";
  let a = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][
    key
  ];
  let b = mode === 0 ? "m" : "";
  return `${a}${b}`;
};

// export const numberToBinary = (number, length = 0) =>
//   number.toString(2).padStart(length, "0");

// export const logVerticalRun = (run, width, height) => {
//   // for (let x = 0; x < width; x++) {
//   //   for (let y = 0; y < height; y++) {
//   //     let i = y + x * height;
//   //     // process.stdout.write(i + " ");
//   //     process.stdout.write(run[i] == 1 ? "1" : "-");
//   //   }
//   //   process.stdout.write("\n");
//   // }
//   run.forEach((r, i) => {
//     if (i % height == 0) {
//       process.stdout.write("\n");
//     }
//     process.stdout.write(`${r ? "1" : "-"}`);
//   });
// };

// export const verticalRunToVerticalRunBytes = verticalRun => {
//   let verticalRunBytes = [];
//   let byteString = "";
//   verticalRun.forEach((p, i) => {
//     // Create a string "01010110"
//     byteString += "" + p;
//     if (byteString.length === 8) {
//       // if 8 long, convert to integer and push to array
//       // console.log(parseInt(byteString, 2));
//       verticalRunBytes.push(parseInt(byteString, 2));
//       // process.stdout.write("\n" + byteString);
//       // process.stdout.write(" " + parseInt(byteString, 2));
//       // (I think integer is probably fine, like, 0x07 is the same as 7, right?
//       byteString = "";
//     }
//   });
//   return verticalRunBytes;
// };

// export const logVerticalRunBytes = (runBytes, width) => {
//   runBytes.forEach((b, i) => {
//     if (i % width == 0) {
//       process.stdout.write("\n");
//     }
//     process.stdout.write(numberToBinary(b, 8));
//     // process.stdout.write("01010101");
//   });
// };

// export const convertVerticalRunBytesToVerticalRun = verticalRun => {
//   let verticalRunBytes = [];
//   verticalRun.forEach(r => {
//     numberToBinary(r, 8)
//       .split("")
//       .forEach(c => {
//         verticalRunBytes.push(parseInt(c));
//       });
//   });
//   return verticalRunBytes;
// };

// // JAVA copy of an image drawing example code in the documentation
// export const whatTheFuckIsThis = (bmp, width, height) => {
//   let bb = []; //new Byte[width * (height / 8)];
//   for (let i = 0; i < width; i++) {
//     // console.log(i, JSON.stringify(bmp[i]));
//     for (let j = 0; j < height / 8; j++) {
//       let b2 = 0;
//       // console.log("a", { x: i, y: j * 8 + 0 });
//       if (bmp[j * 8 + 0][i] === 0) {
//         b2 = 1;
//       }
//       b2 += b2;
//       // console.log("b", { x: i, y: j * 8 + 1 });
//       if (bmp[j * 8 + 1][i] === 0) {
//         b2++;
//       }
//       b2 += b2;
//       // console.log("c", { x: i, y: j * 8 + 2 });
//       if (bmp[j * 8 + 2][i] === 0) {
//         b2++;
//       }
//       b2 += b2;
//       // console.log("d", { x: i, y: j * 8 + 3 });
//       if (bmp[j * 8 + 3][i] === 0) {
//         b2++;
//       }
//       b2 += b2;
//       // console.log("e", { x: i, y: j * 8 + 4 });
//       if (bmp[j * 8 + 4][i] === 0) {
//         b2++;
//       }
//       b2 += b2;
//       // console.log("f", { x: i, y: j * 8 + 5 });
//       if (bmp[j * 8 + 5][i] === 0) {
//         b2++;
//       }
//       b2 += b2;
//       // console.log("g", { x: i, y: j * 8 + 6 });
//       if (bmp[j * 8 + 6][i] === 0) {
//         b2++;
//       }
//       b2 += b2;
//       // console.log("h", { x: i, y: j * 8 + 7 });
//       if (bmp[j * 8 + 7][i] === 0) {
//         b2++;
//       }
//       bb[i * (height / 8) + j] = b2;
//     }
//   }
//   return bb;
// };
