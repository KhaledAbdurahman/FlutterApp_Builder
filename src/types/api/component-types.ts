type IComponentType = 'widget' | 'component' | 'custom';
type IComponentCatalogCategory = 'content' | 'input' | 'layout' | 'screen';
type IComponentChildRule = 'none' | 'child' | 'children' | 'special';

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

interface IComponentPropertyDefinition {
  name: string;
  type: string;
  required: boolean;
  default?: unknown;
  values?: unknown[];
  description?: string;
}

interface IAvailableComponent {
  type: string;
  category: IComponentCatalogCategory;
  child_rule: IComponentChildRule;
  props: IComponentPropertyDefinition[];
}

interface IAvailableComponentsResponse {
  components: IAvailableComponent[];
}

interface IComponentCategoriesResponse {
  categories: IComponentCatalogCategory[];
}

export type {
  IAvailableComponent,
  IAvailableComponentsResponse,
  IComponent,
  IComponentCatalogCategory,
  IComponentCategoriesResponse,
  IComponentChildRule,
  IComponentCreateRequest,
  IComponentPropertyDefinition,
  IComponentType,
  IComponentUpdateRequest,
};
