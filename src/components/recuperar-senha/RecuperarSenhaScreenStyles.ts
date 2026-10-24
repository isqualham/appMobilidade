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

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: theme.spacing.massive,
  },

  logoContainer: {
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
    lineHeight: 24,
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
    height: 27,
    padding: theme.spacing.none,
    fontSize: theme.typography.fontSize.metric,
    color: theme.colors.semantic.textPrimary,
  },

  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 42,
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderDefault,
    borderRadius: theme.radii.button,
    paddingLeft: theme.spacing.xl,
    paddingRight: theme.spacing.md,
  },

  passwordInput: {
    flex: 1,
    minHeight: 42,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.none,
    fontSize: theme.typography.fontSize.metric,
    color: theme.colors.semantic.textPrimary,
  },

  eyeButton: {
    minWidth: 40,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButton: {
    minHeight: 58,
    borderRadius: theme.radii.button,
    backgroundColor: theme.colors.semantic.actionPrimaryBackground,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.xs,
  },

  primaryButtonText: {
    color: theme.colors.semantic.actionPrimaryForeground,
    fontSize: theme.typography.fontSize.subtitle,
    fontWeight: theme.typography.fontWeight.bold,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xl,
  },

  secondaryButtonText: {
    color: theme.colors.semantic.actionPositive,
    fontSize: theme.typography.fontSize.subtitleSmall,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
