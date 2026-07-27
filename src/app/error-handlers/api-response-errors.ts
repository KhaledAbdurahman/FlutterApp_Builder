import { AxiosError } from 'axios';

interface IApiResponseError {
  message: string;
  details?: unknown;
  status?: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getFirstString = (value: unknown): string | null => {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return null;
};
const getErrorMessages = (details: unknown): string[] => {
  const messages: string[] = [];

  const collect = (value: unknown): void => {
    if (typeof value === 'string') {
      const message = value.trim();

      if (message) {
        messages.push(message);
      }

      return;
    }

    if (Array.isArray(value)) {
      value.forEach(collect);
      return;
    }

    if (isRecord(value)) {
      Object.values(value).forEach(collect);
    }
  };

  collect(details);

  return [...new Set(messages)];
};

const getErrorMessage = (details: unknown): string => {
  const messages = getErrorMessages(details);

  return messages.length > 0 ? messages.join(' ') : 'No error message found.';
};

const handleResponseError = (error: unknown): never => {
  if (error instanceof AxiosError) {
    const details = error.response?.data;
    console.log(details);
    const responseError: IApiResponseError = {
      message: getErrorMessage(details),
      details,
      status: error.response?.status,
    };

    throw responseError;
  }

  throw {
    message: error instanceof Error ? error.message : 'An error occurred.',
    details: error,
  } satisfies IApiResponseError;
};

export { handleResponseError };
