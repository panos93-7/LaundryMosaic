import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import i18n from "../i18n";
import { generateLaundryAdviceCached } from "../utils/AI/AILaundryAssistant/generateLaundryAdviceCached";
import { hashQuery } from "../utils/AI/Core/hashQuery";

/* ---------------------------------------------------------
   Detect if the user typed Greek → force EL
--------------------------------------------------------- */
function detectQueryLanguage(text: string) {
  return /[α-ωΑ-Ω]/.test(text) ? "el" : "en";
}

export default function AILaundryAssistantScreen() {
  const navigation = useNavigation<any>();

  const [messages, setMessages] = useState<
    { from: "user" | "ai"; text: string }[]
  >([]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { from: "user", text: userMessage }]);
    setInput("");

    setLoading(true);

    try {
      /* ---------------------------------------------------------
         1) UI locale (from i18n)
      --------------------------------------------------------- */
      const uiLang = (i18n as any).language || "en";
      const normalizedLocale = uiLang.split("-")[0].toLowerCase();

      /* ---------------------------------------------------------
         2) Detect if user typed Greek → override locale
      --------------------------------------------------------- */
      const queryLang = detectQueryLanguage(userMessage);
      const finalLocale =
        queryLang === "el" ? "el" : normalizedLocale;

      /* ---------------------------------------------------------
         3) Canonical key for caching
      --------------------------------------------------------- */
      const normalizedQuery = userMessage.trim().toLowerCase();
      const canonicalKey = await hashQuery(normalizedQuery);

      /* ---------------------------------------------------------
         4) Ask AI (canonical + translated)
      --------------------------------------------------------- */
      const ai = await generateLaundryAdviceCached({
        canonicalKey,
        userQuery: userMessage,
        targetLocale: finalLocale,
      });

      if (!ai) {
        throw new Error("AI returned null");
      }

      const output = ai.translated || ai.canonical;

      /* ---------------------------------------------------------
         5) Format output for chat bubble
      --------------------------------------------------------- */
      const formatted = [
        `• ${output.recommended.temp}°C`,
        `• ${output.recommended.spin} rpm`,
        `• ${output.recommended.program}`,
        ...output.careInstructions.map((x) => `• ${x}`),
      ].join("\n");

      setMessages((prev) => [...prev, { from: "ai", text: formatted }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { from: "ai", text: String(i18n.t("aiAssistant.error")) },
      ]);
    }

    setLoading(false);
  };

  const suggested = [
    String(i18n.t("aiAssistant.suggest1")),
    String(i18n.t("aiAssistant.suggest2")),
    String(i18n.t("aiAssistant.suggest3")),
    String(i18n.t("aiAssistant.suggest4")),
  ];

  return (
    <LinearGradient
      colors={["#0f0c29", "#302b63", "#24243e"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1, padding: 20 }}>
        {/* HEADER */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 28,
              fontWeight: "700",
              flexShrink: 1,
              maxWidth: "80%",
            }}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            {String(i18n.t("aiAssistant.title"))}
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: "#ff6b6b", fontSize: 16 }}>
              {String(i18n.t("aiAssistant.close"))}
            </Text>
          </TouchableOpacity>
        </View>

        {/* SUGGESTED PROMPTS */}
        {messages.length === 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: 18,
                fontWeight: "600",
                marginBottom: 10,
              }}
            >
              {String(i18n.t("aiAssistant.suggestedTitle"))}
            </Text>

            {suggested.map((s, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  setInput(s);
                  setTimeout(sendMessage, 50);
                }}
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  padding: 12,
                  borderRadius: 10,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 16 }}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* CHAT */}
        <FlatList
          data={messages}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => (
            <View
              style={{
                alignSelf: item.from === "user" ? "flex-end" : "flex-start",
                backgroundColor:
                  item.from === "user"
                    ? "rgba(37,117,252,0.95)"
                    : "rgba(255,255,255,0.08)",
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 16,
                marginBottom: 12,
                maxWidth: "85%",
                borderWidth: item.from === "ai" ? 1 : 0,
                borderColor: "rgba(255,255,255,0.12)",
                shadowColor: "#000",
                shadowOpacity: 0.15,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 },
              }}
            >
              <Text style={{ color: "#fff", fontSize: 16, lineHeight: 22 }}>
                {item.text}
              </Text>
            </View>
          )}
          style={{ flex: 1 }}
        />

        {/* TYPING INDICATOR */}
        {loading && (
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: "rgba(255,255,255,0.08)",
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.12)",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <LottieView
              source={require("../typing.json")}
              autoPlay
              loop
              style={{
                width: 40,
                height: 24,
              }}
            />

            <Text
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: 14,
                fontStyle: "italic",
              }}
            >
              {String(i18n.t("aiAssistant.typing"))}
            </Text>
          </View>
        )}

        {/* INPUT */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={String(i18n.t("aiAssistant.placeholder"))}
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={{
                flex: 1,
                color: "#fff",
                fontSize: 16,
                paddingVertical: 8,
              }}
            />

            <TouchableOpacity
              onPress={sendMessage}
              disabled={loading}
              style={{
                marginLeft: 10,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={{
                    color: "#4CAF50",
                    fontSize: 18,
                    fontWeight: "700",
                  }}
                >
                  ➤
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}