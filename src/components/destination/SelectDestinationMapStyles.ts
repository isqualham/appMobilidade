import { StyleSheet } from "react-native";
import { colors, radii, spacing, typography } from "../../theme";

export const styles = StyleSheet.create({
  // Tela e mapa
  container: {
    flex: 1,
    backgroundColor: colors.map.background,
  },

  map: {
    ...StyleSheet.absoluteFill,
  },

  // Carregamento
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.neutral.surface,
    padding: spacing.screenGutter,
    gap: spacing.lg,
  },

  loadingText: {
    color: colors.neutral.carbonSecondary,
    fontSize: typography.fontSize.body,
  },

  // Marcador central do mapa
  centerMarkerContainer: {
    position: "absolute",
    top: "42%",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  centerMarker: {
    width: 72,
    height: 72,
    borderRadius: radii.cardLarge,
    backgroundColor: colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  markerShadow: {
    position: "absolute",
    width: 18,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: "#00000022",
    bottom: -14,
  },

  // Botão de voltar
  backButton: {
    position: "absolute",
    top: 58,
    left: spacing.screenGutter,
    width: 54,
    height: 54,
    borderRadius: radii.full,
    backgroundColor: colors.neutral.white,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },

  // Centralizar na localização atual
  myLocationButton: {
    position: "absolute",
    right: spacing.screenGutter,
    bottom: 340,
    width: 54,
    height: 54,
    borderRadius: radii.card,
    backgroundColor: colors.neutral.white,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },

  // Painel inferior
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.neutral.white,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    paddingHorizontal: spacing.screenGutter,
    paddingTop: spacing.mdPlus,
    paddingBottom: spacing.massivePlus,
    gap: spacing.lg,
  },

  handle: {
    width: 56,
    height: 6,
    borderRadius: radii.full,
    backgroundColor: colors.neutral.mist,
    alignSelf: "center",
    marginBottom: spacing.xs,
  },

  title: {
    color: colors.neutral.carbon,
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: -0.8,
  },

  subtitle: {
    color: colors.neutral.muted,
    fontSize: typography.fontSize.body,
    marginTop: -spacing.sm,
  },

  // Endereço selecionado
  addressCard: {
    minHeight: 88,
    borderWidth: 1.5,
    borderColor: colors.neutral.border,
    borderRadius: radii.cardLarge,
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    gap: spacing.lg,
  },

  addressTextContainer: {
    flex: 1,
    gap: spacing.xs,
  },

  addressTitle: {
    color: colors.neutral.carbon,
    fontSize: typography.fontSize.subtitle,
    fontWeight: typography.fontWeight.bold,
  },

  addressDescription: {
    color: colors.neutral.muted,
    fontSize: typography.fontSize.body,
    lineHeight: 18,
  },

  // Edição do endereço
  addressEditor: {
    minHeight: 64,
    borderWidth: 1.5,
    borderColor: colors.neutral.border,
    borderRadius: radii.cardLarge,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },

  addressInput: {
    flex: 1,
    color: colors.neutral.carbon,
    fontSize: typography.fontSize.body,
    paddingVertical: spacing.lg,
  },

  editAction: {
    color: colors.feedback.success,
    fontWeight: typography.fontWeight.bold,
    padding: spacing.sm,
  },

  // Confirmação do destino
  confirmButton: {
    minHeight: 76,
    borderRadius: radii.cardLarge,
    backgroundColor: colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },

  confirmButtonDisabled: {
    opacity: 0.55,
  },

  confirmButtonText: {
    color: colors.neutral.carbon,
    fontSize: typography.fontSize.subtitle,
    fontWeight: typography.fontWeight.extrabold,
  },

  // Mensagens de erro
  errorText: {
    color: colors.feedback.danger,
    fontSize: typography.fontSize.body,
    textAlign: "center",
  },

  // Botão de retorno em caso de falha
  retryButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: radii.button,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },

  retryButtonText: {
    color: colors.neutral.carbon,
    fontWeight: typography.fontWeight.bold,
  },
});
