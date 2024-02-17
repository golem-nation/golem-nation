import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';


dotenv.config();
ffmpeg.setFfmpegPath(ffmpegPath.path);

const videosDir = './videos';
const audiosDir = './audios';

if (!fs.existsSync(audiosDir)) {
    fs.mkdirSync(audiosDir);
}

fs.readdir(videosDir, (err, files) => {
    if (err) {
        return console.error(`Error reading directory: ${err}`);
    }

    files.forEach(file => {
        if (file.endsWith('.mp4') || file.endsWith('.avi') || file.endsWith('.mov')) {
            const inputPath = path.join(videosDir, file);
            const outputPath = path.join(audiosDir, `${path.basename(file, path.extname(file))}.mp3`);

            ffmpeg(inputPath)
                .outputOptions('-vn', '-ab', '128k', '-ar', '44100')
                .toFormat('mp3')
                .save(outputPath)
                .on('error', (err) => console.error(`Error converting file: ${err}`))
                .on('end', () => console.log(`Converted ${file}`));
        }
    });
});
