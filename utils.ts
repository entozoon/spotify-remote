export const delay = t => new Promise(resolve => setTimeout(resolve, t));

export const msToTime = ms => {
  // https://stackoverflow.com/a/37770048
  let s = ~~(ms / 1000);
  return (s - (s %= 60)) / 60 + (9 < s ? ":" : ":0") + s;
};
