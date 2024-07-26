import Jimp from "jimp";
import { getImageBuffer, getBBoxes, createOnnxSession, releaseOnnxSession, processImage } from "./src/Others/inference";

// Command to run this file for testing: npx ts-node playground.ts
createOnnxSession();

const imagePath = 'image.png';
const imgName = "image";

// Jimp.read(imgName + ".png").then((image: Jimp) => {
//     image.getBufferAsync(Jimp.MIME_PNG).then((buffer: Buffer) => {
//         processImage(buffer).then((processedImageBuffer: Jimp) => {
//             processedImageBuffer.writeAsync(imgName + "-processed.png").then(() => {
//                 console.log("Image saved");
//             });
//         });
//     });
// });

getImageBuffer(imagePath).then((buffer: Buffer) => {
    getBBoxes(buffer).then((bboxes: number[][]) => {
        console.log(bboxes);
    });
});

releaseOnnxSession();