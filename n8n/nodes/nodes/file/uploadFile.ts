import { writeFileSync } from 'fs';

export const uploadFile = async (ctx: any, file: any, fileName: string, path: string) => {
	const currentDirectory = process.cwd();
	writeFileSync(file.fileName, file.data, { encoding: 'base64' });
	await ctx.uploadFile(`${currentDirectory}/${file.fileName}`, `${path}/${fileName}`);
};
