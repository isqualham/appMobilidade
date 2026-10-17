export const typography = {
  fontFamily: {
    primary: "Manrope",
    monospace: "IBM Plex Mono",
  },

  fontWeight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
  },

  fontSize: {
    // Splash e autenticação
    splashLogo: 48,
    loginBackIcon: 28,
    loginHighlight: 38,
    loginButtonIcon: 22,

    // Destinos e métricas
    destinationHeaderIcon: 36,
    destinationMetricLarge: 42,
    titleHome: 25,

    // Textos auxiliares
    micro: 5,
    captionSmall: 6,
    caption: 7,
    label: 8,
    bodySmall: 9,
    body: 10,
    button: 11,
    subtitleSmall: 12,
    subtitle: 13,
    metric: 14,

    // Títulos
    headingSmall: 17,
    heading: 18,
    headingLarge: 20,
    titleSmall: 23,
    title: 27,

    // Destaques
    displaySmall: 28,
    display: 29,
    displayLarge: 34,
    hero: 36,

    // Tamanhos intermediários explícitos
    bodyEmphasis: 11,
    subtitleEmphasis: 15,
    bodyComfortable: 16,
    titleCompact: 24,
    titleEmphasis: 30,
    displayMedium: 32,
  },

  lineHeightRatio: {
    displayTight: 1.04,
    heroTight: 1.05,
    headingTight: 1.08,
    bodyCompact: 1.4,
    body: 1.5,
    bodyComfortable: 1.6,
    bodyLoose: 1.7,
  },

  letterSpacingEm: {
    display: -0.05,
    title: -0.04,
    label: 0.1,
    labelWide: 0.15,
    code: 0.2,
  },
} as const;
