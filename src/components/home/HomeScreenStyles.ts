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

  driverMapContainer: {
    flex: 1.35,
    backgroundColor: "#E8EFEB",
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

  driverStatusBadge: {
    position: "absolute",
    top: 55,
    left: 105,
    right: 88,
    minHeight: 58,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 32,
    backgroundColor: "#17211D",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    elevation: 5,
    zIndex: 2,
  },

  driverStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#C7F43D",
  },

  driverStatusDotOffline: {
    backgroundColor: "#9CA3AF",
  },

  driverStatusTextContainer: {
    flexShrink: 1,
  },

  driverStatusTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  driverStatusSubtitle: {
    color: "#C4CEC8",
    fontSize: 9,
    marginTop: 4,
  },

  notificationButton: {
    position: "absolute",
    top: 55,
    right: 22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    zIndex: 3,
  },

  driverCenterMarker: {
    position: "absolute",
    top: "23%",
    alignSelf: "center",
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 7,
    borderColor: "#FFFFFF",
    backgroundColor: "#C7F43D",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },

  driverCenterMarkerInner: {
    alignItems: "center",
    justifyContent: "center",
  },

  driverMapLocation: {
    position: "absolute",
    top: 132,
    right: 38,
    color: "#8A9991",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
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

  driverBottomSheet: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 12,
    marginTop: -18,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
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

  driverGreetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },

  driverGreetingContainer: {
    flex: 1,
  },

  driverGreeting: {
    color: "#18875A",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 12,
  },

  driverTitle: {
    color: "#17211D",
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "500",
  },

  onlineButton: {
    width: 78,
    minHeight: 78,
    borderRadius: 22,
    backgroundColor: "#C7F43D",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  offlineButton: {
    backgroundColor: "#475569",
  },

  onlineButtonText: {
    color: "#17211D",
    fontSize: 13,
    fontWeight: "800",
  },

  offlineButtonText: {
    color: "#FFFFFF",
  },

  requestStatusCard: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DFE5E1",
    backgroundColor: "#F4F6F2",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 12,
  },

  requestStatusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#18875A",
    borderWidth: 4,
    borderColor: "#D5E8DD",
    boxSizing: "content-box",
  },

  requestStatusDotSimulated: {
    backgroundColor: "#C7F43D",
    borderColor: "#E9F8B5",
  },

  requestStatusContent: {
    flex: 1,
  },

  requestStatusTitle: {
    color: "#17211D",
    fontSize: 14,
    fontWeight: "800",
  },

  requestStatusSubtitle: {
    color: "#707D76",
    fontSize: 11,
    marginTop: 5,
  },

  earningsCard: {
    minHeight: 82,
    borderRadius: 20,
    backgroundColor: "#17211D",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
  },

  earningsMain: {
    flex: 1,
  },

  earningsLabel: {
    color: "#9AA79F",
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 8,
  },

  earningsValue: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "900",
  },

  earningsDivider: {
    width: 1,
    height: 44,
    backgroundColor: "#3D4942",
    marginHorizontal: 14,
  },

  servicesSummary: {
    minWidth: 58,
  },

  simulateButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 2,
  },

  simulateButtonText: {
    color: "#18875A",
    fontSize: 13,
    fontWeight: "500",
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
