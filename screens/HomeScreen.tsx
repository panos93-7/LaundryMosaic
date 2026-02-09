import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import Toast from "react-native-root-toast";
import { SafeAreaView } from "react-native-safe-area-context";

import { FeatureGrid } from "../components/FeatureGrid";
import { darkTheme, lightTheme } from "../constants/theme";
import i18n from "../i18n";
import { useLanguageStore } from "../store/languageStore";
import { useScanStore } from "../store/scanStore";


/* ---------------------------------------------------------
   STYLES
--------------------------------------------------------- */

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    padding: 20,
    paddingBottom: 120, // ⭐ FIX #1
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 18,
    marginBottom: 20,
  },

  startButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    alignItems: "center",
  },

  startButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  field: {
    marginVertical: 10,
    width: "100%",
  },

  label: {
    fontSize: 16,
    marginBottom: 5,
  },

  previewCard: {
    marginTop: 20,
    borderRadius: 18,
    width: "100%",
    padding: 20,
  },
});

const lightStyles = StyleSheet.create({
  text: { color: "#222" },
  textSecondary: { color: "#555" },
  card: {
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 12,
    padding: 10,
  },
});

const darkStyles = StyleSheet.create({
  text: { color: "#fff" },
  textSecondary: { color: "#aaa" },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 10,
  },
});

/* ---------------------------------------------------------
   PROGRAM TYPES
--------------------------------------------------------- */

type Program = {
  temp: number;
  spin: number;
  program: string;
};

type WashingPrograms = {
  [fabric: string]: {
    [color: string]: Program;
  };
};

/* ---------------------------------------------------------
   PROGRAM DATA
--------------------------------------------------------- */

const getWashingPrograms = (): WashingPrograms => ({
  cotton: {
    white: {
      temp: 60,
      spin: 1000,
      program: i18n.t("programs.cottonIntensive"),
    },
    colored: {
      temp: 40,
      spin: 1000,
      program: i18n.t("programs.cottonColors"),
    },
    dark: {
      temp: 40,
      spin: 800,
      program: i18n.t("programs.darkCare"),
    },
  },

  synthetics: {
    white: {
      temp: 40,
      spin: 800,
      program: i18n.t("programs.synthetics"),
    },
    colored: {
      temp: 30,
      spin: 800,
      program: i18n.t("programs.syntheticsColor"),
    },
    dark: {
      temp: 30,
      spin: 600,
      program: i18n.t("programs.darkSynthetic"),
    },
  },

  wool: {
    any: {
      temp: 20,
      spin: 400,
      program: i18n.t("programs.woolHand"),
    },
  },

  delicate: {
    any: {
      temp: 30,
      spin: 600,
      program: i18n.t("programs.delicates"),
    },
  },
});

/* ---------------------------------------------------------
   COMPONENT
--------------------------------------------------------- */

