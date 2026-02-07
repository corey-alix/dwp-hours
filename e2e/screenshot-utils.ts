import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';

/**
 * Computes the number of pixels that differ significantly between two RGBA buffers.
 * @param data1 First image RGBA data
 * @param data2 Second image RGBA data
 * @param colorThreshold Max allowed difference per channel (0-255)
 * @returns Number of differing pixels
 */
export function computePixelDiff(data1: Uint8Array, data2: Uint8Array, colorThreshold: number = 25): number {
  if (data1.length !== data2.length) throw new Error('Buffers must be same length');
  let diffCount = 0;
  for (let i = 0; i < data1.length; i += 4) {
    const rDiff = Math.abs(data1[i] - data2[i]);
    const gDiff = Math.abs(data1[i + 1] - data2[i + 1]);
    const bDiff = Math.abs(data1[i + 2] - data2[i + 2]);
    const aDiff = Math.abs(data1[i + 3] - data2[i + 3]);
    const maxDiff = Math.max(rDiff, gDiff, bDiff, aDiff);
    if (maxDiff > colorThreshold) diffCount++;
  }
  return diffCount;
}

/**
 * Compares a new screenshot buffer to the baseline PNG at the given path.
 * If the number of significantly differing pixels exceeds the threshold, updates the baseline.
 * Always saves if no baseline exists.
 * @param newBuffer The new screenshot buffer from page.screenshot()
 * @param baselinePath Path to the baseline PNG file
 * @param colorThreshold Max allowed difference per color channel (0-255, default 25)
 * @param pixelThreshold Max allowed differing pixels (default 1000)
 */
export async function compareAndUpdateScreenshot(
  newBuffer: Buffer,
  baselinePath: string,
  colorThreshold: number = 25,
  pixelThreshold: number = 1000
): Promise<void> {
  const baselineExists = fs.existsSync(baselinePath);

  if (!baselineExists) {
    fs.writeFileSync(baselinePath, newBuffer);
    console.log(`Created baseline: ${baselinePath}`);
    return;
  }

  const baselineBuffer = fs.readFileSync(baselinePath);

  try {
    const newPng = PNG.sync.read(newBuffer);
    const baselinePng = PNG.sync.read(baselineBuffer);

    if (newPng.width !== baselinePng.width || newPng.height !== baselinePng.height) {
      console.warn(`Dimensions differ (${newPng.width}x${newPng.height} vs ${baselinePng.width}x${baselinePng.height}), updating baseline: ${baselinePath}`);
      fs.writeFileSync(baselinePath, newBuffer);
      return;
    }

    const diffCount = computePixelDiff(newPng.data, baselinePng.data, colorThreshold);

    if (diffCount > pixelThreshold) {
      fs.writeFileSync(baselinePath, newBuffer);
      console.log(`Updated baseline (${diffCount} pixels differed): ${baselinePath}`);
    } else {
      console.log(`No significant change (${diffCount} pixels): ${baselinePath}`);
    }
  } catch (error) {
    console.error(`Error comparing screenshots: ${error}`);
    // Fallback: update baseline on error
    fs.writeFileSync(baselinePath, newBuffer);
  }
}