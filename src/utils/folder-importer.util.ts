import fs from 'fs/promises';
import path from 'path';

export async function folderImport<T extends {default?: any} & any>(folder: string, folderPath: string = path.join(import.meta.dirname, '../', folder)): Promise<T[]> {
    try {
        const files = await fs.readdir(folderPath, {withFileTypes: true});
        const exports: T[] = [];

        for (const file of files) {
            if (file.isFile() && file.name.endsWith('.ts')) {
                exports.push(await import(path.join(file.parentPath, file.name)));
            } else if (file.isDirectory()) {
                exports.push(...(await folderImport<T>(file.name, path.join(file.parentPath, file.name))));
            }
        }

        return exports;
    } catch (err) {
        throw err;
    }
}
