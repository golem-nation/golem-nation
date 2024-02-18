const whisper = require('whisper-node');
const fs = require('fs');
const path = require('path');


(async () => {
    try{
        const  input = './input/wav/audio.wav';
        const inputPath = path.resolve(__dirname, input);

        const file = await fs.readFileSync(inputPath);

        const transcript = await whisper.whisper( inputPath, {
            modelName: "base.en",       // default
            // modelPath: "/custom/path/to/model.bin", // use model in a custom directory (cannot use along with 'modelName')
            whisperOptions: {
                language: 'auto',          // default (use 'auto' for auto detect)
                gen_file_txt: false,      // outputs .txt file
                gen_file_subtitle: false, // outputs .srt file
                gen_file_vtt: false,      // outputs .vtt file
                word_timestamps: false     // timestamp for every word
                // timestamp_size: 0      // cannot use along with word_timestamps:true
            }
        });
        const result = transcript.map(item=>item.speech).join('\n');
        console.log(result);
        fs.writeFileSync(path.resolve(__dirname, './output/result.txt'), result);
    }catch (e){
        console.error(e);
    }

})();

