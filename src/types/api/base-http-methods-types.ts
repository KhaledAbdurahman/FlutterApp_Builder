import type { ResponseType } from 'axios';

interface IPostRequestOptions<TPayload> {
  endpoint: string;
  payload?: TPayload;
  contentType?: 'application/json' | 'multipart/form-data';
  responseType?: ResponseType;
}

export type { IPostRequestOptions };
