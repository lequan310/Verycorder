// https://stackoverflow.com/questions/11541154/checking-images-for-similarity-with-opencv
import Jimp from 'jimp';
import cv, { Mat } from 'opencv-ts';

async function loadImage(image: Buffer): Promise<Mat> {
    try {
        const jimpImage = await Jimp.read(image);
        const { data, width, height } = jimpImage.bitmap;

        // Convert the Jimp image to OpenCV.js Mat
        const mat = new cv.Mat(height, width, cv.CV_8UC4);  // Assuming a 4-channel (RGBA) image
        mat.data.set(data);  // Copy data into the Mat

        return mat;
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function compareImages(image1: Buffer, image2: Buffer): Promise<number> {
    // Convert the Buffer to OpenCV Mat format
    const matImage1 = await loadImage(image1);
    const matImage2 = await loadImage(image2);

    if (matImage1 === null || matImage2 === null) {
        console.error('Failed to load images');
        return 10000;  // Returning 10000 as failure value if images are not loaded
    }

    // resize images
    // const resizedImage1 = new cv.Mat();
    // const resizedImage2 = new cv.Mat();
    // cv.resize(matImage1, resizedImage1, new cv.Size(256, 256), 0, 0, cv.INTER_AREA);
    // cv.resize(matImage2, resizedImage2, new cv.Size(256, 256), 0, 0, cv.INTER_AREA);

    // // Convert images to grayscale
    // const grayImage1 = new cv.Mat();
    // const grayImage2 = new cv.Mat();
    // cv.cvtColor(resizedImage1, grayImage1, cv.COLOR_RGBA2GRAY, 0);
    // cv.cvtColor(resizedImage2, grayImage2, cv.COLOR_RGBA2GRAY, 0);

    const vector1 = new cv.MatVector();
    const vector2 = new cv.MatVector();
    vector1.push_back(matImage1);
    vector2.push_back(matImage2);

    // Calculate histogram for both images
    const histSize = [256];
    const ranges = [0, 256];
    const channels = [0];
    const histImage1 = new cv.Mat();
    const histImage2 = new cv.Mat();
    const mask = new cv.Mat();

    cv.calcHist(vector1, channels, mask, histImage1, histSize, ranges);
    cv.calcHist(vector2, channels, mask, histImage2, histSize, ranges);

    // Compare histograms using Bhattacharyya method
    const imgHistDiff = cv.compareHist(histImage1, histImage2, cv.HISTCMP_BHATTACHARYYA);

    // Template matching
    let templateMatch = new cv.Mat();
    cv.matchTemplate(histImage1, histImage2, templateMatch, cv.TM_CCOEFF_NORMED);
    const imgTemplateProbabilityMatch = 1 - cv.minMaxLoc(templateMatch).maxVal;

    // Commutative image difference: 10% of histogram diff + template diff
    console.log(`Image difference: ${imgHistDiff / 10} + ${imgTemplateProbabilityMatch} = ${(imgHistDiff / 10) + imgTemplateProbabilityMatch}`);
    const commutativeImageDiff = (imgHistDiff / 10) + imgTemplateProbabilityMatch;

    // Clean up
    // matImage1.delete();
    // matImage2.delete();
    // resizedImage1.delete();
    // resizedImage2.delete();
    // grayImage1.delete();
    // grayImage2.delete();
    // vector1.delete();
    // vector2.delete();
    // histImage1.delete();
    // histImage2.delete();
    // mask.delete();
    // templateMatch.delete();

    // Return the commutative image difference
    return commutativeImageDiff < 1 ? commutativeImageDiff : 10000; // Returning 10000 as failure value if difference is too high
}
