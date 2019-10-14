#include <Arduino.h>
#include <SpotifyClient.h>

void setup()
{
  Serial.begin(115200);

  delay(5000);

  Serial.println("Let's do this");

  boolean mounted = SPIFFS.begin();

  if (!mounted)
  {
    Serial.println("FS not formatted. Doing that now");
    SPIFFS.format();
    Serial.println("FS formatted");
    SPIFFS.begin();
  }

  File f = SPIFFS.open("/test.txt", "r");

  // Read
  if (!f)
  {
    Serial.println("Failed to open test file");
  }
  while (f.available())
  {
    //Lets read line by line from the file
    String token = f.readStringUntil('\r');
    Serial.printf("test file contents: %s\n", token.c_str());
    f.close();
  }

  // Write
  File fil = SPIFFS.open("/test.txt", "w+");
  fil.println("TEST\n");
  Serial.println("Writing to spaff");
  fil.close();
}
void loop()
{
}