import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import { TaskExecutor } from '@golem-sdk/golem-js';
import * as fs from 'fs';

const uploadFile = async (ctx: any, file: any, path: string) => {
	const currentDirectory = process.cwd();
	fs.writeFileSync(file.fileName, file.data, { encoding: 'base64' });
	await ctx.uploadFile(`${currentDirectory}/${file.fileName}`, `${path}/audio.mp3`);
};

export class WhisperGolem implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Create subtitles from video with Golem and Whisper',
		name: 'whisperGolem',
		icon: 'file:golem.svg',
		group: ['apps'],
		version: 1,
		description: 'Node to make some magic',
		defaults: {
			name: 'Create subtitles from video with Golem and Whisper',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [],
	};

	// The function below is responsible for actually doing whatever this node
	// is supposed to do. In this case, we're just appending the `myString` property
	// with whatever the user has entered.
	// You can make async calls and use `await`.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		let item: INodeExecutionData;

		// Iterates over all input items and add the key "myString" with the
		// value the parameter "myString" resolves to.
		// (This could be a different value for each item in case it contains an expression)
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				item = items[itemIndex];

				// GOLEM START

				const executor = await TaskExecutor.create(
					'90de9dc0e6bb94a7c88d14a34c1b2637b3a5527afc06bd53e3b5a608',
				);
				try {
					await executor.run(async (ctx) => {
						//@ts-ignore
						const audioFile = item.binary.data;

						await uploadFile(ctx, audioFile, '/golem/work/input');

						await ctx.run(
							'mkdir /golem/work/input/wav && ffmpeg -i /golem/work/input/audio.mp3 -ar 16000 /golem/work/input/wav/audio.wav',
						);

						await ctx.run('ls -la && cd ./input && ls -la && cd ./wav && ls -la');
						const result = (await ctx.run('npm run start')).stdout as string;

						const subtitles = result
							// @ts-ignore
							.split('\n')
							.slice(5)
							.filter((line: string) => line !== '' && line[0] !== '[')
							.join('\n');

						item.json['subtitles'] = subtitles;

						console.log('DONE');
					});
				} catch (error) {
					console.error('Computation failed:', error);
				} finally {
					await executor.shutdown();
					console.log('SHUTDOWN');
				}

				// GOLEM END
			} catch (error) {
				// This node should never fail but we want to showcase how
				// to handle errors.
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					// Adding `itemIndex` allows other workflows to handle this error
					if (error.context) {
						// If the error thrown already contains the context property,
						// only append the itemIndex
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return this.prepareOutputData(items);
	}
}
