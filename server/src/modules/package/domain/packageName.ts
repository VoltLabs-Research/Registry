export const toFullName = (username: string, name: string): string =>
    `@${username.toLowerCase()}/${name.toLowerCase()}`;
