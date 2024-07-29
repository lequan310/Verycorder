import 'dotenv/config'

import Jimp from "jimp";
import { getLocator, getBoundingBoxes, drawBoxes, identifyElement } from "./src/Others/inference"


// const imgName = "image";
// Jimp.read(imgName + ".png").then((image: Jimp) => {
//     image.getBufferAsync(Jimp.MIME_PNG).then((buffer: Buffer) => {
//         let startTime = Date.now();

        // processImage(buffer, "./src/Models/best.onnx").then((processedImageBuffer: Jimp) => {
        //     processedImageBuffer.writeAsync(imgName + "-processed.png").then(() => {
        //         console.log("Image saved");
        //         console.log("Time taken: ", Date.now() - startTime, "ms");
        //     });
        // });


        // getLocator(buffer).then((caption: string) => {
        //     console.log(caption);
        //     console.log("Time taken: ", Date.now() - startTime, "ms");
        // });


//     });
// });


async function main(){

    const imagePath = "image.png"
    const image = await Jimp.read(imagePath)
    const buffer = await image.getBufferAsync(Jimp.MIME_PNG)
    const boxes = await getBoundingBoxes(buffer, "./src/Models/best.onnx")

    const boxedImage = await drawBoxes(buffer, boxes)

    const jimpImage = await Jimp.read(boxedImage)
    jimpImage.write("image-processed.png")

    const downloadButtonPath = "download.png";
    const downloadButton = await Jimp.read(downloadButtonPath)
    const locator = await getLocator(await downloadButton.getBufferAsync(Jimp.MIME_PNG))

    const element = await identifyElement(buffer, locator)

    console.log(element)
}

main()

// const imgName = "image";
// Jimp.read(imgName + ".png").then((image: Jimp) => {
//     image.getBufferAsync(Jimp.MIME_PNG).then((buffer: Buffer) => {
//         let startTime = Date.now();
//         getLocator(buffer).then((caption: string) => {
//             console.log(caption);
//             console.log("Time taken: ", Date.now() - startTime, "ms");
//         });
//     }
//     );
// });
