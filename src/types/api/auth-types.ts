interface IUser {
  id: number;
  username: string;
  email: string;
}

interface IAuthLoginRequest {
  username: string;
  password: string;
}

interface IAuthRegistrationRequest {
  username: string;
  email: string;
  password: string;
  password2: string;
}

// The running backend returns this payload even though the current OpenAPI document omits it.
interface IAuthResponse {
  token: string;
  user: IUser;
}

export type { IAuthLoginRequest, IAuthRegistrationRequest, IAuthResponse, IUser };
