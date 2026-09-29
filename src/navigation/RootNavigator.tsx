import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BuildWeekScreen } from '../screens/BuildWeekScreen';
import { ImportScreen } from '../screens/ImportScreen';
import { PlanScreen } from '../screens/PlanScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { RecipeDetailScreen } from '../screens/RecipeDetailScreen';
import { RecipesScreen } from '../screens/RecipesScreen';
import { ShoppingListScreen } from '../screens/ShoppingListScreen';
import { SwapScreen } from '../screens/SwapScreen';
import { BudgetScreen } from '../screens/onboarding/BudgetScreen';
import { GeneratingScreen } from '../screens/onboarding/GeneratingScreen';
import { HouseholdScreen } from '../screens/onboarding/HouseholdScreen';
import { KitchenScreen } from '../screens/onboarding/KitchenScreen';
import { MarketScreen } from '../screens/onboarding/MarketScreen';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { useAppStore } from '../store/useAppStore';
import { colors } from '../theme';
import { TabBar } from './TabBar';
import type { RootStackParamList, TabParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function Tabs() {
  return (
    <Tab.Navigator tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Plan" component={PlanScreen} options={{ title: 'Semana' }} />
      <Tab.Screen name="Recipes" component={RecipesScreen} options={{ title: 'Receitas' }} />
      <Tab.Screen name="List" component={ShoppingListScreen} options={{ title: 'Lista' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const onboarded = useAppStore((s) => s.onboarded);
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.cream },
        animation: 'slide_from_right',
      }}
    >
      {onboarded ? (
        <Stack.Group>
          <Stack.Screen name="Tabs" component={Tabs} />
          <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
          <Stack.Screen name="BuildWeek" component={BuildWeekScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="EditMarket" component={MarketScreen} />
          <Stack.Screen name="EditHousehold" component={HouseholdScreen} />
          <Stack.Screen name="EditBudget" component={BudgetScreen} />
          <Stack.Screen name="EditKitchen" component={KitchenScreen} />
          <Stack.Group screenOptions={{ presentation: 'modal', animation: 'slide_from_bottom' }}>
            <Stack.Screen name="Swap" component={SwapScreen} />
            <Stack.Screen name="Import" component={ImportScreen} />
          </Stack.Group>
        </Stack.Group>
      ) : (
        <Stack.Group>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Market" component={MarketScreen} />
          <Stack.Screen name="Household" component={HouseholdScreen} />
          <Stack.Screen name="Budget" component={BudgetScreen} />
          <Stack.Screen name="Kitchen" component={KitchenScreen} />
          <Stack.Screen name="Generating" component={GeneratingScreen} options={{ animation: 'fade', gestureEnabled: false }} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
