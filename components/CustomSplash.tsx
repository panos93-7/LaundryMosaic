import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Easing } from "react-native";

type CustomSplashProps = {
  onFinish?: () => void;
};

export function CustomSplash({ onFinish }: CustomSplashProps) {
  // Fade-out wrapper
  const containerOpacity = useRef(new Animated.Value(1)).current;

  // Your existing animations
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const loaderOpacity = useRef(new Animated.Value(0)).current;
  const microcopyOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Run your existing sequence
    Animated.sequence([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),

      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),

      Animated.timing(loaderOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),

      Animated.timing(microcopyOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // After your animation finishes → fade out
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        onFinish?.(); // Notify AppNavigator
      });
    });
  }, []);

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: containerOpacity,
        backgroundColor: "#0f0c29",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
      }}
    >
      <Animated.Text
        style={{
          opacity: logoOpacity,
          color: "#fff",
          fontSize: 34,
          fontWeight: "700",
          marginBottom: 10,
          letterSpacing: 0.5,
        }}
      >
        LaundryMosaic
      </Animated.Text>

      <Animated.Text
        style={{
          opacity: taglineOpacity,
          color: "#ffffffaa",
          fontSize: 16,
          marginBottom: 30,
          textAlign: "center",
        }}
      >
        Optimizing AI fabric intelligence…
      </Animated.Text>

      <Animated.View style={{ opacity: loaderOpacity }}>
        <ActivityIndicator size="large" color="#fff" />
      </Animated.View>

      <Animated.Text
        style={{
          opacity: microcopyOpacity,
          color: "#ffffff66",
          marginTop: 20,
          fontSize: 14,
        }}
      >
        Your premium experience is loading…
      </Animated.Text>
    </Animated.View>
  );
}