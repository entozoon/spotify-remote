export const delay = t => new Promise(resolve => setTimeout(resolve, t));

export const msToTime = ms => {
  // https://stackoverflow.com/a/37770048
  let s = ~~(ms / 1000);
  return (s - (s %= 60)) / 60 + (9 < s ? ":" : ":0") + s;
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

export const numberToBinary = (number, length = 0) =>
  number.toString(2).padStart(length, "0");

export const logVerticalRun = (run, width, height) => {
  // for (let x = 0; x < width; x++) {
  //   for (let y = 0; y < height; y++) {
  //     let i = y + x * height;
  //     // process.stdout.write(i + " ");
  //     process.stdout.write(run[i] == 1 ? "1" : "-");
  //   }
  //   process.stdout.write("\n");
  // }
  run.forEach((r, i) => {
    if (i % height == 0) {
      process.stdout.write("\n");
    }
    process.stdout.write(`${r ? "1" : "-"}`);
  });
};

export const logVerticalRunBytes = (runBytes, width) => {
  runBytes.forEach((b, i) => {
    if (i % width == 0) {
      process.stdout.write("\n");
    }
    process.stdout.write(numberToBinary(b, 8));
    // process.stdout.write("01010101");
  });
};

export const convertVerticalRunBytesToVerticalRun = verticalRun => {
  let verticalRunBytes = [];
  verticalRun.forEach(r => {
    numberToBinary(r, 8)
      .split("")
      .forEach(c => {
        verticalRunBytes.push(parseInt(c));
      });
  });
  return verticalRunBytes;
};

export const whatTheFuckIsThis = (bmp, width, height) => {
  let bb = []; //new Byte[width * (height / 8)];
  for (let i = 0; i < width; i++) {
    // console.log(i, JSON.stringify(bmp[i]));
    for (let j = 0; j < height / 8; j++) {
      let b2 = 0;
      // console.log("a", { x: i, y: j * 8 + 0 });
      if (bmp[j * 8 + 0][i] === 0) {
        b2 = 1;
      }
      b2 += b2;
      // console.log("b", { x: i, y: j * 8 + 1 });
      if (bmp[j * 8 + 1][i] === 0) {
        b2++;
      }
      b2 += b2;
      // console.log("c", { x: i, y: j * 8 + 2 });
      if (bmp[j * 8 + 2][i] === 0) {
        b2++;
      }
      b2 += b2;
      // console.log("d", { x: i, y: j * 8 + 3 });
      if (bmp[j * 8 + 3][i] === 0) {
        b2++;
      }
      b2 += b2;
      // console.log("e", { x: i, y: j * 8 + 4 });
      if (bmp[j * 8 + 4][i] === 0) {
        b2++;
      }
      b2 += b2;
      // console.log("f", { x: i, y: j * 8 + 5 });
      if (bmp[j * 8 + 5][i] === 0) {
        b2++;
      }
      b2 += b2;
      // console.log("g", { x: i, y: j * 8 + 6 });
      if (bmp[j * 8 + 6][i] === 0) {
        b2++;
      }
      b2 += b2;
      // console.log("h", { x: i, y: j * 8 + 7 });
      if (bmp[j * 8 + 7][i] === 0) {
        b2++;
      }
      bb[i * (height / 8) + j] = b2;
    }
  }
  return bb;
};
