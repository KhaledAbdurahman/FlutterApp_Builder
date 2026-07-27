interface IScreen {
  id: string;
  name: string;
  route: string;
  is_home?: boolean;
  json_data: unknown;
  order?: number;
  created_at: string;
  updated_at: string;
}

interface IScreenCreateRequest {
  name: string;
  route: string;
  is_home?: boolean;
  json_data: unknown;
  order?: number;
}

type IScreenUpdateRequest = Partial<IScreenCreateRequest>;

export type { IScreen, IScreenCreateRequest, IScreenUpdateRequest };
