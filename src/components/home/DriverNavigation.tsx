import { View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme";
import { HomeBottomNavigation } from "./HomeBottomNavigation";

const items = [
  { label: "Início", icon: "house", route: "/home", key: "home" },
  { label: "Serviços", icon: "history", route: "/driver-services", key: "services" },
  { label: "Ganhos", icon: "wallet", route: "/driver-earnings", key: "earnings" },
] as const;

export type DriverSection = typeof items[number]["key"];

export function DriverNavigation({ active, onNavigate }: { active: DriverSection; onNavigate?: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingBottom: Math.max(0, insets.bottom - 4), backgroundColor: colors.semantic.backgroundElevated }}>
      <HomeBottomNavigation items={items} activeLabel={items.find(item => item.key === active)?.label ?? "Início"}
        onSelect={label => {
          const item = items.find(candidate => candidate.label === label);
          if (!item || item.key === active) return;
          onNavigate?.();
          router.navigate(item.route);
        }} />
    </View>
  );
}
