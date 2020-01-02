//
// Noritake Itron GU140X32F-7000 140x32
// - Chars fixed at 7x8(room for 20x4), or var width with room for perhaps 30x4
// https://github.com/entozoon/noritake-vfd/
//
import Vfd from "./Vfd";

const isDesktop = process.argv[2] && process.argv[2] === "desktop";

const test = async () => {
  const vfd = new Vfd();
  await vfd.init().catch(e => {
    console.log("Error::VFD can't init -", e);
    vfd.disable(); // continues on after this point but be reet
    if (!isDesktop) return;
  });
  await vfd.resetVFD();
  // await vfd.setInverse(); // yeah? YEAH?
  await vfd.resetFont();
  await vfd.setMixtureMode("normal");
  await vfd.setBrightness(5);
  await vfd.clear();
  await vfd.echo("Bam.", 0, 0, 0.9);
  // await vfd.setCursor(15, 1);
  // await vfd.echo("Bam...", 20, 1, 0.9);
  // await vfd.setCursor(10, 10);
  // await vfd.drawBitmapTest();
  await vfd.drawRect({ x: 0, y: 3, width: 30, height: 8, mode: "normal" });
  await vfd.drawRect({
    x: 30,
    y: 3,
    width: 30,
    height: 8,
    mode: "halftone"
  });
  await vfd.drawRect({
    x: 60,
    y: 3,
    width: 30,
    height: 8,
    mode: "quartertone"
  });
  await vfd.drawRect({
    x: 90,
    y: 3,
    width: 30,
    height: 8,
    mode: "random"
  });
  // await vfd.setCursor(15, 1);
  // await vfd.drawLine(0, 16, 0, 0);
  // await vfd.drawRectDotty(50, 16, 80, 24);
  await vfd.close();
  // await vfd.drawLine();
};
// setInterval(test, 5000);
test();
