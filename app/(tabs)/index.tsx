import {
  addFavorite,
  FavoriteVerse,
  isFavorite,
  removeFavorite,
} from "@/lib/favorites";
import { getDailyPrayers, getDailyTheme, Prayer } from "@/lib/prayers";
import { getUser, StoredUser } from "@/lib/userStorage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Config ───────────────────────────────────────────────────────────────────
const API_KEY = process.env.EXPO_PUBLIC_BIBLE_API_KEY ?? "";
const BASE_URL = "https://rest.api.bible/v1";
const BIBLE_ID = "de4e12af7f28f599-02";
const API_HEADERS = { "api-key": API_KEY, "Content-Type": "application/json" };

const POPULAR_VERSES = [
  { id: "JHN.3.16", ref: "John 3:16" },
  { id: "PSA.23.1", ref: "Psalm 23:1" },
  { id: "PSA.119.105", ref: "Psalm 119:105" },
  { id: "ROM.8.28", ref: "Romans 8:28" },
  { id: "PHP.4.13", ref: "Philippians 4:13" },
  { id: "ISA.40.31", ref: "Isaiah 40:31" },
  { id: "PRO.3.5", ref: "Proverbs 3:5" },
  { id: "MAT.11.28", ref: "Matthew 11:28" },
  { id: "PSA.46.1", ref: "Psalm 46:1" },
  { id: "JER.29.11", ref: "Jeremiah 29:11" },
  { id: "PHP.4.7", ref: "Philippians 4:7" },
  { id: "ROM.12.2", ref: "Romans 12:2" },
  { id: "ISA.41.10", ref: "Isaiah 41:10" },
  { id: "MAT.6.33", ref: "Matthew 6:33" },
  { id: "PSA.27.1", ref: "Psalm 27:1" },
  { id: "2TI.1.7", ref: "2 Timothy 1:7" },
  { id: "HEB.11.1", ref: "Hebrews 11:1" },
  { id: "JHN.14.6", ref: "John 14:6" },
  { id: "REV.21.4", ref: "Revelation 21:4" },
  { id: "GAL.5.22", ref: "Galatians 5:22" },
];

const BROWSE_CATEGORIES = [
  {
    label: "Old Testament",
    filter: "old-testament",
    description: "39 books · Genesis to Malachi",
  },
  {
    label: "New Testament",
    filter: "new-testament",
    description: "27 books · Matthew to Revelation",
  },
  { label: "Psalms", filter: "psalms", description: "150 chapters of worship" },
  {
    label: "Proverbs",
    filter: "proverbs",
    description: "Wisdom for everyday life",
  },
  {
    label: "Gospels",
    filter: "gospels",
    description: "Matthew, Mark, Luke & John",
  },
];

const QUICK_ACTIONS = [
  {
    title: "Read Bible",
    subtitle: "Browse all 66 books",
    filter: "all",
    plans: false,
  },
  {
    title: "Prayer Journal",
    subtitle: "Write today's prayer",
    filter: null,
    plans: false,
  },
  {
    title: "Favourites",
    subtitle: "Your saved verses",
    filter: null,
    plans: true,
  },
  {
    title: "Reading Plans",
    subtitle: "Track your progress",
    filter: null,
    plans: true,
  },
];

type VerseOfDay = { text: string; reference: string; id: string };

