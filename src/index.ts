import { login } from './cas';
import { lastBilanEtu, MatiereCategorie } from './bilanEtu';

export default class OgeEsirem {

	private viewState: string = null;
	private username: string = null;
	private password: string = null;
	private jessionid: string = null;

	constructor(username: string, password: string) {
		this.username = username;
		this.password = password;
	}

	async login(): Promise<void> {
		this.jessionid = await login(this.username, this.password);
	}

	async lastBilanEtu(): Promise<MatiereCategorie> {
		if (this.jessionid === null)
			throw 'You are not logged!';
		const res = await lastBilanEtu(this.jessionid);
		if (res.viewState)
			this.viewState = res.viewState;
		return res.response;
	}

}