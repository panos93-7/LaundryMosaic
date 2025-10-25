import { Button, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to LaundryHelper!</Text>
      <Button title="Start Laundry" onPress={() => navigation.navigate('Laundry')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24, marginBottom: 20,
  },
});