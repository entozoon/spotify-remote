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

export const logVerticalRun = (run, width, height) => {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let i = y * width + x;
      // process.stdout.write(i + " ");
      process.stdout.write(run[i] ? "1" : "-");
    }
    process.stdout.write("\n");
  }
};
