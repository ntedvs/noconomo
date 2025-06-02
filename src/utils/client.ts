export const shape = (fd: FormData) =>
  Object.fromEntries(fd) as { [key: string]: string }
