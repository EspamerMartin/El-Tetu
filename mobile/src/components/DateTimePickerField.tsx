import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Dialog, Portal, Text } from 'react-native-paper';
import { colors, spacing, borderRadius } from '@/theme';

interface DateTimePickerFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}

/**
 * DateTimePickerField - Campo para seleccionar fecha y hora
 * Formato esperado: YYYY-MM-DD HH:MM
 */
export const DateTimePickerField: React.FC<DateTimePickerFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder = 'YYYY-MM-DD HH:MM',
}) => {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [tempDate, setTempDate] = useState('');
  const [tempTime, setTempTime] = useState('');

  const handleOpen = () => {
    if (value) {
      const [date, time] = value.split(' ');
      setTempDate(date || '');
      setTempTime(time || '00:00');
    } else {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setTempDate(dateStr);
      setTempTime(timeStr);
    }
    setDialogVisible(true);
  };

  const handleSave = () => {
    if (tempDate && tempTime) {
      onChangeText(`${tempDate} ${tempTime}`);
    }
    setDialogVisible(false);
  };

  const handleDateChange = (text: string) => {
    let cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length >= 8) {
      const year = cleaned.slice(0, 4);
      const month = cleaned.slice(4, 6);
      const day = cleaned.slice(6, 8);
      setTempDate(`${year}-${month}-${day}`);
    } else {
      setTempDate(text);
    }
  };

  const handleTimeChange = (text: string) => {
    let cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length >= 4) {
      const hours = cleaned.slice(0, 2);
      const minutes = cleaned.slice(2, 4);
      setTempTime(`${hours}:${minutes}`);
    } else {
      setTempTime(text);
    }
  };

  const handleQuickDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const dateStr = date.toISOString().split('T')[0];
    setTempDate(dateStr);
  };

  return (
    <View style={styles.container}>
      <TextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        mode="outlined"
        style={styles.input}
        outlineColor={colors.border}
        activeOutlineColor={colors.primary}
        right={
          <TextInput.Icon
            icon="calendar"
            onPress={handleOpen}
            color={colors.primary}
          />
        }
      />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title style={styles.dialogTitle}>{label}</Dialog.Title>
          <Dialog.Content>
            <Text variant="labelLarge" style={styles.label}>Fecha (YYYY-MM-DD)</Text>
            <TextInput
              value={tempDate}
              onChangeText={handleDateChange}
              placeholder="2025-01-01"
              mode="outlined"
              style={styles.inputDialog}
              keyboardType="numeric"
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
            />

            <View style={styles.quickButtons}>
              <Button mode="outlined" compact onPress={() => handleQuickDate(0)}>
                Hoy
              </Button>
              <Button mode="outlined" compact onPress={() => handleQuickDate(7)}>
                +7 días
              </Button>
              <Button mode="outlined" compact onPress={() => handleQuickDate(30)}>
                +30 días
              </Button>
            </View>

            <Text variant="labelLarge" style={styles.label}>Hora (HH:MM)</Text>
            <TextInput
              value={tempTime}
              onChangeText={handleTimeChange}
              placeholder="00:00"
              mode="outlined"
              style={styles.inputDialog}
              keyboardType="numeric"
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
            />

            <View style={styles.quickButtons}>
              <Button mode="outlined" compact onPress={() => setTempTime('00:00')}>
                00:00
              </Button>
              <Button mode="outlined" compact onPress={() => setTempTime('12:00')}>
                12:00
              </Button>
              <Button mode="outlined" compact onPress={() => setTempTime('23:59')}>
                23:59
              </Button>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)} textColor={colors.textSecondary}>
              Cancelar
            </Button>
            <Button onPress={handleSave}>Aceptar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.white,
  },
  dialogTitle: {
    color: colors.primary,
  },
  inputDialog: {
    marginBottom: spacing.sm,
    backgroundColor: colors.white,
  },
  label: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    color: colors.text,
  },
  quickButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
    justifyContent: 'space-around',
  },
});