function getDayIndex() {
  return (
    Math.floor((Date.now() - new Date("2025-01-01").getTime()) / 86400000) %
    POPULAR_VERSES.length
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function goToBible(filter: string) {
  router.push({ pathname: "/(tabs)/bible", params: { filter } });
}

export default function HomeScreen() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [verseOfDay, setVerseOfDay] = useState<VerseOfDay | null>(null);
  const [verseLoading, setVerseLoading] = useState(true);
  const [verseFaved, setVerseFaved] = useState(false);
  const [showPrayers, setShowPrayers] = useState(false);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [dailyTheme, setDailyTheme] = useState({ title: "", focus: "" });

  useEffect(() => {
    getUser()
      .then(setUser)
      .catch(() => {});
    setDailyTheme(getDailyTheme());
    getDailyPrayers().then(setPrayers);
  }, []);

  useEffect(() => {
    (async () => {
      setVerseLoading(true);
      const pick = POPULAR_VERSES[getDayIndex()];
      try {
        const p = new URLSearchParams({
          "content-type": "text",
          "include-verse-numbers": "false",
          "include-titles": "false",
          "include-notes": "false",
        });
        const res = await fetch(
          `${BASE_URL}/bibles/${BIBLE_ID}/verses/${pick.id}?${p}`,
          { headers: API_HEADERS },
        );
        if (!res.ok) throw new Error("");
        const json = await res.json();
        const text = (json.data?.content ?? "")
          .replace(/<[^>]+>/g, "")
          .replace(/\s+/g, " ")
          .trim();
        setVerseOfDay({ text, reference: pick.ref, id: pick.id });
        setVerseFaved(await isFavorite(pick.id));
      } catch {
        setVerseOfDay({
          id: "JHN.3.16",
          text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
          reference: "John 3:16",
        });
      } finally {
        setVerseLoading(false);
      }
    })();
  }, []);

  const handleSaveVerse = async () => {
    if (!verseOfDay) return;
    if (verseFaved) {
      await removeFavorite(verseOfDay.id);
      setVerseFaved(false);
    } else {
      const parts = verseOfDay.id.split(".");
      const fav: FavoriteVerse = {
        id: verseOfDay.id,
        book: verseOfDay.reference.split(" ").slice(0, -1).join(" "),
        chapter: parts[1] ?? "",
        verse: parts[2] ?? "",
        text: verseOfDay.text,
        savedAt: Date.now(),
      };
      await addFavorite(fav);
      setVerseFaved(true);
    }
  };

  const handleShare = () =>
    verseOfDay &&
    Share.share({
      message: `"${verseOfDay.text}" — ${verseOfDay.reference}\n\nShared from HolyBible App`,
    });

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0E3B2E"
        translucent={false}
      />
      <SafeAreaView
        className="flex-1 mt-12 bg-[#F6F4EE]"
        edges={["bottom", "left", "right"]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        >
          {/* ── Hero ── */}
          <View className="mb-6 rounded-[24px] bg-[#0E3B2E] p-6">
            <View className="mb-5 flex-row items-center justify-between">
              <View>
                <Text className="text-[13px] text-[#A8C4B8]">
                  {getGreeting()}
                </Text>
                <Text className="mt-[2px] text-[22px] font-bold text-white">
                  {user?.name ?? "Friend"}
                </Text>
              </View>
              <View className="h-[42px] w-[42px] items-center justify-center rounded-full bg-[#1D5A47]">
                <Text className="text-[16px] font-bold text-white">
                  {user?.initial ?? "🙏"}
                </Text>
              </View>
            </View>

            <Text className="mb-2 text-[26px] font-extrabold leading-[34px] text-white">
              Grow daily{"\n"}in the Word
            </Text>
            <Text className="mb-5 text-[13px] leading-[21px] text-[#A8C4B8]">
              Read, reflect, and keep your spiritual journey organized.
            </Text>

            <TouchableOpacity
              onPress={() => goToBible("all")}
              className="items-center rounded-[14px] bg-[#E5C77A] py-[13px]"
            >
              <Text className="text-[15px] font-bold text-[#0E3B2E]">
                Continue Reading →
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Verse of the Day ── */}
          <View className="mb-6">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-[17px] font-bold text-[#1A1A1A]">
                Verse of the Day
              </Text>
              <View className="rounded-full bg-[#E5C77A] px-3 py-[4px]">
                <Text className="text-[11px] font-bold text-[#0E3B2E]">
                  {new Date().toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </View>
            </View>

            <View className="rounded-[20px] border border-[#EDE9DC] bg-[#FFFDF8] p-5">
              {verseLoading ? (
                <View className="items-center py-6">
                  <ActivityIndicator color="#0E3B2E" />
                  <Text className="mt-2 text-[13px] text-[#888]">
                    Loading verse...
                  </Text>
                </View>
              ) : (
                <>
                  <Text className="mb-1 text-[44px] leading-[36px] text-[#E5C77A]">
                    {" "}
                    &quot;
                  </Text>
                  <Text className="mb-3 text-[16px] font-semibold italic leading-[26px] text-[#1A1A1A]">
                    {verseOfDay?.text}
                  </Text>
                  <Text className="mb-5 text-[13px] font-bold text-[#C49A28]">
                    — {verseOfDay?.reference}
                  </Text>
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={handleSaveVerse}
                      className="flex-1 items-center rounded-[12px] py-[11px]"
                      style={{
                        backgroundColor: verseFaved ? "#0E3B2E" : "#FEF3C7",
                      }}
                    >
                      <Text
                        className="text-[13px] font-bold"
                        style={{ color: verseFaved ? "#E5C77A" : "#C49A28" }}
                      >
                        {verseFaved ? "★  Saved" : "☆  Save Verse"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleShare}
                      className="flex-1 items-center rounded-[12px] border border-[#EDE9DC] py-[11px]"
                    >
                      <Text className="text-[13px] font-bold text-[#4A4A4A]">
                        ↗ Share
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* ── Quick Actions ── */}
          <View className="mb-6">
            <Text className="mb-3 text-[17px] font-bold text-[#1A1A1A]">
              Quick Actions
            </Text>
            <View className="flex-row flex-wrap justify-between gap-3">
              {QUICK_ACTIONS.map((item) => (
                <TouchableOpacity
                  key={item.title}
                  onPress={() =>
                    item.plans
                      ? router.push("/(tabs)/plans")
                      : item.filter
                        ? goToBible(item.filter)
                        : null
                  }
                  className="min-h-[96px] w-[48%] rounded-[18px] border border-[#EDE9DC] bg-white p-4"
                  activeOpacity={0.75}
                >
                  <Text className="mb-1 text-[15px] font-bold text-[#1A1A1A]">
                    {item.title}
                  </Text>
                  <Text className="text-[12px] leading-[18px] text-[#888]">
                    {item.subtitle}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Browse ── */}
          <View className="mb-6">
            <Text className="mb-3 text-[17px] font-bold text-[#1A1A1A]">
              Browse
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
            >
              {BROWSE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.filter}
                  onPress={() => goToBible(cat.filter)}
                  className="rounded-[16px] border border-[#EDE9DC] bg-white px-4 py-3"
                  style={{ minWidth: 140 }}
                  activeOpacity={0.75}
                >
                  <Text className="text-[13px] font-bold text-[#0E3B2E]">
                    {cat.label}
                  </Text>
                  <Text className="mt-[3px] text-[11px] text-[#888]">
                    {cat.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* ── Reading Plans ── */}
          <View className="mb-6">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-[17px] font-bold text-[#1A1A1A]">
                Reading Plans
              </Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/plans")}>
                <Text className="text-[13px] font-semibold text-[#0E3B2E]">
                  See all →
                </Text>
              </TouchableOpacity>
            </View>

            {[
              {
                title: "21 Days with Psalms",
                progress: "12 / 21 Days",
                pct: 57,
              },
              {
                title: "New Testament Journey",
                progress: "34% Complete",
                pct: 34,
              },
            ].map((plan) => (
              <TouchableOpacity
                key={plan.title}
                onPress={() => router.push("/(tabs)/plans")}
                className="mb-3 rounded-[18px] border border-[#EDE9DC] bg-white p-4"
                activeOpacity={0.75}
              >
                <View className="mb-3 flex-row items-center justify-between">
                  <Text className="text-[14px] font-bold text-[#1A1A1A]">
                    {plan.title}
                  </Text>
                  <View className="rounded-full bg-[#FEF3C7] px-3 py-[5px]">
                    <Text className="text-[11px] font-bold text-[#C49A28]">
                      Open
                    </Text>
                  </View>
                </View>
                {/* Progress bar */}
                <View className="h-[5px] overflow-hidden rounded-full bg-[#EDE9DC]">
                  <View
                    className="h-full rounded-full bg-[#0E3B2E]"
                    style={{ width: `${plan.pct}%` }}
                  />
                </View>
                <Text className="mt-2 text-[12px] text-[#888]">
                  {plan.progress}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Prayer Focus ── */}
          <View className="mb-2">
            <Text className="mb-3 text-[17px] font-bold text-[#1A1A1A]">
              {"Today's Prayer Focus"}
            </Text>
            <View className="rounded-[20px] border border-[#EDE9DC] bg-[#FFFDF8] p-5">
              <View className="mb-3 flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-[#0E3B2E]">
                  <Text className="text-[18px]">🙏</Text>
                </View>
                <Text className="text-[16px] font-bold text-[#1A1A1A]">
                  {dailyTheme.title || "Strength and Wisdom"}
                </Text>
              </View>
              <Text className="mb-4 text-[13px] leading-[21px] text-[#4A4A4A]">
                {dailyTheme.focus ||
                  "Take a moment to pray for guidance, peace, and courage for the day ahead."}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowPrayers(!showPrayers);
                }}
                className="self-start rounded-[12px] bg-[#0E3B2E] px-5 py-[11px]"
              >
                <Text className="text-[13px] font-bold text-[#E5C77A]">
                  {showPrayers ? "Close Prayers" : "Start Prayer"}
                </Text>
              </TouchableOpacity>
            </View>

            {showPrayers && (
              <View className="mt-3 gap-3">
                {prayers.map((prayer) => (
                  <View
                    key={prayer.id}
                    className="rounded-[18px] border border-[#EDE9DC] bg-white p-4"
                  >
                    <View className="mb-2 flex-row items-center justify-between">
                      <Text className="text-[15px] font-bold text-[#1A1A1A]">
                        {prayer.title}
                      </Text>
                      <Text className="text-[11px] font-medium text-[#C49A28] uppercase">
                        {prayer.category} · {prayer.duration}
                      </Text>
                    </View>
                    <Text className="text-[13px] leading-[20px] text-[#4A4A4A] italic">
                      &quot;{prayer.content}&quot;
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
