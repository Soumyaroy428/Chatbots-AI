export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function asyncHandler(
  fn: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<unknown>
) {
  return (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
