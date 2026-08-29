import { useQuery } from '@tanstack/react-query';
import { COMPONENT_SERVICE } from '@/api/components';

const COMPONENT_CATALOG_STALE_TIME = 5 * 60 * 1000;

const useComponentCatalog = () => {
  const availableQuery = useQuery({
    queryKey: ['components', 'available'],
    queryFn: () => COMPONENT_SERVICE.getAvailable(),
    staleTime: COMPONENT_CATALOG_STALE_TIME,
    retry: 1,
  });
  const categoriesQuery = useQuery({
    queryKey: ['components', 'categories'],
    queryFn: () => COMPONENT_SERVICE.getCategories(),
    staleTime: COMPONENT_CATALOG_STALE_TIME,
    retry: 1,
  });

  return {
    availableComponents: availableQuery.data?.components,
    categories: categoriesQuery.data?.categories,
  };
};

export { useComponentCatalog };
