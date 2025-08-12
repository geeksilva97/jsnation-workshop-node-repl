import { BaseError, Exception } from "./base-error.js";
import { ErrorCode } from "./error-code.js";

namespace UpdateRecordError {
  const type = Symbol();
  const code = ErrorCode.DATABASE;

  type Props = {
    details?: any[];
  };

  export const create = ({
    message,
    details,
  }: Props & { message: string }): Exception<Props> =>
    new BaseError<Props>({
      type,
      code,
      message,
      meta: { details } as Props,
    });

  export const is = (err: any): err is Exception<Props> => err.type === type;
}

export { UpdateRecordError };
