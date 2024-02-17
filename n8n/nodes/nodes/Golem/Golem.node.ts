import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import { TaskExecutor } from '@golem-sdk/golem-js';
import * as fs from 'fs';

export class Golem implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Golem',
		name: 'golem',
		icon: 'file:golem.svg',
		group: ['apps'],
		version: 1,
		description: 'Node to make some magic',
		defaults: {
			name: 'Golem',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			// Node properties which the user gets displayed and
			// can change on the node.
			{
				displayName: 'Container',
				name: 'container',
				type: 'string',
				default: '',
				placeholder: 'Your container',
			},
			{
				displayName: 'Commands',
				name: 'golemCommands',
				placeholder: 'Add Command',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				options: [
					{
						name: 'commandsValues',
						displayName: 'Commands',
						values: [
							{
								displayName: 'Command',
								name: 'command',
								type: 'options',
								options: [
									{
										name: 'Run',
										value: 'run',
									},
									{
										name: 'Upload File',
										value: 'uploadFile',
									},
									{
										name: 'Download File',
										value: 'downloadFile',
									},
								],
								default: 'run', // The initially selected option
								description: 'Command to run',
							},
							{
								displayName: 'Command Text',
								name: 'commandText',
								type: 'string',
								default: 'echo "Hello world"', // The initially selected option
								description: 'Command to run',
								displayOptions: {
									show: {
										command: ['run'],
									},
								},
							},
							{
								displayName: 'File Input Field',
								name: 'fileInputField',
								type: 'string',
								default: 'myFile', // The initially selected option
								description: 'Field name of file in node input',
								displayOptions: {
									show: {
										command: ['uploadFile'],
									},
								},
							},
							{
								displayName: 'Field Name in Output',
								name: 'outputFieldName',
								type: 'string',
								default: '', // The initially selected option
								displayOptions: {
									show: {
										command: ['run', 'downloadFile'],
									},
								},
							},
							{
								displayName: 'Path to File',
								name: 'filePath',
								type: 'string',
								default: '', // The initially selected option
								displayOptions: {
									show: {
										command: ['downloadFile'],
									},
								},
							},
							{
								displayName: 'Mimetype of File',
								name: 'mimeType',
								type: 'string',
								default: '', // The initially selected option
								displayOptions: {
									show: {
										command: ['downloadFile'],
									},
								},
							},
							{
								displayName: 'Filetype of File',
								name: 'fileType',
								type: 'string',
								default: '', // The initially selected option
								displayOptions: {
									show: {
										command: ['downloadFile'],
									},
								},
							},
						],
					},
				],
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
				const commands = this.getNodeParameter('golemCommands', itemIndex, '') as {
					commandsValues: { command: string; commandText: string }[];
				};
				const container = this.getNodeParameter('container', itemIndex, '') as string;

				console.log(commands.commandsValues);
				// GOLEM START

				const executor = await TaskExecutor.create(container);
				try {
					await executor.run(async (ctx) => {
						for (const commandObj of commands.commandsValues) {
							if (commandObj.command === 'run') {
								const result = (await ctx.run(commandObj.commandText)).stdout;
								// @ts-ignore
								item.json[commandObj.outputFieldName] = result;
							}

							if (commandObj.command === 'uploadFile') {
								//@ts-ignore
								const inputFileField = commandObj.fileInputField;
								const file = item?.binary?.[inputFileField];
								if (!file) continue;
								const currentDirectory = process.cwd();
								//@ts-ignore
								fs.writeFileSync(file.fileName, file.data, { encoding: 'base64' });
								await ctx.uploadFile(
									`${currentDirectory}/${file.fileName}`,
									`/golem/work/${file.fileName}`,
								);

								console.log('UPLOADED');
							}

							if (commandObj.command === 'downloadFile') {
								const currentDirectory = process.cwd();
								//@ts-ignore
								const filePath = commandObj.filePath;
								const splitFilePath = filePath.split('/');
								const fileName = splitFilePath[splitFilePath.length - 1];
								await ctx.run('cp /golem/work/File.csv /golem/output/File.csv');
								await ctx.downloadFile(filePath, fileName);
								const file = fs.readFileSync(`${currentDirectory}/${fileName}`);
								//@ts-ignore
								const outputFieldName = commandObj.outputFieldName;

								item.binary = {
									...(item.binary || {}),
									[outputFieldName]: {
										//@ts-ignore
										mimeType: commandObj.mimeType,
										data: file.toString('base64'),
										//@ts-ignore
										fileType: commandObj.fileType,
										fileName: 'superFile.csv',
									},
								};
							}
						}
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
