import type { ImageMetadata } from "astro";
import { getImage } from "astro:assets";

export interface DiaryImage {
	thumb: string;
	full: string;
	width: number;
	height: number;
	alt: string;
}

const THUMB_WIDTH = 1024;
const FULL_WIDTH = 1920;

const imageModules = import.meta.glob<{ default: ImageMetadata }>(
	"/src/content/diaries/images/**/*.{jpg,jpeg,png,webp,avif,gif}",
);

const cache = new Map<string, Promise<Omit<DiaryImage, "alt"> | null>>();

// 支持 `images/xxx/1.jpg`、`./images/xxx/1.jpg`、`diaries/images/xxx/1.jpg` 及 Windows 反斜杠
function normalizePath(path: string): string {
	return path
		.trim()
		.replace(/\\/g, "/")
		.replace(/^\.?\//, "")
		.replace(/^diaries\//, "");
}

async function loadMetadata(
	normalizedPath: string,
): Promise<ImageMetadata | undefined> {
	const loader = imageModules[`/src/content/diaries/${normalizedPath}`];
	if (!loader) {
		return undefined;
	}
	return (await loader()).default;
}

async function resolveOne(
	normalizedPath: string,
): Promise<Omit<DiaryImage, "alt"> | null> {
	if (
		/^(https?:)?\/\//.test(normalizedPath) ||
		normalizedPath.startsWith("data:")
	) {
		return {
			thumb: normalizedPath,
			full: normalizedPath,
			width: 0,
			height: 0,
		};
	}

	const meta = await loadMetadata(normalizedPath);
	if (!meta) {
		console.warn(`[diary] 图片不存在，已跳过：${normalizedPath}`);
		return null;
	}

	// GIF 转为 webp 会丢失动画，直接使用原图
	if (meta.format === "gif") {
		return {
			thumb: meta.src,
			full: meta.src,
			width: meta.width,
			height: meta.height,
		};
	}

	const [thumb, full] = await Promise.all([
		getImage({
			src: meta,
			width: Math.min(THUMB_WIDTH, meta.width),
			format: "webp",
			quality: 80,
		}),
		getImage({
			src: meta,
			width: Math.min(FULL_WIDTH, meta.width),
			format: "webp",
			quality: 90,
		}),
	]);

	return {
		thumb: thumb.src,
		full: full.src,
		width: meta.width,
		height: meta.height,
	};
}

export async function resolveDiaryImages(
	paths: string[] | undefined,
	altPrefix = "日记图片",
): Promise<DiaryImage[]> {
	if (!paths || paths.length === 0) {
		return [];
	}

	const resolved = await Promise.all(
		paths.map((path) => {
			const normalizedPath = normalizePath(path);
			let promise = cache.get(normalizedPath);
			if (!promise) {
				promise = resolveOne(normalizedPath);
				cache.set(normalizedPath, promise);
			}
			return promise;
		}),
	);

	return resolved
		.map((image, index) =>
			image ? { ...image, alt: `${altPrefix} ${index + 1}` } : null,
		)
		.filter((image): image is DiaryImage => image !== null);
}
