"use strict";


function fromRGB(a) {
  return (
    (a > 0.04045) ?
      Math.pow((a + 0.055) / 1.055, 2.4) :
      (a / 12.92));
}

function fromRGBAtoXYZA(rgba) {
  const r = fromRGB(rgba[0] / 255) * 100;
  const g = fromRGB(rgba[1] / 255) * 100;
  const b = fromRGB(rgba[2] / 255) * 100;
  const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = r * 0.0193 + g * 0.1192 + b * 0.9505;
  return [x, y, z, rgba[3]];
}


function toRGB(a) {
  return (
    (a > 0.0031308) ?
      (Math.pow(a, 1 / 2.4) * 1.055 - 0.055) :
      (a * 12.92));
}

function fromXYZAtoRGBA(xyza) {
  const x = xyza[0] / 100;
  const y = xyza[1] / 100;
  const z = xyza[2] / 100;
  const r = Math.round(toRGB(x *  3.2406 + y * -1.5372 + z * -0.4986) * 255);
  const g = Math.round(toRGB(x * -0.9689 + y *  1.8758 + z *  0.0415) * 255);
  const b = Math.round(toRGB(x *  0.0557 + y * -0.2040 + z *  1.0570) * 255);
  return [r, g, b, xyza[3]];
}


function toU(x, y, z) {
  return (x * 4) / (x + y * 15 + z * 3);
}

function toV(x, y, z) {
  return (y * 9) / (x + y * 15 + z * 3);
}

// Observer: 2°
// Illuminant: D65
const refX =  95.047;
const refY = 100.000;
const refZ = 108.883;
const refU = toU(refX, refY, refZ);
const refV = toV(refX, refY, refZ);


function fromY(y) {
  return (
    (y > 0.008856) ?
      Math.pow(y, 1 / 3) :
      (y * 7.787 + 16 / 116));
}

function fromXYZAtoLUVA(xyza) {
  const x = xyza[0];
  const y = xyza[1];
  const z = xyza[2];
  const l = fromY(y / 100) * 116 - 16;
  const u = l * 13 * (toU(x, y, z) - refU);
  const v = l * 13 * (toV(x, y, z) - refV);
  return [l, u, v, xyza[3]];
}


function toY(y) {
  const y3 = Math.pow(y, 3);
  return (
    (y3 > 0.008856) ?
      y3 :
      ((y - 16 / 116) / 7.787));
}

function fromLUVAtoXYZA(luva) {
  const l = luva[0];
  const u = luva[1] / (l * 13) + refU;
  const v = luva[2] / (l * 13) + refV;
  const y = toY((l + 16) / 116) * 100;
  const x = -(9 * y * u) / ((u - 4) * v - u * v);
  const z = (9 * y - (15 * v * y) - (v * x)) / (3 * v);
  return [x, y, z, luva[3]];
}


function fromRGBAtoLUVA(rgba) {
  return fromXYZAtoLUVA(fromRGBAtoXYZA(rgba));
}

function fromLUVAtoRGBA(luva) {
  return fromXYZAtoRGBA(fromLUVAtoXYZA(luva));
}


function lerp(a1, a2, ratio) {
  return a1 + ratio * (a2 - a1);
}

function lerpQuad(v1, v2, ratio) {
  const a1 = v1[0];
  const b1 = v1[1];
  const c1 = v1[2];
  const d1 = v1[3];
  const a2 = v2[0];
  const b2 = v2[1];
  const c2 = v2[2];
  const d2 = v2[3];
  const a = lerp(a1, a2, ratio);
  const b = lerp(b1, b2, ratio);
  const c = lerp(c1, c2, ratio);
  const d = lerp(d1, d2, ratio);
  return [a, b, c, d];
}


function fromRGBAtoLEUint32(rgba) {
  return rgba[0] | (rgba[1] << 8) | (rgba[2] << 16) | (rgba[3] << 24);
}
  
function fromLEUint32toRGBA(int) {
  return [int & 0xFF, (int >> 8) & 0xFF, (int >> 16) & 0xFF, (int >> 24) & 0xFF];
}


module.exports = {
  fromLUVAtoRGBA: fromLUVAtoRGBA,
  fromLUVAtoXYZA: fromLUVAtoXYZA,
  
  fromRGBAtoLUVA: fromRGBAtoLUVA,
  fromRGBAtoXYZA: fromRGBAtoXYZA,
  
  fromXYZAtoLUVA: fromXYZAtoLUVA,
  fromXYZAtoRGBA: fromXYZAtoRGBA,

  lerpRGBA: lerpQuad,
  
  lerpRGBAasXYZA: function (rgba1, rgba2, ratio) {
    return (
      fromXYZAtoRGBA(
        lerpQuad(
          fromRGBAtoXYZA(rgba1),
          fromRGBAtoXYZA(rgba2),
          ratio)));
  },
  
  lerpRGBAasLUVA: function (rgba1, rgba2, ratio) {
    return (
      fromLUVAtoRGBA(
        lerpQuad(
          fromRGBAtoLUVA(rgba1),
          fromRGBAtoLUVA(rgba2),
          ratio)));
  },
  
  fromRGBAtoLEUint32: fromRGBAtoLEUint32,
  fromLEUint32toRGBA: fromLEUint32toRGBA
};
