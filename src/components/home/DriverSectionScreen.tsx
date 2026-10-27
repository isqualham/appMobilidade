import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Lucide } from "@react-native-vector-icons/lucide";
import { useAuth } from "../../contexts/AuthContext";
import { colors, iconSizes } from "../../theme";
import { SideMenu } from "../navigation/SideMenu";
import { DriverNavigation } from "./DriverNavigation";
import { driverStyles as styles } from "./DriverHomeStyles";

export function DriverSectionScreen({ section }: { section: "services" | "earnings" }) {
  const { activeProfile, canUseProviderProfile } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();
  if (activeProfile !== "driver" || !canUseProviderProfile) return <Redirect href="/home" />;
  const services = section === "services";
  return (
    <View style={[styles.sectionContainer, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <View style={styles.sectionHeader}>
        <TouchableOpacity style={styles.roundButton} accessibilityRole="button" accessibilityLabel="Abrir menu" onPress={() => setMenuVisible(true)}>
          <Lucide name="menu" size={iconSizes.menu} color={colors.neutral.carbon} />
        </TouchableOpacity>
        <Text style={styles.title}>{services ? "Serviços" : "Ganhos"}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.sectionBody}>
        <Lucide name={services ? "history" : "wallet"} size={iconSizes.extraLarge} color={colors.feedback.success} />
        <Text style={styles.cardTitle}>{services ? "Serviços ainda indisponíveis" : "Resumo ainda indisponível"}</Text>
        <Text style={styles.sectionDescription}>
          {services ? "As solicitações e o histórico de viagens estarão disponíveis aqui em uma próxima etapa." : "Seus ganhos e a quantidade de serviços serão exibidos quando a consulta estiver disponível."}
        </Text>
      </ScrollView>
      <DriverNavigation active={section} />
      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </View>
  );
}
