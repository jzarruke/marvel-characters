export interface TeamBody {
  name: string;
  base?: string | null;
  foundedYear?: number | null;
  active?: boolean;
  characterIds?: number[];
}
