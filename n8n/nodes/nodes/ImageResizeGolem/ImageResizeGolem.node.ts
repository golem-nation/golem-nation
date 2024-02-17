import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import { TaskExecutor } from '@golem-sdk/golem-js';
import * as fs from 'fs';
import { extensionToMimetypeMap } from './extensionToMimetypeMap';

const downloadFile = async (ctx: any, filePath: string) => {
	const splitFilePath = filePath.split('/');
	const fileName = splitFilePath[splitFilePath.length - 1];
	const extension = fileName.split('.')[1];
	//@ts-ignore
	const mimeType = extensionToMimetypeMap[extension];
	const fileType = mimeType.split('/')[0];
	const currentDirectory = process.cwd();
	await ctx.downloadFile(filePath, fileName);
	const file = fs.readFileSync(`${currentDirectory}/${fileName}`);
	return { file, mimeType, fileType, extension };
};

const uploadFile = async (ctx: any, file: any, path: string) => {
	const currentDirectory = process.cwd();
	fs.writeFileSync(file.fileName, file.data, { encoding: 'base64' });
	await ctx.uploadFile(`${currentDirectory}/${file.fileName}`, `${path}/myFile.jpg`);
};

export class ImageResizeGolem implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Image Resize with Golem',
		name: 'imageResizeGolem',
		icon: 'file:golem.svg',
		group: ['apps'],
		version: 1,
		description: 'Node to make some magic',
		defaults: {
			name: 'Image Resize with Golem',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Max Width (in pixels)',
				name: 'maxWidth',
				type: 'number',
				default: '128',
				placeholder: 'Max Width',
			},
		],
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
					'f9f654e383127489af46d2aedea8df62e0d05b8299a95c68debb7578',
				);
				try {
					await executor.run(async (ctx) => {
						//@ts-ignore
						const videoFile = item.binary.data;
						const maxWidth = this.getNodeParameter('maxWidth', itemIndex, '') as number;

						await uploadFile(ctx, videoFile, '/golem/work/input');
						await ctx.run(`MAX_WIDTH=${maxWidth} npm run start && cd ./output && ls -la`);

						const { file, fileType, extension, mimeType } = await downloadFile(
							ctx,
							'/golem/work/output/myFile.jpg',
						);

						item.binary = {
							...(item.binary || {}),
							resizedFile: {
								mimeType: mimeType,
								data: file.toString('base64'),
								fileType: fileType,
								fileName: `resizedImage.${extension}`,
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
