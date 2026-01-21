import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    padding: 20,
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
  paddingVertical: 14,
  paddingHorizontal: 20,
  borderRadius: 12,
  borderWidth: 1,
  marginTop: 10, // <-- πιο κοντά στα dropdowns
  alignItems: "center",
},
startButtonText: {
  fontSize: 16,
  fontWeight: "600",
  textAlign: "center",
},
  field: {
    marginVertical: 10,
    width: "100%",
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  pickerWrap: {
    borderRadius: 8,
    overflow: "hidden",
  },
  previewCard: {
    marginTop: 20,
    borderRadius: 10,
    width: "100%",
    padding: 15,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
});

export const lightStyles = StyleSheet.create({
  button: {
    backgroundColor: "rgba(0,0,0,0.05)",
    borderColor: "rgba(0,0,0,0.1)",
    borderWidth: 1,
    borderRadius: 12,
  },
  buttonText: {
    color: "#333",
  },
  safe: { backgroundColor: "#f9f9f9" },
  container: { backgroundColor: "#f9f9f9" },
  text: { color: "#222" },
  textSecondary: { color: "#555" },
  card: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    padding: 10,
  },
});

export const darkStyles = StyleSheet.create({
  button: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
  },
  safe: { backgroundColor: "#121212" },
  container: { backgroundColor: "#121212" },
  text: { color: "#fff" },
  textSecondary: { color: "#aaa" },
  card: {
    backgroundColor: "#1e1e1e",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    padding: 10,
  },
});