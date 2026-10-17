import { StyleSheet } from "react-native";
import { theme } from "../../theme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.semantic.backgroundPrimary,
  },

  // Mapa
  mapContainer: {
    flex: 1,
    position: "relative",
  },

  menuButton: {
    position: "absolute",
    top: 55,
    left: theme.spacing.xxxxxl,
    width: 50,
    height: 50,
    borderRadius: theme.radii.card,
    backgroundColor: theme.colors.semantic.backgroundElevated,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    zIndex: 2,
  },

  locationBadge: {
    position: "absolute",
    top: 57,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.xxxxl,
    paddingVertical: theme.spacing.xl,
    backgroundColor: theme.colors.semantic.backgroundElevated,
    borderRadius: theme.radii.pill,
    elevation: 4,
  },

  locationDot: {
    width: theme.spacing.mdPlus,
    height: theme.spacing.mdPlus,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.semantic.actionPositive,
  },

  locationText: {
    color: theme.colors.semantic.textPrimary,
    fontSize: theme.typography.fontSize.subtitle,
    fontWeight: theme.typography.fontWeight.semibold,
  },

  mapButton: {
    position: "absolute",
    bottom: theme.spacing.xxxxxl,
    right: theme.spacing.xxxxxl,
    width: 50,
    height: 50,
    borderRadius: theme.radii.card,
    backgroundColor: theme.colors.semantic.backgroundElevated,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },

  // Painel inferior
  bottomSheet: {
    backgroundColor: theme.colors.semantic.backgroundElevated,
    borderTopLeftRadius: theme.radii.sheet,
    borderTopRightRadius: theme.radii.sheet,
    paddingHorizontal: theme.spacing.huge,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxxxl,
    marginTop: -18,
  },

  handle: {
    width: 38,
    height: theme.spacing.xs,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.neutral.mist,
    alignSelf: "center",
    marginBottom: theme.spacing.xxxxxl,
  },

  greeting: {
    color: theme.colors.semantic.textSecondary,
    fontSize: theme.typography.fontSize.subtitle,
  },

  title: {
    color: theme.colors.semantic.textPrimary,
    fontSize: theme.typography.fontSize.titleHome,
    fontWeight: theme.typography.fontWeight.extrabold,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xxxxxl,
  },

  destinationInput: {
    minHeight: 58,
    borderRadius: theme.radii.button,
    backgroundColor: theme.colors.semantic.backgroundPrimary,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xxxxl,
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.hugePlus,
  },

  destinationTextContainer: {
    flex: 1,
  },

  destinationPlaceholder: {
    color: theme.colors.semantic.textSecondary,
    fontSize: theme.typography.fontSize.metric,
    fontWeight: theme.typography.fontWeight.semibold,
  },

  selectedAddress: {
    color: theme.colors.semantic.textSecondary,
    fontSize: theme.typography.fontSize.bodySmall,
    marginTop: theme.spacing.xs,
  },

  sectionTitle: {
    color: theme.colors.semantic.textPrimary,
    fontSize: theme.typography.fontSize.metric,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.xlPlus,
  },

  // Lugares salvos
  placesRow: {
    flexDirection: "row",
    gap: theme.spacing.xl,
  },

  placeItem: {
    flex: 1,
    minHeight: 112,
    borderWidth: 1,
    borderColor: theme.colors.semantic.borderDefault,
    borderRadius: theme.radii.button,
    padding: theme.spacing.xl,
  },

  placeIcon: {
    width: 42,
    height: 42,
    borderRadius: theme.radii.control,
    backgroundColor: theme.colors.feedback.successSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg,
  },

  placeName: {
    color: theme.colors.semantic.textPrimary,
    fontSize: theme.typography.fontSize.metric,
    fontWeight: theme.typography.fontWeight.bold,
  },

  placeAddress: {
    color: theme.colors.semantic.textSecondary,
    fontSize: theme.typography.fontSize.body,
    marginTop: theme.spacing.xs,
  },

  // Navegação inferior: Início, Atividade e Carteira
  bottomNavigation: {
    minHeight: 76,
    backgroundColor: theme.colors.semantic.backgroundElevated,
    borderTopWidth: 1,
    borderTopColor: theme.colors.semantic.borderDefault,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.md,
  },

  navItem: {
    flex: 1,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xxs + 1,
  },

  navTextActive: {
    color: theme.colors.semantic.actionPositive,
    fontSize: theme.typography.fontSize.button,
    fontWeight: theme.typography.fontWeight.bold,
  },

  navText: {
    color: theme.colors.semantic.textSecondary,
    fontSize: theme.typography.fontSize.button,
  },

  // Menu lateral
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

  // Alternância entre Cliente e Prestador
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
