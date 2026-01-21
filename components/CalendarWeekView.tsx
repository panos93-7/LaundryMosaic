import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function CalendarWeekView({ washes, onSelectDay }: any) {
  const [selected, setSelected] = useState<number>(new Date().getDay());

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  function handlePress(index: number) {
    setSelected(index);
    onSelectDay(index);
  }

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 24,
      }}
    >
      {days.map((day, index) => {
        const isSelected = selected === index;
        const hasWash = washes.some((w: any) => w.dayIndex === index);

        return (
          <TouchableOpacity
            key={day}
            onPress={() => handlePress(index)}
            style={{
              alignItems: "center",
              paddingVertical: 10,
              paddingHorizontal: 8,
              borderRadius: 12,
              backgroundColor: isSelected ? "#2575fc" : "#141414",
              borderWidth: isSelected ? 0 : 1,
              borderColor: "#222",
              width: 45,
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

            {hasWash && (
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
    </View>
  );
}