import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import { TaskExecutor } from '@golem-sdk/golem-js';
import { uploadFile } from '../file/uploadFile';
import { downloadFile } from '../file/downloadFile';

export class SilenceRemoverGolem implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Silence Remover with Golem',
		name: 'silenceRemoverGolem',
		icon: 'file:golem.svg',
		group: ['apps'],
		version: 1,
		description: 'Remove all the awkward silence from your video',
		defaults: {
			name: 'Silence Remover with Golem',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		let item: INodeExecutionData;

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				item = items[itemIndex];

				// GOLEM START
				const executor = await TaskExecutor.create(
					'31f4e90fa733ae4a272b240ce667f0b3f372edee1c62ce5346dd82ad',
				);
				try {
					await executor.run(async (ctx) => {
						//@ts-ignore
						const videoFile = item.binary.data;

						await uploadFile(ctx, videoFile, 'video.mp4', '/golem/work/input');

						await ctx.run(
							'python main.py --input /golem/work/input --output /golem/work/output --ss 100 --thread 5',
						);

						const { file, extension, mimeType } = await downloadFile(
							ctx,
							'/golem/work/output/video.mp4',
						);

						item.binary = {
							...(item.binary || {}),
							data: {
								mimeType: mimeType,
								data: file.toString('base64'),
								fileType: 'video',
								fileName: `videoFile.${extension}`,
							},
						};

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
