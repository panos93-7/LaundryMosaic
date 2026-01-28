import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  Animated,
  Easing,
  PanResponder,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import i18n from "../i18n";

export default function MonthCalendar({ navigation, route }: any) {
  const washes = route.params?.washes || [];

  const initial = route.params?.selectedDay
    ? new Date(
        route.params.selectedDay.year,
        route.params.selectedDay.month,
        route.params.selectedDay.day
      )
    : new Date();

  const [currentDate, setCurrentDate] = useState(initial);
  const weekdays = i18n.t("calendar.weekdays", { returnObjects: true }) as string[];
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysArray = Array.from({ length: offset + daysInMonth }, (_, i) =>
    i < offset ? null : i - offset + 1
  );

  function hasWash(day: number) {
    return washes.some(
      (w: any) => w.day === day && w.month === month && w.year === year
    );
  }

  function animateToMonth(direction: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: direction * -300,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(headerAnim, {
        toValue: direction * -50,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(bgAnim, {
        toValue: direction * -20,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentDate((prev) => {
        const y = prev.getFullYear();
        const m = prev.getMonth();
        return new Date(y, m + direction, 1);
      });

      slideAnim.setValue(direction * 300);
      headerAnim.setValue(direction * 50);
      bgAnim.setValue(direction * 20);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(headerAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(bgAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 20,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -80) animateToMonth(1);
        else if (gesture.dx > 80) animateToMonth(-1);
      },
    })
  ).current;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0d0d0d" }}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: 20,
          paddingTop: 10,
        }}
        {...panResponder.panHandlers}
      >
        {/* BACKGROUND PARALLAX */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 200,
            backgroundColor: "#111",
            opacity: 0.4,
            transform: [{ translateX: bgAnim }],
          }}
        />

        {/* HEADER */}
        <Animated.View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            transform: [{ translateX: headerAnim }],
          }}
        >
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: "#fff", fontSize: 22 }}>
              {String(i18n.t("calendar.back"))}
            </Text>
          </TouchableOpacity>

          <Text
            style={{
              color: "#fff",
              fontSize: 22,
              fontWeight: "700",
            }}
          >
            {currentDate.toLocaleString(i18n.locale, { month: "long" })} {year}
          </Text>

          <View style={{ width: 22 }} />
        </Animated.View>

{/* WEEKDAY LABELS */}
<View
  style={{
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  }}
>
  {(i18n.t("calendar.weekdays", { returnObjects: true }) as unknown as string[]).map(
    (d: string) => (
      <Text
        key={d}
        style={{ color: "#bbb", width: 40, textAlign: "center" }}
      >
        {d}
      </Text>
    )
  )}
</View>

        {/* CALENDAR GRID */}
        <ScrollView showsVerticalScrollIndicator={false}>
          <Animated.View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            }}
          >
            {daysArray.map((day, index) => {
              const isToday =
                day &&
                new Date().getDate() === day &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <TouchableOpacity
                  key={index}
                  disabled={!day}
                  onPress={() => {
                    route.params?.onSelectDay?.(day, month, year);
                    navigation.goBack();
                  }}
                  style={{
                    width: "13.5%",
                    height: 60,
                    marginBottom: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 12,
                    backgroundColor: isToday ? "#2575fc" : "#141414",
                    borderWidth: 1,
                    borderColor: "#222",
                    opacity: day ? 1 : 0,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "700",
                      marginBottom: 4,
                    }}
                  >
                    {day}
                  </Text>

                  {day && hasWash(day) && (
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: "#ff8c00",
                      }}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}