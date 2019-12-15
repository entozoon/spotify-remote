//
// Noritake Itron GU140X32F-7000 140x32
// - Chars fixed at 7x8(room for 20x4), or var width with room for perhaps 30x4
// https://github.com/entozoon/noritake-vfd/
//
import Vfd from "./Vfd";
const vfd = new Vfd();

(async () => {
  await vfd
    .init()
    .catch(e => {
      console.log("Error::VFD can't init -", e);
      vfd.disable(); // continues on after this point but be reet
    })
    .then(async () => {
      await vfd.resetVFD();
      await vfd.resetFont();
      await vfd.setBrightness(5);
      await vfd.echo("Bam!", 0.9);
      // await vfd.drawLine();
    });
})();
