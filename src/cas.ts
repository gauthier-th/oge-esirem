import fetch from 'node-fetch';

const loginUrl = 'https://casiut21.u-bourgogne.fr/cas-esirem/login?service=https%3A%2F%2Fiutdijon.u-bourgogne.fr%2Foge-esirem%2Fstylesheets%2Fetu%2Fhome.xhtml';

export async function login(username: string, password: string): Promise<string> {
	const key = await getKey();
	const body = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&execution=${encodeURIComponent(key)}&_eventId=submit&geolocation=`;
	const postResponse = await fetch(loginUrl, {
		method: 'POST',
		redirect: 'manual',
		headers: {
			Referer: loginUrl,
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body
	});
	if (postResponse.status !== 302)
		throw 'Invalid login';
	const sessionIdResponse = await fetch(postResponse.headers.get('location'), {
		redirect: 'manual'
	});
	const match = sessionIdResponse.headers.get('set-cookie').match(/JSESSIONID=([A-F0-9]+);/);
	if (match && match[1])
		return match[1];
	else
		throw 'Unable to find jsessionid';
}

export async function getKey(): Promise<string> {
	const html = await fetch(loginUrl).then(res => res.text());
	const match = html.match(/name="execution" value="(.*?)"/);
	if (match && match[1])
		return match[1];
	else
		throw 'Unable to find key';
}