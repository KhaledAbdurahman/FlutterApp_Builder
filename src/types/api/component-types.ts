type IComponentType = 'widget' | 'component' | 'custom';

interface IComponent {
  id: string;
  name: string;
  type: IComponentType;
  description?: string;
  thumbnail?: string | null;
  template_json: unknown;
  is_public?: boolean;
  created_at: string;
}

interface IComponentCreateRequest {
  name: string;
  type: IComponentType;
  description?: string;
  thumbnail?: string | null;
  template_json: unknown;
  is_public?: boolean;
}

type IComponentUpdateRequest = Partial<IComponentCreateRequest>;

export type { IComponent, IComponentCreateRequest, IComponentType, IComponentUpdateRequest };
