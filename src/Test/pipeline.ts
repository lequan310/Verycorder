import 'dotenv/config'

import Jimp from "jimp";
import { createOnnxSession, releaseOnnxSession, getAndDrawBoxes, drawBoxes } from "../Others/inference";
import * as openai from "../Others/openai"
import * as fs from "fs";
import { BoundingBox } from "../Types/bbox";
import { saveData } from '../Others/file';
import { getSimilarityScoreFrom2Locator } from '../Others/transformers';

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


type Result = {
    resultBox: BoundingBox | null;
    caption: string | null;
    correct: boolean | null;
    score: number | null;
}

type OutputResult = {
    boundingBoxes: BoundingBox[];
}

const pathPrefix = "./src/Test";

async function main() {
    await createOnnxSession("./src/Models/best.onnx");

    let config: Config;
    try {
        const response = fs.readFileSync(`${pathPrefix}/config.json`);
        config = await JSON.parse(response.toString());
    } catch (error) {
        console.error(error);
        return;
    }

    for (const test of config.tests) {
        const outputDir = `${pathPrefix}/${test.name}/output`;
        console.log("Running Test:", test.name);
        const jimpImg = await Jimp.read(`${pathPrefix}/${test.imagePath}`);
        jimpImg.resize(1248, Jimp.AUTO);
        const buffer = await jimpImg.getBufferAsync(Jimp.MIME_PNG);
        const { buffer: drawnBuffer, bboxes } = await getAndDrawBoxes(buffer);
        const logDrawnBuffer = await drawBoxes(buffer, bboxes, true);
        saveData(`${outputDir}/drawn.png`, logDrawnBuffer);

        const result: Result = {
            resultBox: null,
            correct: null,
            score: null,
            caption: null,
        }

        const outputResult: OutputResult = {
            boundingBoxes: [],
        }

        outputResult.boundingBoxes = bboxes;

        saveData(`${outputDir}/boxes.json`, JSON.stringify(outputResult, null, "\t"));

        for (let j = 0; j < bboxes.length; j++) {
            const box = bboxes[j];
            const img = jimpImg.clone().crop(box.x, box.y, box.width, box.height);
            saveData(`${outputDir}/boxes/${j}_${box.centerX}_${box.centerY}.png`, (await img.getBufferAsync(Jimp.MIME_PNG)));
        }

        for (let i = 1; i <= test.testClicks.length; ++i) {
            let clickedBox = null, topLevel = -1;
            console.log("performing test click:", i);
            const clickPosition = test.testClicks[i - 1];

            for (let j = 0; j < bboxes.length; j++) {
                const box = bboxes[j];
                if (box.contains(clickPosition.x, clickPosition.y) && box.level > topLevel) {
                    clickedBox = box;
                    topLevel = box.level;
                }
            }

            if (clickedBox) {
                const clickedJimp = jimpImg.clone().crop(clickedBox.x, clickedBox.y, clickedBox.width, clickedBox.height);
                const clickedBuffer = await clickedJimp.getBufferAsync(Jimp.MIME_PNG);
                saveData(`${outputDir}/click${i}/clicked.png`, clickedBuffer);

                const caption = await openai.getCaption((await clickedJimp.getBufferAsync(Jimp.MIME_PNG)).toString("base64"));
                result.caption = caption;

                const resultBox = await openai.getReplayBoundingBox(drawnBuffer, bboxes, caption);
                result.resultBox = resultBox;

                if (resultBox) {
                    const offsetX = clickPosition.offsetX ? clickPosition.offsetX : 0;
                    const offsetY = clickPosition.offsetY ? clickPosition.offsetY : 0;
                    const offsetWidth = clickPosition.offsetHeight ? clickPosition.offsetHeight : 0;
                    const offsetHeight = clickPosition.offsetHeight ? clickPosition.offsetHeight : 0;
                    const resultJimp = jimpImg.clone().crop(resultBox.x + offsetX, resultBox.y + offsetY, resultBox.width + offsetWidth, resultBox.height + offsetHeight);
                    const resultBuffer = await resultJimp.getBufferAsync(Jimp.MIME_PNG);

                    // const score = await compareImages(clickedBuffer, resultBuffer);
                    // const score = await getSimilarityScoreFromLocator(caption, resultBuffer);
                    const resultCaption = await openai.getCaption((await resultJimp.getBufferAsync(Jimp.MIME_PNG)).toString("base64"));
                    const score = await getSimilarityScoreFrom2Locator(caption, resultCaption);

                    console.log("simularity score:", score);

                    result.score = score;
                    result.correct = score > 0.8;

                    saveData(`${outputDir}/click${i}/result.png`, resultBuffer);
                } else {
                    console.log("result box not found");
                }
            } else {
                console.log("clicked box not found");
            }

            saveData(`${outputDir}/click${i}/result.json`, JSON.stringify(result, null, "\t"));
        }
    }

    await releaseOnnxSession();
}

main().then(() => {
    console.log("Done");
}).catch((error) => {
    console.error(error);
});

