import { StyleSheet } from "react-native";
import { theme } from "../../theme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral.carbon,
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    alignItems: "center",
  },

  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.lg,
  },

  logo: {
    color: theme.colors.neutral.white,
    fontSize: theme.typography.fontSize.splashLogo,
    fontWeight: theme.typography.fontWeight.extrabold,
    letterSpacing: -2,
  },

  tagline: {
    color: theme.colors.neutral.muted,
    fontSize: theme.typography.fontSize.metric,
    marginTop: theme.spacing.md,
  },

  location: {
    position: "absolute",
    bottom: theme.spacing.massive,
    color: theme.colors.neutral.muted,
    fontSize: theme.typography.fontSize.body,
    fontWeight: theme.typography.fontWeight.semibold,
    letterSpacing: theme.typography.letterSpacingEm.labelWide * 10,
  },
});
