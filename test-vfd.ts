//
// Noritake Itron GU140X32F-7000 140x32
// - Chars fixed at 7x8(room for 20x4), or var width with room for perhaps 30x4
// https://github.com/entozoon/noritake-vfd/
//
import Vfd from "./Vfd";
const test = async () => {
  const vfd = new Vfd();
  await vfd.init();
  await vfd.resetVFD();
  await vfd.resetFont();
  await vfd.setMixtureMode("normal");
  await vfd.setBrightness(5);
  await vfd.echo("Bam", 0, 0, 0.9);
  await vfd.setCursor(15, 1);
  await vfd.echo("Bam..", 20, 2, 0.9);
  await vfd.close();
  // await vfd.drawLine();
};
// setInterval(test, 5000);
test();
