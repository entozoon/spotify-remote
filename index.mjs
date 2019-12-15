//
// Noritake Itron GU140X32F-7000
//
import Vfd from "./Vfd";
import { delay } from "./utils";
const vfd = new Vfd();

let corporeallyReady = false;

async function corporeal() {
  await vfd.init();
  await vfd.resetVFD();
  await vfd.resetFont();
  await vfd.setBrightness(5);
  await vfd.drawLine();
  await vfd.echo("Bam!");
}
corporeal().catch(e => {
  console.error("Error", e);
});

async function cerebral() {
  await thinkingAboutStuff();
  if (corporeallyReady) {
    displayStuff();
  }
}
setInterval(cerebral, 5000);

// vfd
//   .init()
//   .then(() => delay(10000))
//   // .then(() => vfd.drawBitmap([], 0, 0))
//   // .then(() => delay(3000))
//   .then(() => vfd.echo("Moving on.", 0.9))
//   .then(() => vfd.drawBitmap([], 0, 0))
//   .then(() => delay(3000))
//   .then(() => vfd.setKerning(2))
//   .then(() =>
//     vfd.echo(
//       "Many that live deserve death. And some that die deserve life. Can you give it to them? Then do not be eager to deal out death in judgement. For even the very wise cannot see all ends.",
//       0.95
//     )
//   )
//   .catch(console.error)
//   .then(() => delay(3000))
//   .then(() => vfd.clear())
//   .then(() => {
//     console.log("Exiting");
//     process.exit();
//   }, 10000);
