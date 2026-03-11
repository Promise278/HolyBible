import { router } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignInScreen() {
  const handleSkip = () => {
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F6F4EE] px-6 items-center justify-center">
      <View className="items-center mb-10">
        <View className="h-20 w-20 bg-[#0E3B2E] rounded-3xl items-center justify-center mb-6">
          <Text className="text-4xl">🙏</Text>
        </View>
        <Text className="text-3xl font-bold text-[#1A1A1A] mb-2">
          Holy Bible
        </Text>
        <Text className="text-[15px] text-[#666] text-center px-4">
          Read, reflect, and grow in your spiritual journey.
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleSkip}
        className="w-full bg-[#0E3B2E] h-[58px] rounded-2xl items-center justify-center mb-4"
      >
        <Text className="text-white font-bold text-[16px]">Get Started</Text>
      </TouchableOpacity>

      <Text className="text-[13px] text-[#888]">
        By continuing, you agree to our Terms and Privacy Policy.
      </Text>
    </SafeAreaView>
  );
}
