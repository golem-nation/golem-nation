import fs from 'fs';
import path from 'path';
import sharp from 'sharp';


const output_path = path.join('./output');
const maxWidth = process.env.MAX_WIDTH ? parseInt(process.env.MAX_WIDTH) : 640;

(() => fs.readdirSync('./input/').forEach(fileName => {
    const fileBuffer = fs.readFileSync(`./input/${fileName}`);
    sharp(fileBuffer)
        .resize(maxWidth)
        .jpeg({mozjpeg: true})
        .toFile(
            path.join(
                output_path,
                fileName
            ),
            (err) => {
                if (err === null) {
                    console.log('successfully compressed ' + fileName);
                } else {
                    throw err;
                }
            }
        );
}))()

