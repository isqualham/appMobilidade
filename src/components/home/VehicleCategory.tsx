import { Text, View, type StyleProp, type TextStyle } from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import { colors, iconSizes, spacing } from "../../theme";

// O nome exibido pertence ao catálogo da API; apenas o ícone é escolhido aqui.
export function categoryIcon(name?: string): "motorbike" | "car-front" | undefined {
  if (name === "Moto") return "motorbike";
  if (["Carro Econômico", "Carro Premium", "Carro Porta-Malas Grande"].includes(name ?? "")) return "car-front";
  return undefined;
}

export function VehicleCategory({ name, textStyle }: { name: string; textStyle?: StyleProp<TextStyle> }) {
  const icon = categoryIcon(name);
  return <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flexShrink: 1 }}>
    {icon && <Lucide name={icon} size={iconSizes.large} color={colors.neutral.carbon} accessible={false} />}
    <Text style={[textStyle, { flexShrink: 1 }]}>{name}</Text>
  </View>;
}
