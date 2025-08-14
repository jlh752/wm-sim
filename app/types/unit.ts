import type { AbilityID } from './ability';

export interface UnitProps {
  id: number;
  reinforced?: boolean;
}

export interface UnitDefinitionProps {
  id: number;
  abilities?: AbilityID[];
}