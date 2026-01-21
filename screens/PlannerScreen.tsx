import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AddWashModal from "../components/AddWashModal";
import { useUserStore } from "../store/userStore";
import { cancelReminder, scheduleSmartReminder } from "../utils/smartReminder";

export default function PlannerScreen({ navigation }: any) {
  const [plans, setPlans] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWash, setEditingWash] = useState<any | null>(null);

  const [selectedDay, setSelectedDay] = useState({
    day: new Date().getDate(),
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });

  const isPremium = useUserStore(
  (s) => s.isPremiumMonthly || s.isPremiumAnnual || s.isPro
);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.96,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    async function loadPlans() {
      try {
        const saved = await AsyncStorage.getItem("PLANS");
        if (saved) setPlans(JSON.parse(saved));
      } catch (err) {
        console.log("Failed to load plans", err);
      }
    }
    loadPlans();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("PLANS", JSON.stringify(plans));
  }, [plans]);

  async function handleSaveWash(wash: any) {
    const fullWash = {
      ...wash,
      day: selectedDay.day,
      month: selectedDay.month,
      year: selectedDay.year,
    };

    if (editingWash) {
      if (editingWash.reminderId) {
        await cancelReminder(editingWash.reminderId);
      }

      const newReminderId = await scheduleSmartReminder(fullWash);

      setPlans((prev) =>
        prev.map((p) =>
          p === editingWash ? { ...fullWash, reminderId: newReminderId } : p
        )
      );

      setEditingWash(null);
      return;
    }

    const reminderId = await scheduleSmartReminder(fullWash);

    setPlans((prev) => [...prev, { ...fullWash, reminderId }]);
  }

  async function handleDeleteWash(wash: any) {
    Alert.alert("Delete Wash", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (wash.reminderId) await cancelReminder(wash.reminderId);
          setPlans((prev) => prev.filter((p) => p !== wash));
        },
      },
    ]);
  }

  const washesForSelectedDay = plans.filter(
    (p) =>
      p.day === selectedDay.day &&
      p.month === selectedDay.month &&
      p.year === selectedDay.year
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0d0d0d" }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
        
        {/* PREMIUM HEADER */}
        <View style={{ marginBottom: 28 }}>
          <Text
            style={{
              fontSize: 34,
              fontWeight: "800",
              color: "#fff",
              marginBottom: 20,
            }}
          >
            Laundry Planner
          </Text>

          {/* HISTORY BUTTON */}
          <TouchableOpacity
            onPress={() => {
              if (!isPremium) {
                navigation.navigate("PremiumMonthlyPaywall", {
                  source: "history",
                });
                return;
              }
              navigation.navigate("History");
            }}
            style={{ marginBottom: 14 }}
          >
            <LinearGradient
              colors={["#4f9cff", "#2575fc"]}
              style={{
                padding: 14,
                borderRadius: 14,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                View History
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* CALENDAR BUTTON */}
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("MonthCalendar", {
                washes: plans,
                selectedDay: selectedDay,
                onSelectDay: (day: number, month: number, year: number) => {
                  setSelectedDay({ day, month, year });
                },
              })
            }
          >
            <LinearGradient
              colors={["#6a11cb", "#2575fc"]}
              style={{
                padding: 14,
                borderRadius: 14,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                Open Calendar
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Text style={{ color: "#bbb", marginBottom: 28 }}>
          Organize your weekly washes, set reminders, and stay on top of your laundry routine.
        </Text>

        {/* ADD NEW WASH BUTTON */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity
            onPress={() => {
              animatePress();
              setEditingWash(null);
              setModalVisible(true);
            }}
          >
            <LinearGradient
              colors={["#6a11cb", "#2575fc"]}
              style={{
                padding: 18,
                borderRadius: 20,
                marginBottom: 28,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 20,
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                Add New Wash
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* SELECTED DAY TITLE */}
        <Text
          style={{
            color: "#fff",
            fontSize: 22,
            fontWeight: "700",
            marginBottom: 16,
          }}
        >
          {selectedDay.day}/{selectedDay.month + 1}/{selectedDay.year} Washes
        </Text>

        {/* EMPTY STATE */}
        {washesForSelectedDay.length === 0 && (
          <View
            style={{
              padding: 24,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.05)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
              alignItems: "center",
              marginBottom: 40,
            }}
          >
            <Text style={{ color: "#ccc", fontSize: 16 }}>
              No washes for this day.
            </Text>
          </View>
        )}

        {/* WASH LIST */}
        {washesForSelectedDay.map((plan, index) => (
          <TouchableOpacity
            key={index}
            onLongPress={() => handleDeleteWash(plan)}
            onPress={() => {
              setEditingWash(plan);
              setModalVisible(true);
            }}
            style={{
              padding: 18,
              borderRadius: 16,
              backgroundColor: "#141414",
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#222",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>
              {plan.title}
            </Text>
            <Text style={{ color: "#bbb", marginTop: 4 }}>{plan.time}</Text>
            <Text style={{ color: "#888", marginTop: 4 }}>
              {plan.type} wash
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide">
        <AddWashModal
          onClose={() => {
            setEditingWash(null);
            setModalVisible(false);
          }}
          onSave={(wash: any) => {
            handleSaveWash(wash);
            setModalVisible(false);
          }}
          initialData={editingWash}
          selectedDay={selectedDay}
        />
      </Modal>
    </SafeAreaView>
  );
}