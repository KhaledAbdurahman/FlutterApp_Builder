import { ApiEndpointPathnames } from '@/config/api/api-endpoints';
import { Post } from '@/config/api/base-http-methods';
import type {
  IAuthLoginRequest,
  IAuthRegistrationRequest,
  IAuthResponse,
  IUser,
} from '@/types/api/auth-types';
import { clearStoredAuth, getStoredToken, getStoredUser, storeAuth } from '@/utils/auth-storage';

class AuthService {
  public getStoredToken(): string | null {
    return getStoredToken();
  }

  public getStoredUser(): IUser | null {
    return getStoredUser();
  }

  public isAuthenticated(): boolean {
    return Boolean(getStoredToken());
  }

  public async login(payload: IAuthLoginRequest): Promise<IAuthResponse> {
    const response = await Post<IAuthResponse, IAuthLoginRequest>({
      endpoint: ApiEndpointPathnames.AUTH_LOGIN,
      payload,
    });

    storeAuth(response.token, response.user);
    return response;
  }

  public async register(payload: IAuthRegistrationRequest): Promise<IAuthResponse> {
    const response = await Post<IAuthResponse, IAuthRegistrationRequest>({
      endpoint: ApiEndpointPathnames.AUTH_REGISTER,
      payload,
    });

    storeAuth(response.token, response.user);
    return response;
  }

  public async logout(): Promise<void> {
    try {
      await Post<void>({ endpoint: ApiEndpointPathnames.AUTH_LOGOUT });
    } finally {
      clearStoredAuth();
    }
  }
}

const AUTH_SERVICE = new AuthService();

export { AUTH_SERVICE };
