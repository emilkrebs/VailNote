import * as bcrypt from "bcrypt";

export function generateHash(password: string): string {
	const salt = bcrypt.genSaltSync(8);
	return bcrypt.hashSync(password, salt);
}

export function compareHash(
	password: string,
	hash: string,
): boolean {
	return bcrypt.compareSync(password, hash);
}
