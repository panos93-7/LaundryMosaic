import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alert, Button, StyleSheet, Switch, Text, View } from 'react-native';

export default function LaundryScreen() {
  const [white, setWhite] = useState(false);
  const [color, setColor] = useState(false);
  const [black, setBlack] = useState(false);
  const [temperature, setTemperature] = useState(null);
  const [program, setProgram] = useState(null);
  const [message, setMessage] = useState('');

  // 🔹 Φόρτωση αποθηκευμένων επιλογών
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedWhite = await AsyncStorage.getItem('white');
        const savedColor = await AsyncStorage.getItem('color');
        const savedBlack = await AsyncStorage.getItem('black');
        const savedTemp = await AsyncStorage.getItem('temperature');
        const savedProgram = await AsyncStorage.getItem('program');

        if (savedWhite !== null) setWhite(JSON.parse(savedWhite));
        if (savedColor !== null) setColor(JSON.parse(savedColor));
        if (savedBlack !== null) setBlack(JSON.parse(savedBlack));
        if (savedTemp !== null) setTemperature(JSON.parse(savedTemp));
        if (savedProgram !== null) setProgram(savedProgram);
      } catch (e) {
        Alert.alert('Error', 'Failed to load saved settings');
      }
    };
    loadSettings();
  }, []);

  // 🔹 Αποθήκευση επιλογών όταν αλλάζουν
  useEffect(() => {
    AsyncStorage.setItem('white', JSON.stringify(white));
    AsyncStorage.setItem('color', JSON.stringify(color));
    AsyncStorage.setItem('black', JSON.stringify(black));
    AsyncStorage.setItem('temperature', JSON.stringify(temperature));
    AsyncStorage.setItem('program', program || '');
  }, [white, color, black, temperature, program]);

  // 🔹 Έλεγχος συνδυασμών
  const checkCombination = () => {
    if (!temperature) {
      setMessage('❗ Please select a washing temperature.');
      return;
    }
    if (!program) {
      setMessage('❗ Please select a washing program.');
      return;
    }

    const tempMsg = `Wash at ${temperature}°C.`;
    const programMsg = `Program: ${program}.`;

    if (white && (color || black)) {
      setMessage(`⚠️ Don’t mix white clothes with colored or dark ones! ${tempMsg} ${programMsg}`);
    } else if (color && black) {
      setMessage(`🟠 You can wash these together. ${tempMsg} ${programMsg}`);
    } else if (white && !color && !black) {
      setMessage(`✅ Whites only — good to go! ${tempMsg} ${programMsg}`);
    } else if (!white && !color && !black) {
      setMessage('❓ No clothes selected.');
    } else {
      setMessage(`👍 This combination is acceptable. ${tempMsg} ${programMsg}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select types of clothes:</Text>

      <View style={styles.switchRow}>
        <Text>⚪ Whites</Text>
        <Switch value={white} onValueChange={setWhite} />
      </View>

      <View style={styles.switchRow}>
        <Text>🟠 Colored</Text>
        <Switch value={color} onValueChange={setColor} />
      </View>

      <View style={styles.switchRow}>
        <Text>⚫ Dark</Text>
        <Switch value={black} onValueChange={setBlack} />
      </View>

      <Text style={styles.title}>Select washing temperature:</Text>
      <View style={styles.buttonRow}>
        {[30, 40, 60].map((temp) => (
          <Button
            key={temp}
            title={`${temp}°C`}
            onPress={() => setTemperature(temp)}
            color={temperature === temp ? '#007AFF' : '#999'}
          />
        ))}
      </View>

      <Text style={styles.title}>Select washing program:</Text>
      <View style={styles.buttonRow}>
        {['Short', 'Delicate', 'Normal'].map((p) => (
          <Button
            key={p}
            title={p}
            onPress={() => setProgram(p)}
            color={program === p ? '#007AFF' : '#999'}
          />
        ))}
      </View>

      <Button title="Check Compatibility" onPress={checkCombination} />

      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 10,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  message: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
});
