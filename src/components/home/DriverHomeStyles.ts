import { StyleSheet } from "react-native";
import { colors, radii, spacing, typography } from "../../theme";

export const driverStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.map.background },
  mapArea: { flex: 1 },
  topBar: {
    position: "absolute", left: spacing.screenGutter, right: spacing.screenGutter,
    flexDirection: "row", alignItems: "center", gap: spacing.xl,
  },
  roundButton: {
    minWidth: 44, minHeight: 44, borderRadius: radii.full,
    backgroundColor: colors.neutral.white, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: colors.neutral.border,
  },
  statusBadge: {
    flex: 1, minHeight: 48, borderRadius: radii.full,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
    backgroundColor: colors.neutral.carbon, flexDirection: "row",
    justifyContent: "center", alignItems: "center", gap: spacing.md,
  },
  statusDot: {
    width: spacing.lg, height: spacing.lg, borderRadius: radii.full,
    backgroundColor: colors.neutral.muted,
  },
  onlineDot: { backgroundColor: colors.brand.primary },
  statusCopy: { flexShrink: 1 },
  statusTitle: {
    color: colors.neutral.white, fontSize: typography.fontSize.button,
    fontWeight: typography.fontWeight.extrabold, letterSpacing: 1,
  },
  statusSubtitle: {
    color: colors.neutral.border, fontSize: typography.fontSize.body,
    marginTop: spacing.xs,
  },
  recenter: { position: "absolute", right: spacing.screenGutter, bottom: spacing.xxxl },
  sheet: {
    flexShrink: 1, backgroundColor: colors.neutral.white,
    borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet,
    overflow: "hidden",
  },
  sheetContent: { paddingHorizontal: spacing.screenGutter, paddingBottom: spacing.xxxxxl },
  handle: {
    width: 36, height: spacing.xs, borderRadius: radii.full,
    backgroundColor: colors.neutral.border, alignSelf: "center",
    marginTop: spacing.xl, marginBottom: spacing.hugePlus,
  },
  greetingRow: { flexDirection: "row", alignItems: "center", gap: spacing.xxxl },
  stackedRow: { flexDirection: "column", alignItems: "stretch" },
  greetingCopy: { flex: 1 },
  stackedCopy: { flex: 0 },
  greeting: {
    color: colors.feedback.success, fontSize: typography.fontSize.button,
    fontWeight: typography.fontWeight.bold, letterSpacing: 1,
    marginBottom: spacing.xl, textTransform: "uppercase",
  },
  title: {
    color: colors.neutral.carbon, fontSize: typography.fontSize.titleHome,
    fontWeight: typography.fontWeight.medium,
  },
  availabilityButton: {
    minHeight: 76, minWidth: 88, paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl, borderRadius: radii.pill,
    backgroundColor: colors.brand.primary, gap: spacing.sm,
    alignItems: "center", justifyContent: "center",
  },
  buttonBusy: { opacity: 0.6 },
  availabilityLabel: {
    fontSize: typography.fontSize.subtitleSmall, color: colors.neutral.carbon,
    fontWeight: typography.fontWeight.bold, textAlign: "center",
  },
  context: {
    color: colors.neutral.muted, fontSize: typography.fontSize.subtitleSmall,
    lineHeight: typography.fontSize.subtitleSmall * typography.lineHeightRatio.body,
    marginTop: spacing.xl, marginBottom: spacing.xxxl,
  },
  requestCard: {
    flexDirection: "row", alignItems: "center", gap: spacing.xl,
    padding: spacing.xxxl, minHeight: 64, borderRadius: radii.cardSmall,
    borderWidth: 1, borderColor: colors.neutral.border, backgroundColor: colors.neutral.surface,
    marginBottom: spacing.lg,
  },
  requestHalo: {
    padding: spacing.xs, borderRadius: radii.full, backgroundColor: colors.neutral.mist,
  },
  onlineHalo: { backgroundColor: colors.feedback.successSoft },
  requestCopy: { flex: 1 },
  cardTitle: {
    color: colors.neutral.carbon, fontSize: typography.fontSize.metric,
    fontWeight: typography.fontWeight.bold,
  },
  cardSubtitle: {
    color: colors.neutral.muted, fontSize: typography.fontSize.subtitleSmall,
    marginTop: spacing.sm,
  },
  earningsCard: {
    flexDirection: "row", alignItems: "center", gap: spacing.xxxl,
    minHeight: 76, padding: spacing.xxxl, borderRadius: radii.cardSmall,
    backgroundColor: colors.neutral.carbon,
  },
  earningsColumn: { flex: 1 },
  earningsLabel: {
    color: colors.neutral.border, fontSize: typography.fontSize.bodyEmphasis,
    fontWeight: typography.fontWeight.semibold,
  },
  earningsValue: {
    color: colors.neutral.white, fontSize: typography.fontSize.titleSmall,
    fontWeight: typography.fontWeight.extrabold, marginTop: spacing.sm,
  },
  earningsDivider: { alignSelf: "stretch", width: 1, backgroundColor: colors.neutral.carbonSecondary },
  emptyNote: {
    textAlign: "center", color: colors.neutral.muted, fontSize: typography.fontSize.subtitleSmall,
    marginTop: spacing.xl,
  },
  error: {
    color: colors.feedback.danger, fontSize: typography.fontSize.subtitle,
    lineHeight: typography.fontSize.subtitle * typography.lineHeightRatio.body,
    marginBottom: spacing.xxxl,
  },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: `${colors.neutral.carbon}80` },
  vehicleSheet: {
    backgroundColor: colors.neutral.white, padding: spacing.screenGutter,
    borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet, maxHeight: "75%",
  },
  vehicleOption: {
    minHeight: 48, paddingVertical: spacing.xxxl, flexDirection: "row", gap: spacing.xl,
    alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.neutral.border,
  },
  vehicleLabel: { flex: 1, color: colors.neutral.carbon, fontSize: typography.fontSize.bodyComfortable },
  cancelLabel: { color: colors.feedback.success, fontWeight: typography.fontWeight.bold },
  sectionContainer: { flex: 1, backgroundColor: colors.neutral.white },
  sectionHeader: {
    padding: spacing.screenGutter, flexDirection: "row", alignItems: "center", gap: spacing.xxxl,
  },
  sectionBody: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: spacing.huge, gap: spacing.xxxl },
  sectionDescription: {
    color: colors.neutral.muted, fontSize: typography.fontSize.bodyComfortable,
    lineHeight: typography.fontSize.bodyComfortable * typography.lineHeightRatio.body,
    textAlign: "center", maxWidth: 480,
  },
});
