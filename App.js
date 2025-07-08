import React, { useState, useEffect } from 'react';
import { SafeAreaView, FlatList, View, Text, Button, TextInput, Alert, StyleSheet } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

const SERVICE_UUID = '12345678-1234-5678-1234-56789abc0000';
const CFG_UUID     = '12345678-1234-5678-1234-56789abc0002';

export default function App() {
  const [manager] = useState(new BleManager());
  const [devices, setDevices] = useState([]);
  const [addressMap, setAddressMap] = useState({});

  useEffect(() => {
    return () => manager.destroy();
  }, []);

  const scan = () => {
    setDevices([]);
    manager.startDeviceScan([SERVICE_UUID], null, (err, dev) => {
      if (err) { Alert.alert('Error al escanear', err.message); return; }
      if (dev && !devices.find(d => d.id === dev.id)) {
        setDevices(prev => [...prev, dev]);
      }
    });
    setTimeout(() => manager.stopDeviceScan(), 10000);
  };

  const pair = async dev => {
    const addr = addressMap[dev.id];
    if (!addr || addr < 1 || addr > 255) {
      return Alert.alert('Dirección inválida', 'Debe ser 1–255');
    }
    try {
      const connected = await manager.connectToDevice(dev.id);
      await connected.discoverAllServicesAndCharacteristics();
      await connected.writeCharacteristicWithResponseForService(
        SERVICE_UUID,
        CFG_UUID,
        Uint8Array.of(addr).buffer
      );
      Alert.alert('¡Emparejado!', `Dirección ${addr} asignada`);
      await manager.cancelDeviceConnection(dev.id);
    } catch (e) {
      Alert.alert('Error al emparejar', e.message);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={styles.name}>{item.name||'Desconocido'}</Text>
      <Text style={styles.id}>{item.id}</Text>
      <TextInput
        style={styles.input}
        placeholder="Dir"
        keyboardType="numeric"
        onChangeText={v => setAddressMap(m => ({...m,[item.id]:Number(v)}))}
      />
      <Button title="Emparejar" onPress={() => pair(item)} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Button title="Buscar Módulos BLE" onPress={scan} />
      <FlatList
        data={devices}
        keyExtractor={d => d.id}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, margin:10 },
  row: { flexDirection:'row', alignItems:'center', marginVertical:5 },
  name: { flex:2 }, id: { flex:3, fontSize:10, color:'#555' },
  input: { flex:1, borderWidth:1, marginHorizontal:5, padding:3, width:50 }
});
