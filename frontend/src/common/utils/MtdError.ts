import { isDefined } from "utils/utilities";

export class MtdError extends Error {
  status: number = 200;
  timestamp: number = Date.now();
  error: string = "success";
  message: string = "success";
  fallback: string = "popup";

  constructor(
    _status: number,
    _error: string,
    _message?: string,
    _fallback?: string
  ) {
    super();

    this.status = _status;
    this.error = _error;
    this.timestamp = Date.now();

    if (isDefined(_message)) this.message = _message;
    if (isDefined(_fallback)) this.fallback = _fallback;

    Object.setPrototypeOf(this, MtdError.prototype);
  }
}
