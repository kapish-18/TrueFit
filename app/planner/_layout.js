import { Stack } from 'expo-router';
import { colors } from '../../src/theme/theme';

export default function PlannerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    />
  );
}
