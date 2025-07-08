const makeGetEnvValue =
  // biome-ignore lint/suspicious/noExplicitAny: need to accept any.
    <P extends (value: string) => any>(parser: P) =>
    <T extends ReturnType<P>>(key: string, fallback: T): T => {
      const value = process.env[key];

      if (!value) {
        if (fallback === undefined) {
          throw Error(
            `Missing key ${key} from env and no fallback was provided`,
          );
        }

        return fallback;
      }

      return parser(value);
    };

export const Env = {
  getString: makeGetEnvValue(String),
  getNumber: makeGetEnvValue(Number),
};

export type EnvType = "development" | "test";
