import { getFileDirFromPath } from "./url-utils";

/**
 * 将文章正文中的相对图片路径转换为 `import.meta.glob` 可用的绝对路径。
 * - `./xxx.png`、`xxx.png`：相对文章文件所在目录
 * - `../xxx.png`：相对 src/content 目录
 * - 以 `/` 或 `http` 开头：返回 null（不属于内容内相对图片）
 */
export function resolveContentImageImportPath(
	filePath: string | undefined,
	src: string,
): string | null {
	if (src.startsWith("http") || src.startsWith("/")) {
		return null;
	}

	if (!src.startsWith("../")) {
		const relativePath = src.replace(/^\.\//, "");
		const dir = getFileDirFromPath(filePath || "");
		return dir
			? `/src/${dir}/${relativePath}`
			: `/src/content/${relativePath}`;
	}

	return `/src/content/${src.replace(/^\.\.\//, "")}`;
}
