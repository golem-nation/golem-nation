import { readFileSync } from 'fs';
import { extensionToMimetypeMap } from './extensionToMimetypeMap';

export const downloadFile = async (ctx: any, filePath: string) => {
	const splitFilePath = filePath.split('/');
	const fileName = splitFilePath[splitFilePath.length - 1];
	const extension = fileName.split('.')[1];
	//@ts-ignore
	const mimeType = extensionToMimetypeMap[extension];
	const fileType = mimeType.split('/')[0];
	const currentDirectory = process.cwd();
	await ctx.downloadFile(filePath, fileName);
	const file = readFileSync(`${currentDirectory}/${fileName}`);
	return { file, mimeType, fileType, extension };
};
