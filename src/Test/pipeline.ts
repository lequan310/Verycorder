import 'dotenv/config'

import Jimp from "jimp";
import { getImageBuffer, getBBoxes, createOnnxSession, releaseOnnxSession, drawBoxes } from "../Others/inference";
import * as openai from "../Others/openai"
import * as fs from "fs";
import { BoundingBox } from "../Types/bbox";
import { compareImages } from '../Others/opencv';

const imagePath = '../../image.png';
const imgName = "image";

type Test = {
    name: string;
    imagePath: string;
    testClicks: [
        {
            offsetX: number | null
            offsetY: number | null
            offsetWidth: number | null,
            offsetHeight: number | null,
            x: number,
            y: number
        }
    ]
}

type Config = {
    tests: Test[];
}

function saveBuffer(buffer: Buffer, name: string) {
    let folders = name.split("/");
    for (let i = 1; i < folders.length - 1; i++) {
        let folder = folders.slice(0, i + 1).join("/");
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        }
    }
    fs.writeFileSync(name, buffer);
}

type Result = {
    resultBox: BoundingBox | null;
    caption: string | null;
    correct: boolean | null;
}

type OutputResult = {
    boundingBoxes: BoundingBox[];
}

async function main() {
    await createOnnxSession("../Models/best.onnx");

    let config: Config;
    try {
        let response = fs.readFileSync("config.json");
        config = await JSON.parse(response.toString());
    } catch (error) {
        console.error(error);
        return;
    }

    for (let test of config.tests) {
        let outputDir = `${test.name}/output`;
        console.log("Running Test:", test.name);
        let jimpImg = await Jimp.read(test.imagePath);
        let buffer = await jimpImg.getBufferAsync(Jimp.MIME_PNG);
        let { buffer: drawnBuffer, bboxes } = await drawBoxes(buffer);
        saveBuffer(drawnBuffer, `${outputDir}/drawn.png`);

        let result: Result = {
            resultBox: null,
            correct: null,
            caption: null,
        }

        let outputResult: OutputResult = {
            boundingBoxes: [],
        }

        outputResult.boundingBoxes = bboxes;

        fs.writeFileSync(`${outputDir}/boxes.json`, JSON.stringify(outputResult, null, "\t"));

        for (let j = 0; j < bboxes.length; j++) {
            let box = bboxes[j];
            let img = jimpImg.clone().crop(box.x, box.y, box.width, box.height);
            saveBuffer(await img.getBufferAsync(Jimp.MIME_PNG), `${outputDir}/boxes/${j}_${box.centerX}_${box.centerY}.png`);
        }

        for (let i = 1; i <= test.testClicks.length; ++i) {
            let clickedBox = null, topLevel = -1;
            console.log("performing test click:", i);
            let clickPosition = test.testClicks[i - 1];

            for (let j = 0; j < bboxes.length; j++) {
                let box = bboxes[j];
                if (box.contains(clickPosition.x, clickPosition.y) && box.level > topLevel) {
                    clickedBox = box;
                    topLevel = box.level;
                }
            }

            if (clickedBox) {
                let clickedJimp = jimpImg.clone().crop(clickedBox.x, clickedBox.y, clickedBox.width, clickedBox.height);

                let caption = await openai.getCaption((await clickedJimp.getBufferAsync(Jimp.MIME_PNG)).toString("base64"));
                result.caption = caption;

                let resultBox = await openai.getReplayBoundingBox(drawnBuffer, bboxes, caption);
                result.resultBox = resultBox;

                if (resultBox) {
                    let clickedBuffer = await clickedJimp.getBufferAsync(Jimp.MIME_PNG);
                    let offsetX = clickPosition.offsetX ? clickPosition.offsetX : 0;
                    let offsetY = clickPosition.offsetY ? clickPosition.offsetY : 0;
                    let offsetWidth = clickPosition.offsetHeight ? clickPosition.offsetHeight : 0;
                    let offsetHeight = clickPosition.offsetHeight ? clickPosition.offsetHeight : 0;
                    let resultJimp = jimpImg.clone().crop(resultBox.x + offsetX, resultBox.y + offsetY, resultBox.width + offsetWidth, resultBox.height + offsetHeight);
                    let resultBuffer = await resultJimp.getBufferAsync(Jimp.MIME_PNG);

                    let score = await compareImages(clickedBuffer, resultBuffer);

                    console.log("compare score", score);

                    result.correct = score < 1;

                    clickedJimp.write(`${outputDir}/click${i}/clicked.png`);
                    resultJimp.write(`${outputDir}/click${i}/result.png`);
                } else {
                    console.log("result box not found");
                }
            } else {
                console.log("clicked box not found");
            }

            fs.writeFileSync(`${outputDir}/click${i}/result.json`, JSON.stringify(result, null, "\t"));
        }
    }

    await releaseOnnxSession();
}

main().then(() => {
    console.log("Done");
}).catch((error) => {
    console.error(error);
});

