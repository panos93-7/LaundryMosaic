import { Audio } from "expo-av";
import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Easing, Platform } from "react-native";

type CustomSplashProps = {
  onFinish?: () => void;
};

export function CustomSplash({ onFinish }: CustomSplashProps) {
  const containerOpacity = useRef(new Animated.Value(1)).current;

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const loaderOpacity = useRef(new Animated.Value(0)).current;
  const microcopyOpacity = useRef(new Animated.Value(0)).current;

  // ⭐ Change this to switch sounds WITHOUT build
  const SOUND_VARIANT = 1;

  const soundFiles = {
    1: require("../assets/sounds/startup1.mp3"), // Fairy sparkle whoosh
    2: require("../assets/sounds/startup2.mp3"),
    3: require("../assets/sounds/startup3.mp3"),
  };

  useEffect(() => {
    let sound: Audio.Sound;

    async function playStartupSound() {
      sound = new Audio.Sound();
      await sound.loadAsync(soundFiles[SOUND_VARIANT]);

      // ⭐ Volume tuning (premium, not intrusive)
      const volume = Platform.OS === "ios" ? 0.22 : 0.16;

      await sound.setVolumeAsync(volume);
      await sound.playAsync();
    }

    // ⭐ Play sound EXACTLY when animation starts
    playStartupSound();

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
      setTimeout(() => {
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start(() => {
          onFinish?.();
        });
      }, 2000);
    });

    return () => {
      if (sound) sound.unloadAsync();
    };
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
        Optimizing AI intelligence…
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