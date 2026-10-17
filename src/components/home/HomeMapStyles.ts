import { StyleSheet } from "react-native";
import { theme } from "../../theme";

export const styles = StyleSheet.create({
  map: {
    flex: 1,
  },

  messageContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.huge,
    backgroundColor: theme.colors.semantic.backgroundPrimary,
  },

  messageTitle: {
    fontSize: theme.typography.fontSize.headingSmall,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.semantic.textPrimary,
    textAlign: "center",
    marginBottom: theme.spacing.md,
  },

  message: {
    fontSize: theme.typography.fontSize.metric,
    color: theme.colors.semantic.textSecondary,
    textAlign: "center",
    marginTop: theme.spacing.xl,
  },
});
