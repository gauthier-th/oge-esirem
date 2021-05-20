import fetch from 'node-fetch';
import { parse } from 'node-html-parser';

const bilanUrl = 'https://iutdijon.u-bourgogne.fr/oge-esirem/stylesheets/etu/bilanEtu.xhtml';

export type EtuResponse<T> = {
	response: T;
	viewState?: string;
};
export interface MatiereCategorie {
	infos?: MatiereInfos;
	categories?: { [key: string]: MatiereCategorie };
};
export type MatiereInfos = {
	matiere: string;
	coef: number;
	notes?: string;
	moy?: number;
	moyClasse?: number;
	moyMin?: number;
	rang?: number;
};

async function bilanEtu(html: string): Promise<MatiereCategorie> {
	const extractedHtml = `<tbody id="mainBilanForm:treeTable_data">${html}</div>`;
	const root = parse(extractedHtml);
	const tbody = root.querySelector('tbody[id="mainBilanForm:treeTable_data"]');
	if (!tbody)
		throw 'Unable to find grades (parse)';

	const result: MatiereCategorie = {};
	const levels: string[] = [];
	for (let row of tbody.childNodes) {
		// @ts-ignore
		const classes: string[] = Array.from(row.classList.values());

		let level;
		for (let cls of classes) {
			const match = cls.match(/ui-node-level-(\d+)/);
			if (match && match[1]) {
				level = parseInt(match[1], 10);
				break;
			}
		}
		if (!level)
			continue;

		const infos: MatiereInfos = {
			matiere: row.childNodes[0].text,
			coef: parseFloat(row.childNodes[1].text)
		};
		infos.notes = row.childNodes[2].text.trim();
		if (!isNaN(parseFloat(row.childNodes[3].text)))
			infos.moy = parseFloat(row.childNodes[3].text);
		if (!isNaN(parseFloat(row.childNodes[4].text)))
			infos.moyClasse = parseFloat(row.childNodes[4].text);
		if (!isNaN(parseFloat(row.childNodes[5].text)))
			infos.moyMin = parseFloat(row.childNodes[5].text);
		if (!isNaN(parseFloat(row.childNodes[6].text)))
			infos.rang = parseFloat(row.childNodes[6].text);

		if (level <= levels.length)
			levels.splice(level - 1, levels.length - level + 1);
		let container = result;
		for (let level of levels) {
			container = container.categories[level];
		}
		if (!container.categories)
			container.categories = {};
		container.categories[infos.matiere] = {
			infos
		};
		if (!classes.includes('moduleNiv3'))
			levels.push(infos.matiere);
	}

	return result;
}

export async function lastBilanEtu(jessionid: string): Promise<EtuResponse<MatiereCategorie>> {
	const html = await fetch(bilanUrl, {
		redirect: 'manual',
		headers: {
			Host: 'iutdijon.u-bourgogne.fr',
			Origin: 'https://iutdijon.u-bourgogne.fr',
			Cookie: `JSESSIONID=${jessionid}`,
			Referer: bilanUrl
		}
	}).then(res => res.text());

	const htmlMatch = html.match(/<tbody id="mainBilanForm:treeTable_data" class="[\w\s-]+">((.|\s)*?)<\/tbody>/);
	if (!htmlMatch || !htmlMatch[1])
		throw 'Unable to find grades (match)';

	return {
		response: await bilanEtu(htmlMatch[1])
	};
}