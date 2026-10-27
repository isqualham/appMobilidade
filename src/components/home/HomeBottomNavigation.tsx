import type { ComponentProps } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Lucide } from "@react-native-vector-icons/lucide";
import { colors } from "../../theme";
import { styles } from "./HomeScreenStyles";

interface NavigationItem {
  label: string;
  icon: ComponentProps<typeof Lucide>["name"];
}

// Medidas e cores do menu original do passageiro, compartilhadas pelos dois perfis.
export function HomeBottomNavigation({ items, activeLabel, onSelect }: {
  items: readonly NavigationItem[];
  activeLabel: string;
  onSelect: (label: string) => void;
}) {
  return (
    <View style={styles.bottomNavigation}>
      {items.map(item => {
        const selected = item.label === activeLabel;
        return (
          <TouchableOpacity key={item.label} style={styles.navItem}
            accessibilityRole="button" accessibilityLabel={item.label}
            accessibilityState={{ selected }} onPress={() => onSelect(item.label)}>
            <Lucide name={item.icon} size={23} color={selected ? colors.neutral.carbon : "#475569"} />
            <Text style={selected ? styles.navTextActive : styles.navText}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
