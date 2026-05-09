import { Stack } from "expo-router";
import React from "react";
import { InboxScreen } from "../../src/features/chat/screens/InboxScreen";

export default function InboxRoute() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Bandeja de entrada",
          headerStyle: { backgroundColor: "#002147" },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "600", fontSize: 18},
        }}
      />
      <InboxScreen />
    </>
  );
}
