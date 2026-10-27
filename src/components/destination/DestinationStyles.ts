import { StyleSheet } from "react-native";
import { theme } from "../../theme";

const { colors, spacing, radii, typography } = theme;
const { semantic, neutral, feedback, brand } = colors;
const { fontFamily, fontSize, fontWeight, letterSpacingEm } = typography;

export const styles = StyleSheet.create({
  // Tela
  container: {
    flex: 1,
    backgroundColor: semantic.backgroundElevated,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.hugePlus,
  },

  // Cabeçalho
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 54,
    paddingHorizontal: spacing.huge,
    paddingBottom: spacing.hugePlus,
  },

  backButton: {
    width: 54,
    height: 54,
    borderRadius: radii.sheet,
    borderWidth: 1.5,
    borderColor: semantic.borderDefault,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    flex: 1,
    marginHorizontal: spacing.md,
    fontSize: fontSize.headingLarge,
    fontWeight: fontWeight.bold,
    color: semantic.textPrimary,
    textAlign: "center",
  },

  headerSpacer: {
    width: 54,
  },

  // Trajeto: origem e destino
  routeSection: {
    flexDirection: "row",
    paddingHorizontal: spacing.huge,
    paddingTop: spacing.xxs,
    paddingBottom: spacing.hugePlus,
    borderBottomWidth: 1,
    borderBottomColor: semantic.borderDefault,
  },

  routeLine: {
    width: 30,
    alignItems: "center",
    paddingTop: 34,
    paddingBottom: spacing.huge,
    marginRight: spacing.xlPlus,
  },

  originDot: {
    width: 18,
    height: 18,
    borderRadius: radii.full,
    borderWidth: 4,
    borderColor: semantic.textPrimary,
    backgroundColor: brand.primary,
    zIndex: 1,
  },

  line: {
    width: spacing.xxs,
    height: 76,
    backgroundColor: semantic.textPrimary,
  },

  destinationSquare: {
    width: 18,
    height: 18,
    borderRadius: radii.xs,
    borderWidth: 4,
    borderColor: semantic.textPrimary,
    backgroundColor: brand.primary,
  },

  routeFields: {
    flex: 1,
    gap: spacing.xxxxxl - spacing.xs,
  },

  // Campo de origem
  originField: {
    minHeight: 76,
    justifyContent: "center",
    paddingHorizontal: spacing.xxxxxl,
    paddingVertical: spacing.xl,
    borderRadius: radii.cardLarge,
    borderWidth: 1.5,
    borderColor: semantic.borderDefault,
    backgroundColor: semantic.backgroundPrimary,
  },

  fieldLabel: {
    fontSize: fontSize.subtitleSmall,
    color: semantic.textSecondary,
    marginBottom: spacing.sm + spacing.xxs,
  },

  originValue: {
    fontSize: fontSize.subtitleEmphasis,
    fontWeight: fontWeight.bold,
    color: semantic.textPrimary,
  },

  // Campo de destino
  destinationField: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: spacing.xxxxxl,
    paddingRight: spacing.xl,
    borderRadius: radii.cardLarge,
    borderWidth: 2.5,
    borderColor: semantic.textPrimary,
    backgroundColor: semantic.backgroundElevated,
  },

  destinationFieldSelected: {
    borderColor: semantic.actionPositive,
  },

  destinationInputContent: {
    flex: 1,
    paddingVertical: spacing.lg,
  },

  // Tipografia padronizada para os campos de origem e destino
  input: {
    padding: spacing.none,
    fontFamily: fontFamily.primary,
    fontSize: fontSize.subtitleEmphasis,
    fontWeight: fontWeight.medium,
    color: semantic.textPrimary,
  },

  // Botões de ícones Lucide
  searchIconButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  clearButton: {
    width: 38,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  searchHint: {
    fontSize: fontSize.bodyEmphasis,
    color: semantic.textSecondary,
    paddingHorizontal: spacing.xs,
  },

  // Histórico e resultados
  historySection: {
    paddingHorizontal: spacing.hugePlus,
    paddingTop: spacing.massive,
  },

  sectionTitle: {
    fontSize: fontSize.subtitleSmall,
    fontWeight: fontWeight.extrabold,
    letterSpacing: letterSpacingEm.labelWide * 10,
    color: neutral.muted,
    marginBottom: spacing.xxxxxl - spacing.xs,
  },

  historyLoading: {
    marginTop: spacing.hugePlus,
  },

  recentRow: {
    minHeight: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxxxxl - spacing.xs,
    paddingVertical: spacing.xxxxxl - spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: semantic.borderDefault,
  },

  recentIcon: {
    width: 60,
    height: 60,
    borderRadius: radii.card,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: semantic.backgroundPrimary,
  },

  recentTextContainer: {
    flex: 1,
    gap: spacing.sm + spacing.xxs,
  },

  recentTitle: {
    fontSize: fontSize.subtitleEmphasis,
    fontWeight: fontWeight.bold,
    color: semantic.textPrimary,
  },

  recentAddress: {
    fontSize: fontSize.subtitleSmall,
    lineHeight: 18,
    color: semantic.textSecondary,
  },

  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl,
    paddingVertical: spacing.xxxxxl - spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: semantic.borderDefault,
  },

  resultRowSelected: {
    backgroundColor: feedback.successSoft,
  },

  placeIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.card,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: semantic.backgroundPrimary,
  },

  resultTextContainer: {
    flex: 1,
    gap: spacing.xs + 1,
  },

  resultTitle: {
    fontSize: fontSize.metric,
    fontWeight: fontWeight.bold,
    color: semantic.textPrimary,
  },

  resultAddress: {
    fontSize: fontSize.subtitleSmall,
    lineHeight: 18,
    color: semantic.textSecondary,
  },

  // Mensagens e estados vazios
  feedback: {
    alignItems: "center",
    paddingHorizontal: spacing.xxxxxl - spacing.xs,
    paddingVertical: spacing.massivePlus - spacing.xs,
  },

  feedbackTitle: {
    fontSize: fontSize.bodyComfortable,
    fontWeight: fontWeight.bold,
    color: semantic.textPrimary,
    marginBottom: spacing.md,
  },

  feedbackText: {
    fontSize: fontSize.subtitle,
    lineHeight: 20,
    color: semantic.textSecondary,
    textAlign: "center",
    marginTop: spacing.lg,
  },

  emptyState: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: 42,
  },

  emptyTitle: {
    fontSize: fontSize.bodyComfortable,
    fontWeight: fontWeight.bold,
    color: semantic.textPrimary,
    textAlign: "center",
    marginTop: spacing.xl,
  },

  emptyDescription: {
    fontSize: fontSize.subtitle,
    lineHeight: 20,
    color: semantic.textSecondary,
    textAlign: "center",
    marginTop: spacing.lg - 1,
  },

  attribution: {
    fontSize: fontSize.bodyComfortable,
    color: semantic.textSecondary,
    textAlign: "center",
    marginTop: spacing.xxxxxl + spacing.xs,
  },

  // Destino selecionado
  selectionPanel: {
    marginTop: spacing.xxxxxl,
    padding: spacing.xxxxxl - spacing.xs,
    borderRadius: radii.card,
    backgroundColor: semantic.backgroundPrimary,
  },

  selectionTitle: {
    fontSize: fontSize.subtitleEmphasis,
    fontWeight: fontWeight.bold,
    color: semantic.textPrimary,
  },

  selectionAddress: {
    fontSize: fontSize.subtitle,
    lineHeight: 19,
    color: semantic.textSecondary,
    marginTop: spacing.xs + 2,
  },

  continueButton: {
    minHeight: 52,
    marginTop: spacing.xxxxxl - spacing.xs,
    borderRadius: radii.card,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: semantic.actionPositive,
  },

  continueButtonText: {
    fontSize: fontSize.subtitleEmphasis,
    fontWeight: fontWeight.bold,
    color: semantic.textInverse,
  },

  // Barra inferior
  bottomBar: {
    paddingHorizontal: spacing.huge,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxxxl - spacing.xs,
    borderTopWidth: 1,
    borderTopColor: semantic.borderDefault,
    backgroundColor: semantic.backgroundElevated,
  },

  // Ações de origem
  originActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.md,
  },

  // Escolha de destino no mapa
  mapPickerButton: {
    minHeight: 40,
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    backgroundColor: "transparent",
  },

  mapPickerText: {
    fontSize: fontSize.metric,
    fontWeight: fontWeight.bold,
    color: semantic.actionPositive,
    textAlign: "center",
  },
});
