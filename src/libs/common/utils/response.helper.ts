export class ResponseHelper {
  static success<T = any>(data: T, message = 'Success') {
    return {
      success: true,
      message,
      data,
    };
  }

  static error(message: string, statusCode = 400) {
    return {
      success: false,
      message,
      statusCode,
    };
  }
}
