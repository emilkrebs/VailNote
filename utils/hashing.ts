import * as bcrypt from "bcrypt";

export function generateHash(password: string): string {
	const salt = bcrypt.genSaltSync(8);
	return bcrypt.hashSync(password, salt);
}

export async function compareHash(
	password: string,
	hash: string,
): Promise<boolean> {
	return await bcrypt.compare(password, hash);
}
