import { getCollection, type CollectionEntry } from "astro:content";

export interface DiaryItem {
	id: string;
	content: string;
	date: string;
	images: string[];
	location?: string;
	mood?: string;
	tags: string[];
	entry: CollectionEntry<"diaries">;
}

export interface DiaryStats {
	total: number;
	hasImages: number;
	hasLocation: number;
	hasMood: number;
	imagePercentage: number;
	locationPercentage: number;
	moodPercentage: number;
}

function toDiaryItem(entry: CollectionEntry<"diaries">): DiaryItem {
	return {
		id: entry.id,
		content: (entry.body ?? "").trim(),
		date: entry.data.published.toISOString(),
		images: entry.data.images,
		location: entry.data.location || undefined,
		mood: entry.data.mood || undefined,
		tags: entry.data.tags,
		entry,
	};
}

async function getAllDiaries(): Promise<DiaryItem[]> {
	const entries = await getCollection("diaries");

	return entries
		.map(toDiaryItem)
		.sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
		);
}

// 获取日记统计数据
export const getDiaryStats = async (): Promise<DiaryStats> => {
	const diaryData = await getAllDiaries();
	const total = diaryData.length;
	const hasImages = diaryData.filter((item) => item.images.length > 0).length;
	const hasLocation = diaryData.filter((item) => item.location).length;
	const hasMood = diaryData.filter((item) => item.mood).length;

	const percentage = (count: number) =>
		total > 0 ? Math.round((count / total) * 100) : 0;

	return {
		total,
		hasImages,
		hasLocation,
		hasMood,
		imagePercentage: percentage(hasImages),
		locationPercentage: percentage(hasLocation),
		moodPercentage: percentage(hasMood),
	};
};

// 获取日记列表（按时间倒序）
export const getDiaryList = async (limit?: number): Promise<DiaryItem[]> => {
	const sortedData = await getAllDiaries();

	if (limit && limit > 0) {
		return sortedData.slice(0, limit);
	}

	return sortedData;
};

// 获取最新的日记
export const getLatestDiary = async (): Promise<DiaryItem | undefined> => {
	return (await getDiaryList(1))[0];
};

// 根据ID获取日记
export const getDiaryById = async (
	id: string,
): Promise<DiaryItem | undefined> => {
	return (await getAllDiaries()).find((item) => item.id === id);
};

// 获取包含图片的日记
export const getDiaryWithImages = async (): Promise<DiaryItem[]> => {
	return (await getAllDiaries()).filter((item) => item.images.length > 0);
};

// 根据标签筛选日记
export const getDiaryByTag = async (tag: string): Promise<DiaryItem[]> => {
	return (await getAllDiaries()).filter((item) => item.tags.includes(tag));
};

// 获取所有标签
export const getAllTags = async (): Promise<string[]> => {
	const tags = new Set<string>();
	(await getAllDiaries()).forEach((item) => {
		item.tags.forEach((tag) => tags.add(tag));
	});
	return Array.from(tags).sort();
};

export default getAllDiaries;
