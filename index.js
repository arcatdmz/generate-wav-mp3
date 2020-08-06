import tone from "tonegenerator";
import header from "waveheader";
import { Mp3Encoder } from "lamejs";
import { openSync, writeFileSync, closeSync, writeSync } from "fs";

let time;

// Define options and tones
time = new Date().getTime();
const options = {
  channels: 1,
  sampleRate: 44100,
  bitDepth: 16,
};
const tone1 = tone({ freq: 440, lengthInSecs: 2, volume: 15000 });
const tone2 = tone({ freq: 554.37, lengthInSecs: 2, volume: 7000 });
const tone3 = tone({ freq: 659.26, lengthInSecs: 2, volume: 7000 });

// Play tones sequentially
const wavBuf = tone1.concat(tone2, tone3);

// Play tones simultaneously (play a chord)
for (let i = 0; i < tone1.length; i++) {
  wavBuf.push(tone1[i] + tone2[i] + tone3[i]);
}

// Generate data buffer
const int16Arr = Int16Array.from(wavBuf);
const size = int16Arr.length * 2;
const headerBuffer = header(size, options);
const dataBuffer = Buffer.allocUnsafe(size);
int16Arr.forEach((value, index) => dataBuffer.writeInt16LE(value, index * 2));

// Save as wav file
const wavFile = openSync("example.wav", "w");
writeFileSync(wavFile, headerBuffer);
writeFileSync(wavFile, dataBuffer);
closeSync(wavFile);
time = new Date().getTime() - time;
console.log("generate and save wav tones done in", time, "[ms]");

// Prepare for MP3 encoding
time = new Date().getTime();
const samples = new Int16Array(dataBuffer.buffer);
const lameEnc = new Mp3Encoder(options.channels, options.sampleRate, 64);
const maxSamples = 1152;

// Encode data and save as mp3 file
const fd = openSync("example.mp3", "w");
let remaining = samples.length;
for (let i = 0; remaining >= maxSamples; i += maxSamples) {
  const left = samples.subarray(i, i + maxSamples);
  const mp3buf = lameEnc.encodeBuffer(left);
  if (mp3buf.length > 0) {
    writeSync(fd, Buffer.from(mp3buf), 0, mp3buf.length);
  }
  remaining -= maxSamples;
}
const mp3buf = lameEnc.flush();
if (mp3buf.length > 0) {
  writeSync(fd, Buffer.from(mp3buf), 0, mp3buf.length);
}
closeSync(fd);
time = new Date().getTime() - time;
console.log("encode wav to mp3 done in", time, "[ms]");