export default function HomeScreen({ navigation }: any) {
  const scan = useScanStore();

  const [fabric, setFabric] = useState("cotton");
  const [color, setColor] = useState("white");
  const [autoProgram, setAutoProgram] = useState<Program | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<LottieView>(null);

  const [fabricOpen, setFabricOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const languageItems = [
  { label: "🇬🇷 Ελληνικά", value: "el" },
  { label: "🇬🇧 English", value: "en" },
  { label: "🇪🇸 Español", value: "es" },
  { label: "🇫🇷 Français", value: "fr" },
  { label: "🇩🇪 Deutsch", value: "de" },
  { label: "🇮🇹 Italiano", value: "it" },
  { label: "🇹🇷 Türkçe", value: "tr" },
  { label: "🇷🇺 Русский", value: "ru" },
  { label: "🇯🇵 日本語", value: "ja" },
  { label: "🇰🇷 한국어", value: "ko" },
  { label: "🇹🇼 繁體中文", value: "zh-TW" },
  { label: "🇵🇹 Português (PT)", value: "pt-PT" },
  { label: "🇧🇷 Português (BR)", value: "pt-BR" }
];



  const fabricItems = [
    { label: i18n.t("fabricValues.cotton"), value: "cotton" },
    { label: i18n.t("fabricValues.synthetics"), value: "synthetics" },
    { label: i18n.t("fabricValues.wool"), value: "wool" },
    { label: i18n.t("fabricValues.delicate"), value: "delicate" },
  ];

  const colorItems = [
    { label: i18n.t("colorValues.white"), value: "white" },
    { label: i18n.t("colorValues.dark"), value: "dark" },
    { label: i18n.t("colorValues.colored"), value: "colored" },
  ];

  const [language, setLanguage] = useState(i18n.locale);
  const setGlobalLanguage = useLanguageStore((s) => s.setLanguage);

  /* Load theme */
  useEffect(() => {
    AsyncStorage.getItem("darkMode").then((saved) => {
      if (saved) setIsDarkMode(saved === "true");
    });
  }, []);
    /* Reset animation when fabric/color changes */
  useEffect(() => {
    animationRef.current?.reset();
    setIsRunning(false);
    setAutoProgram(null);
  }, [fabric, color]);

  const getProgram = (fabric: string, color: string): Program | null => {
    const programs = getWashingPrograms();
    const category = programs[fabric];
    if (!category) return null;
    return category[color] || category["any"] || null;
  };

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);

    await AsyncStorage.setItem("darkMode", newTheme.toString());

    Animated.timing(themeFade, {
      toValue: newTheme ? 1 : 0,
      duration: 450,
      useNativeDriver: true,
    }).start();

    Toast.show(newTheme ? "🌙 Dark Mode ON" : "☀️ Light Mode ON", {
      duration: Toast.durations.SHORT,
      position: Toast.positions.BOTTOM,
    });
  };

  const handleLanguageChange = (value: string) => {
  setLanguage(value);
  i18n.locale = value;
  setGlobalLanguage(value); // ⭐ ενημερώνει ΟΛΟ το app
  useLanguageStore.getState().setLanguage(value);
};

  const handleStart = () => {
    const program = getProgram(fabric, color);
    setAutoProgram(program);
    setIsRunning(true);
    animationRef.current?.play();

    if (!program) {
      Toast.show("❌ No program available.", {
        duration: Toast.durations.SHORT,
        position: Toast.positions.BOTTOM,
      });
      return;
    }

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    Toast.show(
      `🧼 Program: ${program.program} | Temp: ${program.temp}°C | Spin: ${program.spin} rpm`,
      {
        duration: Toast.durations.LONG,
        position: Toast.positions.BOTTOM,
      }
    );
  };

  const savePreset = async () => {
    await AsyncStorage.setItem(
      "laundryPreset",
      JSON.stringify({ fabric, color })
    );

    Toast.show("💾 Preset Saved!", {
      duration: Toast.durations.SHORT,
      position: Toast.positions.BOTTOM,
    });
  };

  const loadPreset = async () => {
    const preset = await AsyncStorage.getItem("laundryPreset");
    if (!preset) return;

    const { fabric: f, color: c } = JSON.parse(preset);
    setFabric(f);
    setColor(c);

    Toast.show("📂 Preset Loaded!", {
      duration: Toast.durations.SHORT,
      position: Toast.positions.BOTTOM,
    });
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  /* CROSSFADE ANIMATION VALUE */
  const themeFade = useRef(new Animated.Value(isDarkMode ? 1 : 0)).current;

  return (
    <View style={{ flex: 1 }}>
      {/* LIGHT GRADIENT (always visible) */}
      <LinearGradient
        colors={["#e5e5ea", "#d4d4d8"]}
        style={StyleSheet.absoluteFill}
      />

      {/* DARK GRADIENT (crossfades in/out) */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { opacity: themeFade }
        ]}
      >
        <LinearGradient
          colors={["#0f0c29", "#302b63", "#24243e"]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* CONTENT */}
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.container}>
                  
      {/* TITLE */}
          <Text
            style={[
              styles.title,
              isDarkMode ? darkStyles.text : lightStyles.text,
            ]}
          >
            LaundryMosaic
          </Text>

          <Text
            style={[
              styles.subtitle,
              isDarkMode ? darkStyles.textSecondary : lightStyles.textSecondary,
            ]}
          >
            {i18n.t("screenTitle")}
          </Text>

          {/* THEME TOGGLE */}
          <TouchableOpacity
            style={[styles.startButton, theme.button]}
            onPress={toggleTheme}
          >
            <Text style={[styles.startButtonText, theme.buttonText]}>
              {isDarkMode
                ? `☀️ ${i18n.t("lightMode")}`
                : `🌙 ${i18n.t("darkMode")}`}
            </Text>
          </TouchableOpacity>

          {/* LANGUAGE PICKER */}
          <View style={styles.field}>
            <Text
              style={[
                styles.label,
                isDarkMode ? darkStyles.text : lightStyles.text,
              ]}
            >
              {i18n.t("language")}
            </Text>

            <LinearGradient
              colors={
                isDarkMode
                  ? ["#8e2de2", "#4a00e0"]
                  : ["#e5e5ea", "#d4d4d8"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                padding: 2,
                borderRadius: 14,
                marginBottom: 10,
                height: 52,
                zIndex: 3000,
              }}
            >
              <View
                style={{
                  backgroundColor: isDarkMode
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.05)",
                  borderRadius: 12,
                }}
              >
                <DropDownPicker
                  listMode="SCROLLVIEW"
                  open={languageOpen}
                  value={language}
                  items={languageItems}
                  setOpen={setLanguageOpen}
                  setValue={(val: any) => {
                    const newLang =
                      typeof val === "function" ? val(language) : val;
                    if (newLang) handleLanguageChange(newLang);
                  }}
                  setItems={() => {}}
                  placeholder=" "
                  style={{
                    backgroundColor: "transparent",
                    borderColor: "transparent",
                  }}
                  dropDownContainerStyle={{
                    backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
                    borderColor: "transparent",
                    borderRadius: 12,
                    maxHeight: languageItems.length * 52,
                  }}
                  textStyle={{
                    color: isDarkMode ? "#fff" : "#000",
                    fontSize: 16,
                  }}
                  zIndex={3000}
                  zIndexInverse={4000}
                />
              </View>
            </LinearGradient>
          </View>

          {/* FABRIC PICKER */}
          <View style={styles.field}>
            <Text
              style={[
                styles.label,
                isDarkMode ? darkStyles.text : lightStyles.text,
              ]}
            >
              {i18n.t("fabricTypeLabel")}
            </Text>

            <LinearGradient
              colors={
                isDarkMode
                  ? ["#8e2de2", "#4a00e0"]
                  : ["#e5e5ea", "#d4d4d8"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                padding: 2,
                borderRadius: 14,
                marginBottom: 10,
                zIndex: 2000,
              }}
            >
              <View
                style={{
                  backgroundColor: isDarkMode
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.05)",
                  borderRadius: 12,
                }}
              >
                <DropDownPicker
                  listMode="SCROLLVIEW"
                  open={fabricOpen}
                  value={fabric}
                  items={fabricItems}
                  setOpen={setFabricOpen}
                  setValue={setFabric}
                  setItems={() => {}}
                  placeholder=" "
                  style={{
                    backgroundColor: "transparent",
                    borderColor: "transparent",
                  }}
                  dropDownContainerStyle={{
                    backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
                    borderColor: "transparent",
                    borderRadius: 12,
                  }}
                  textStyle={{
                    color: isDarkMode ? "#fff" : "#000",
                    fontSize: 16,
                  }}
                />
              </View>
            </LinearGradient>
          </View>

          {/* COLOR PICKER */}
          <View style={styles.field}>
            <Text
              style={[
                styles.label,
                isDarkMode ? darkStyles.text : lightStyles.text,
              ]}
            >
              {i18n.t("fabricColorLabel")}
            </Text>

            <LinearGradient
              colors={
                isDarkMode
                  ? ["#8e2de2", "#4a00e0"]
                  : ["#e5e5ea", "#d4d4d8"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                padding: 2,
                borderRadius: 14,
                marginBottom: 10,
                zIndex: 1000,
              }}
            >
              <View
                style={{
                  backgroundColor: isDarkMode
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.05)",
                  borderRadius: 12,
                }}
              >
                <DropDownPicker
                  listMode="SCROLLVIEW"
                  open={colorOpen}
                  value={color}
                  items={colorItems}
                  setOpen={setColorOpen}
                  setValue={setColor}
                  setItems={() => {}}
                  placeholder=" "
                  style={{
                    backgroundColor: "transparent",
                    borderColor: "transparent",
                  }}
                  dropDownContainerStyle={{
                    backgroundColor: isDarkMode ? "#1e1e1e" : "#fff",
                    borderColor: "transparent",
                    borderRadius: 12,
                  }}
                  textStyle={{
                    color: isDarkMode ? "#fff" : "#000",
                    fontSize: 16,
                  }}
                />
              </View>
            </LinearGradient>
          </View>
                    {/* PREVIEW CARD */}
          <Animated.View
            style={[
              styles.previewCard,
              isDarkMode ? darkStyles.card : lightStyles.card,
              {
                opacity: fadeAnim,
                borderWidth: isDarkMode ? 0.5 : 0.3,
                borderColor: isDarkMode
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(0,0,0,0.1)",
                shadowColor: "#000",
                shadowOpacity: isDarkMode ? 0.4 : 0.15,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
              },
            ]}
          >
            <Text
              style={[
                isDarkMode ? darkStyles.text : lightStyles.text,
                {
                  marginBottom: 12,
                  fontSize: 22,
                  fontWeight: "bold",
                },
              ]}
            >
              🧺 {i18n.t("laundryProgram")}
            </Text>

            <Text style={isDarkMode ? darkStyles.text : lightStyles.text}>
              {i18n.t("fabricLabel")}: {i18n.t(`fabricValues.${fabric}`)}
            </Text>

            <Text style={isDarkMode ? darkStyles.text : lightStyles.text}>
              {i18n.t("colorLabel")}: {i18n.t(`colorValues.${color}`)}
            </Text>

            {autoProgram && (
              <View style={{ marginTop: 10 }}>
                <Text style={isDarkMode ? darkStyles.text : lightStyles.text}>
                  {i18n.t("programLabel")}: {autoProgram.program}
                </Text>

                <Text style={isDarkMode ? darkStyles.text : lightStyles.text}>
                  {i18n.t("temperatureLabel")}: {autoProgram.temp}°C
                </Text>

                <Text style={isDarkMode ? darkStyles.text : lightStyles.text}>
                  {i18n.t("spinSpeedLabel")}: {autoProgram.spin} {i18n.t("rpm")}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* ANIMATION */}
          {isRunning && (
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
                marginTop: 20,
              }}
            >
              <LottieView
                ref={animationRef}
                source={require("../WashingMachine.json")}
                autoPlay
                loop
                style={{ width: 260, height: 260 }}
              />
            </View>
          )}

          {/* START BUTTON */}
          <TouchableOpacity
            style={[
              styles.startButton,
              {
                marginTop: 25,
                borderRadius: 14,
                paddingVertical: 14,
                backgroundColor: isDarkMode
                  ? "rgba(255,255,255,0.15)"
                  : "rgba(0,0,0,0.15)",
              },
            ]}
            onPress={handleStart}
          >
            <Text
              style={[
                styles.startButtonText,
                isDarkMode ? darkTheme.buttonText : lightTheme.buttonText,
                { fontSize: 18 },
              ]}
            >
              🧼 {i18n.t("start")}
            </Text>
          </TouchableOpacity>

          {/* SAVE PRESET */}
          <TouchableOpacity
            style={[
              styles.startButton,
              {
                marginTop: 12,
                borderRadius: 14,
                paddingVertical: 14,
                backgroundColor: isDarkMode
                  ? "rgba(255,255,255,0.12)"
                  : "rgba(0,0,0,0.12)",
              },
            ]}
            onPress={savePreset}
          >
            <Text
              style={[
                styles.startButtonText,
                isDarkMode ? darkTheme.buttonText : lightTheme.buttonText,
                { fontSize: 16 },
              ]}
            >
              💾 {i18n.t("savePreset")}
            </Text>
          </TouchableOpacity>

          {/* LOAD PRESET */}
          <TouchableOpacity
            style={[
              styles.startButton,
              {
                marginTop: 12,
                borderRadius: 14,
                paddingVertical: 14,
                backgroundColor: isDarkMode
                  ? "rgba(255,255,255,0.12)"
                  : "rgba(0,0,0,0.12)",
              },
            ]}
            onPress={loadPreset}
          >
            <Text
              style={[
                styles.startButtonText,
                isDarkMode ? darkTheme.buttonText : lightTheme.buttonText,
                { fontSize: 16 },
              ]}
            >
              📂 {i18n.t("loadPreset")}
            </Text>
          </TouchableOpacity>

          {/* FEATURE GRID WRAPPER — ⭐ FIX #2 */}
          <View style={{ width: "100%", marginTop: 20 }}>
  <FeatureGrid 
    isDarkMode={isDarkMode} 
    language={language}   // ⭐ ADD THIS
  />
</View>

          <View style={{ height: 80 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}