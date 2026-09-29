import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type TabParamList = {
  Plan: undefined;
  Recipes: undefined;
  List: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Welcome: undefined;
  Market: undefined;
  Household: undefined;
  Budget: undefined;
  Kitchen: undefined;
  Generating: undefined;
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  RecipeDetail: { recipeId: string };
  BuildWeek: undefined;
  Swap: { entryId: string };
  Import: { url?: string } | undefined;
  // Same screens as onboarding, opened from the profile. Separate names so that
  // finishing onboarding does not leave these routes on the stack.
  EditMarket: undefined;
  EditHousehold: undefined;
  EditBudget: undefined;
  EditKitchen: undefined;
};

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
