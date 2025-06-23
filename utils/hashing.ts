import * as bcrypt from "bcrypt";

export async function generateHash(password: string): Promise<string> {
	const salt = await bcrypt.genSalt(8);
	return await bcrypt.hash(password, salt);
}

export async function compareHash(
	password: string,
	hash: string,
): Promise<boolean> {
	return await bcrypt.compare(password, hash);
}
