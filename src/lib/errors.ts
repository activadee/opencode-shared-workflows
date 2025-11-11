export class UserInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserInputError';
  }
}

export class MissingEnvError extends Error {
  constructor(envVar: string) {
    super(`Missing required environment variable: ${envVar}`);
    this.name = 'MissingEnvError';
  }
}
