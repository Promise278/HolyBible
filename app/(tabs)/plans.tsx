import { FavoriteVerse, getFavorites, removeFavorite } from "@/lib/favorites";
import {
  getReadingPlans,
  ReadingPlan,
  resetPlan,
  updatePlanProgress,
} from "@/lib/plans";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Tab = "plans" | "favorites";

export default function Plans() {
  const [activeTab, setActiveTab] = useState<Tab>("plans");
  const [favorites, setFavorites] = useState<FavoriteVerse[]>([]);
  const [readingPlans, setReadingPlans] = useState<ReadingPlan[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const loadData = async () => {
    const [favs, plans] = await Promise.all([
      getFavorites(),
      getReadingPlans(),
    ]);
    setFavorites(favs);
    setReadingPlans(plans);
  };

  const handleUpdateProgress = async (id: string) => {
    const updated = await updatePlanProgress(id);
    setReadingPlans(updated);
  };

  const handleResetPlan = (plan: ReadingPlan) => {
    Alert.alert(
      "Reset Plan",
      `Are you sure you want to reset your progress for "${plan.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            const updated = await resetPlan(plan.id);
            setReadingPlans(updated);
          },
        },
      ],
    );
  };

  const handleRemoveFavorite = (verse: FavoriteVerse) => {
    Alert.alert(
      "Remove Favorite",
      `Remove ${verse.book} ${verse.chapter}:${verse.verse} from favorites?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await removeFavorite(verse.id);
            setFavorites((prev) => prev.filter((v) => v.id !== verse.id));
          },
        },
      ],
    );
  };

  const formatDate = (ts: number | undefined) =>
    ts
      ? new Date(ts).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "";

  // ── Plans ─────────────────────────────────────────────────────────────────
  const renderPlans = () => (
    <View>
      <Text className="mb-1 text-[32px] font-extrabold text-[#1A1A1A]">
        Reading Plans
      </Text>
      <Text className="mb-6 text-[14px] text-[#888]">
        Track your daily walk with God and stay consistent.
      </Text>

      {readingPlans.map((plan) => {
        const pct = Math.round((plan.done / plan.total) * 100);
        const started = plan.done > 0;

        return (
          <View
            key={plan.id}
            className="mb-4 rounded-[24px] border border-[#EDE9DC] bg-[#FFF) p-5"
            style={{ backgroundColor: "#FFF" }}
          >
            <View className="mb-4 flex-row items-start gap-4">
              <View className="h-14 w-14 items-center justify-center rounded-[18px] bg-[#FEF3C7]">
                <Text className="text-[28px]">{plan.emoji}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[17px] font-bold text-[#1A1A1A]">
                  {plan.title}
                </Text>
                <Text className="mt-[4px] text-[13px] leading-[20px] text-[#888]">
                  {plan.description}
                </Text>
              </View>
            </View>

            <View className="mb-4 h-[8px] overflow-hidden rounded-full bg-[#F3F4F6]">
              <View
                className="h-full rounded-full bg-[#0E3B2E]"
                style={{ width: `${pct}%` }}
              />
            </View>

            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-[14px] font-bold text-[#1A1A1A]">
                  {plan.done} / {plan.total} Chapters
                </Text>
                {plan.lastRead && (
                  <Text className="text-[11px] text-[#888] mt-1">
                    Last read: {formatDate(plan.lastRead)}
                  </Text>
                )}
              </View>

              <View className="flex-row gap-2">
                {started && (
                  <TouchableOpacity
                    onPress={() => handleResetPlan(plan)}
                    className="rounded-full bg-[#F3F4F6] px-4 py-2"
                  >
                    <Text className="text-[12px] font-bold text-[#888]">
                      Reset
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => handleUpdateProgress(plan.id)}
                  className="rounded-full px-5 py-2"
                  style={{
                    backgroundColor: pct === 100 ? "#0E3B2E" : "#E5C77A",
                  }}
                >
                  <Text
                    className="text-[12px] font-bold"
                    style={{ color: pct === 100 ? "#E5C77A" : "#0E3B2E" }}
                  >
                    {pct === 100
                      ? "Completed ✨"
                      : started
                        ? "Mark Chapter Done"
                        : "Start Journey"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );

  // ── Favorites ────────────────────────────────────────────────────────────
  const renderFavorites = () => (
    <View>
      <Text className="mb-1 text-[32px] font-extrabold text-[#1A1A1A]">
        Favorites
      </Text>
      <Text className="mb-6 text-[14px] text-[#888]">
        {favorites.length} verses saved for your reflection.
      </Text>

      {favorites.length === 0 && (
        <View className="items-center rounded-[24px] border border-[#EDE9DC] bg-white py-20 px-10">
          <Text className="text-[48px] mb-4">⭐</Text>
          <Text className="text-[18px] font-bold text-[#1A1A1A] mb-2">
            Your favorites will appear here
          </Text>
          <Text className="text-center text-[14px] text-[#888]">
            Go to the Bible tab and tap the star icon to save verses that speak
            to you.
          </Text>
        </View>
      )}

      <View className="gap-y-4">
        {favorites.map((verse) => (
          <View
            key={verse.id}
            className="rounded-[24px] border border-[#EDE9DC] bg-white p-6"
          >
            <View className="mb-4 flex-row items-center justify-between">
              <View className="rounded-full bg-[#0E3B2E] px-4 py-2">
                <Text className="text-[11px] font-bold text-[#E5C77A]">
                  {verse.book} {verse.chapter}:{verse.verse}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveFavorite(verse)}
                className="p-2"
              >
                <Text className="text-[11px] font-bold text-[#EF4444]">
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
            <Text className="text-[16px] italic leading-[28px] text-[#1A1A1A]">
              &quot;{verse.text}&quot;
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F6F4EE]">
      <View className="flex-row p-6 pt-2 gap-6">
        <TouchableOpacity onPress={() => setActiveTab("plans")}>
          <Text
            className={`text-[18px] font-extrabold ${activeTab === "plans" ? "text-[#0E3B2E]" : "text-[#BBB]"}`}
          >
            Plans
          </Text>
          {activeTab === "plans" && (
            <View className="h-1 w-6 bg-[#C49A28] mt-1 rounded-full" />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab("favorites")}>
          <Text
            className={`text-[18px] font-extrabold ${activeTab === "favorites" ? "text-[#0E3B2E]" : "text-[#BBB]"}`}
          >
            Favorites
          </Text>
          {activeTab === "favorites" && (
            <View className="h-1 w-6 bg-[#C49A28] mt-1 rounded-full" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
      >
        {activeTab === "plans" ? renderPlans() : renderFavorites()}
      </ScrollView>
    </SafeAreaView>
  );
}
