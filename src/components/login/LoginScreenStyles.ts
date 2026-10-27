import { StyleSheet } from "react-native";
import { theme } from "../../theme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.semantic.backgroundElevated,
    paddingHorizontal: theme.spacing.authGutter,
    paddingTop: 54,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderDefault,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.xl,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: theme.spacing.massive,
  },

  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: theme.spacing.xl,
    marginBottom: theme.spacing.massivePlus,
  },

  logoText: {
    color: theme.colors.semantic.textPrimary,
    fontSize: theme.typography.fontSize.hero,
    fontWeight: theme.typography.fontWeight.extrabold,
    letterSpacing: -1.5,
  },

  heading: {
    marginBottom: theme.spacing.hugePlus,
  },

  title: {
    fontSize: theme.typography.fontSize.loginHighlight,
    lineHeight: 43,
    fontWeight: theme.typography.fontWeight.regular,
    letterSpacing: -1.5,
    color: theme.colors.semantic.textPrimary,
  },

  subtitle: {
    fontSize: theme.typography.fontSize.metric,
    color: theme.colors.semantic.textSecondary,
    marginTop: theme.spacing.xl,
  },

  form: {
    width: "100%",
  },

  inputContainer: {
    minHeight: 60,
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderDefault,
    borderRadius: theme.radii.button,
    paddingHorizontal: theme.spacing.xxxxl,
    paddingVertical: theme.spacing.md,
    justifyContent: "center",
    marginBottom: theme.spacing.xl,
  },

  label: {
    fontSize: theme.typography.fontSize.button,
    color: theme.colors.semantic.textSecondary,
    marginBottom: theme.spacing.xxs,
  },

  input: {
    minHeight: 27,
    padding: theme.spacing.none,
    fontSize: theme.typography.fontSize.heading,
    color: theme.colors.semantic.textPrimary,
  },

  errorText: {
    color: theme.colors.semantic.actionDestructive,
    fontSize: theme.typography.fontSize.bodyComfortable,
    marginTop: theme.spacing.xs,
  },

  forgotButton: {
    alignSelf: "flex-end",
    marginTop: theme.spacing.xxs,
    marginBottom: theme.spacing.huge,
    paddingVertical: theme.spacing.xs,
  },

  forgotText: {
    color: theme.colors.semantic.actionPositive,
    fontSize: theme.typography.fontSize.subtitleSmall,
    fontWeight: theme.typography.fontWeight.semibold,
  },

  loginButton: {
    height: 58,
    borderRadius: theme.radii.button,
    backgroundColor: theme.colors.semantic.actionPrimaryBackground,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xl,
  },

  loginButtonDisabled: {
    opacity: 0.6,
  },

  loginButtonText: {
    color: theme.colors.semantic.actionPrimaryForeground,
    fontSize: theme.typography.fontSize.subtitle,
    fontWeight: theme.typography.fontWeight.bold,
  },

  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: theme.spacing.massive,
  },

  registerText: {
    fontSize: theme.typography.fontSize.subtitleSmall,
    color: theme.colors.semantic.textSecondary,
  },

  registerLink: {
    fontSize: theme.typography.fontSize.subtitleSmall,
    color: theme.colors.semantic.actionPositive,
    fontWeight: theme.typography.fontWeight.bold,
  },
});
