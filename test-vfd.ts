//
// Noritake Itron GU140X32F-7000 140x32
// - Chars fixed at 7x8(room for 20x4), or var width with room for perhaps 30x4
// https://github.com/entozoon/noritake-vfd/
//
import Vfd from "./Vfd";
const vfd = new Vfd();

(async () => {
  await vfd.init();
  await vfd.resetVFD();
  await vfd.resetFont();
  await vfd.setBrightness(5);
  await vfd.echo("Bam!", 0.9);
  await vfd.setCursor(5, 2);
  await vfd.echo("Bam!", 0.9);
  // await vfd.drawLine();
})();
