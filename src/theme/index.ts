import { colors } from "./colors";
import { typography } from "./typography";
import { spacing } from "./spacing";
import { radii } from "./radii";
import { iconSizes } from "./iconSizes";

export const theme = {
  colors,
  typography,
  spacing,
  radii,
  iconSizes,
} as const;

export { colors, typography, spacing, radii, iconSizes };
