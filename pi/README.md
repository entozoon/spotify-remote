    npm start

https://medium.com/@danidudas/how-to-install-node-js-and-npm-on-any-raspberry-pi-5a82acdfeefc

sudo raspi-config
interfacing > SPI and i2c > enable those buggers, though not sure i'm using them
interfacing > serial > login shell? NO, enable interface? YES

Run this to check
    dmesg | grep tty
It should say console [tty1] enabled - not ttyAMA0


Also open up /boot/config.txt and add:

    enable_uart=1
    dtoverlay=pi3-disable-bt
