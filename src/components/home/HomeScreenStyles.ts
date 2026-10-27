import { StyleSheet } from "react-native";
import { theme } from "../../theme";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.semantic.backgroundPrimary,
  },

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
    zIndex: 3,
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
    height: 6,
    borderRadius: theme.radii.full,
    backgroundColor: "#D6DED9",
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

  bottomNavigation: {
    minHeight: 66,
    backgroundColor: theme.colors.semantic.backgroundElevated,
    borderTopWidth: 1,
    borderTopColor: theme.colors.semantic.borderDefault,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 2,
    paddingBottom: 4,
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
});
