import { handleResponseError } from '@/app/error-handlers/api-response-errors';
import { ApiClient } from '@/config/api/api-client';
import type { IPostRequestOptions } from '@/types/api/base-http-methods-types';

import type { ResponseType } from 'axios';

interface IGetRequestOptions {
  endpoint: string;
  responseType?: ResponseType;
}

const Get = async <TResponse>({
  endpoint,
  responseType,
}: IGetRequestOptions): Promise<TResponse> => {
  try {
    const response = await ApiClient.get<TResponse>(endpoint, { responseType });
    return response.data;
  } catch (error) {
    return handleResponseError(error);
  }
};

const Post = async <TResponse, TPayload = undefined>({
  endpoint,
  payload,
  contentType = 'application/json',
  responseType,
}: IPostRequestOptions<TPayload>): Promise<TResponse> => {
  try {
    const response = await ApiClient.post<TResponse>(endpoint, payload, {
      headers: { 'Content-Type': contentType },
      responseType,
    });
    return response.data;
  } catch (error) {
    return handleResponseError(error);
  }
};

const Patch = async <TResponse, TPayload = undefined>({
  endpoint,
  payload,
  contentType = 'application/json',
  responseType,
}: IPostRequestOptions<TPayload>): Promise<TResponse> => {
  try {
    const response = await ApiClient.patch<TResponse>(endpoint, payload, {
      headers: { 'Content-Type': contentType },
      responseType,
    });
    return response.data;
  } catch (error) {
    return handleResponseError(error);
  }
};

const Delete = async ({ endpoint }: Pick<IGetRequestOptions, 'endpoint'>): Promise<void> => {
  try {
    await ApiClient.delete(endpoint);
  } catch (error) {
    return handleResponseError(error);
  }
};

export { Delete, Get, Patch, Post };
