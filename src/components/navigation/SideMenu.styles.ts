import { StyleSheet } from "react-native";
import { theme } from "../../theme";

export const drawerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "stretch",
  },

  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },

  drawer: {
    width: "84%",
    maxWidth: 360,
    height: "100%",
    alignSelf: "flex-start",
    backgroundColor: theme.colors.semantic.backgroundElevated,
    paddingTop: 48,
    paddingBottom: theme.spacing.xxxxxl,
    zIndex: 1,
    elevation: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
  },

  drawerHeader: {
    paddingHorizontal: theme.spacing.huge,
    paddingBottom: theme.spacing.xxxxxl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.semantic.borderDefault,
  },

  drawerCloseButton: {
    alignSelf: "flex-end",
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.xl,
  },

  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xl,
  },

  profileAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: theme.colors.semantic.backgroundPrimary,
  },

  profileAvatarFallback: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: theme.colors.feedback.successSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  profileTextContainer: {
    flex: 1,
  },

  profileName: {
    color: theme.colors.semantic.textPrimary,
    fontSize: 20,
    fontWeight: theme.typography.fontWeight.bold,
  },

  profileEmail: {
    color: theme.colors.semantic.textSecondary,
    fontSize: 15,
    lineHeight: 21,
    marginTop: theme.spacing.xxs,
  },

  profileLink: {
    color: theme.colors.semantic.actionPositive,
    fontSize: 16,
    fontWeight: theme.typography.fontWeight.semibold,
    marginTop: theme.spacing.xs,
  },

  profileRoleBadge: {
    alignSelf: "flex-start",
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.feedback.successSoft,
    borderRadius: theme.radii.pill,
  },

  profileRoleText: {
    color: theme.colors.semantic.actionPositive,
    fontSize: 15,
    fontWeight: theme.typography.fontWeight.semibold,
  },

  profileSwitchSection: {
    paddingHorizontal: theme.spacing.huge,
    paddingVertical: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.semantic.borderDefault,
  },

  profileSwitchOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.semantic.backgroundPrimary,
    borderRadius: theme.radii.button,
    minHeight: 52,
  },

  profileSwitchText: {
    flex: 1,
    color: theme.colors.semantic.textPrimary,
    fontSize: 15,
    fontWeight: theme.typography.fontWeight.semibold,
  },

  drawerMenuScroll: {
    flex: 1,
  },

  drawerMenuContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxxxl,
  },

  drawerSectionLabel: {
    color: theme.colors.semantic.textSecondary,
    fontSize: 14,
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: 1,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },

  drawerMenuItem: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radii.control,
    gap: theme.spacing.xl,
  },

  drawerMenuText: {
    flex: 1,
    color: theme.colors.semantic.textPrimary,
    fontSize: 18,
    lineHeight: 25,
  },

  drawerDivider: {
    height: 1,
    backgroundColor: theme.colors.semantic.borderDefault,
    marginVertical: theme.spacing.xl,
  },

  drawerLogoutText: {
    flex: 1,
    color: "#DC2626",
    fontSize: 18,
    lineHeight: 25,
  },

  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.semantic.borderDefault,
    paddingHorizontal: theme.spacing.huge,
    paddingTop: theme.spacing.xl,
  },

  drawerBrand: {
    color: theme.colors.semantic.actionPositive,
    fontSize: 24,
    fontWeight: theme.typography.fontWeight.extrabold,
  },

  drawerVersion: {
    color: theme.colors.semantic.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: theme.spacing.xs,
  },
});
