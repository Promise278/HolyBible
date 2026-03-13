import { BibleBreakdown, getBibleBreakdown } from "@/lib/ai";
import { loadPreferredVoice, speakText, stopVoice } from "@/lib/elevenlabs";
import {
  addFavorite,
  FavoriteVerse,
  isFavorite,
  removeFavorite,
} from "@/lib/favorites";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── API Config ───────────────────────────────────────────────────────────────
const API_KEY = process.env.EXPO_PUBLIC_BIBLE_API_KEY ?? "";
const BASE_URL = "https://rest.api.bible/v1";
const API_HEADERS = { "api-key": API_KEY, "Content-Type": "application/json" };

// ─── Bible Versions ───────────────────────────────────────────────────────────
const BIBLE_VERSIONS = [
  {
    id: "de4e12af7f28f599-02",
    label: "KJV",
    name: "King James Version",
    description: "The classic 1611 English translation",
    color: "#0E3B2E",
    light: "#EAF5EF",
  },
  {
    id: "65eec8e0b60e656b-01",
    label: "MSG",
    name: "The Message",
    description: "Contemporary language paraphrase",
    color: "#7C3AED",
    light: "#EDE9FE",
  },
];

// ─── OT / NT Book ID sets ─────────────────────────────────────────────────────
const OT_BOOK_NAMES = new Set([
  "Genesis",
  "Exodus",
  "Leviticus",
  "Numbers",
  "Deuteronomy",
  "Joshua",
  "Judges",
  "Ruth",
  "1 Samuel",
  "2 Samuel",
  "1 Kings",
  "2 Kings",
  "1 Chronicles",
  "2 Chronicles",
  "Ezra",
  "Nehemiah",
  "Esther",
  "Job",
  "Psalms",
  "Proverbs",
  "Ecclesiastes",
  "Song of Solomon",
  "Isaiah",
  "Jeremiah",
  "Lamentations",
  "Ezekiel",
  "Daniel",
  "Hosea",
  "Joel",
  "Amos",
  "Obadiah",
  "Jonah",
  "Micah",
  "Nahum",
  "Habakkuk",
  "Zephaniah",
  "Haggai",
  "Zechariah",
  "Malachi",
]);

const NT_BOOK_NAMES = new Set([
  "Matthew",
  "Mark",
  "Luke",
  "John",
  "Acts",
  "Romans",
  "1 Corinthians",
  "2 Corinthians",
  "Galatians",
  "Ephesians",
  "Philippians",
  "Colossians",
  "1 Thessalonians",
  "2 Thessalonians",
  "1 Timothy",
  "2 Timothy",
  "Titus",
  "Philemon",
  "Hebrews",
  "James",
  "1 Peter",
  "2 Peter",
  "1 John",
  "2 John",
  "3 John",
  "Jude",
  "Revelation",
]);

const GOSPEL_BOOK_NAMES = new Set(["Matthew", "Mark", "Luke", "John"]);
const PSALM_BOOK_NAMES = new Set(["Psalms"]);
const PROVERB_BOOK_NAMES = new Set(["Proverbs"]);

// ─── Filter definitions ───────────────────────────────────────────────────────
type FilterKey =
  | "all"
  | "old-testament"
  | "new-testament"
  | "psalms"
  | "proverbs"
  | "gospels";

const FILTER_META: Record<
  FilterKey,
  { label: string; color: string; light: string; names: Set<string> | null }
> = {
  all: { label: "All Books", color: "#1A1A1A", light: "#F5F5F5", names: null },
  "old-testament": {
    label: "Old Testament",
    color: "#78350F",
    light: "#FEF3C7",
    names: OT_BOOK_NAMES,
  },
  "new-testament": {
    label: "New Testament",
    color: "#1D4ED8",
    light: "#DBEAFE",
    names: NT_BOOK_NAMES,
  },
  psalms: {
    label: "Psalms",
    color: "#0E3B2E",
    light: "#DCFCE7",
    names: PSALM_BOOK_NAMES,
  },
  proverbs: {
    label: "Proverbs",
    color: "#7C3AED",
    light: "#EDE9FE",
    names: PROVERB_BOOK_NAMES,
  },
  gospels: {
    label: "Gospels",
    color: "#B45309",
    light: "#FEF9C3",
    names: GOSPEL_BOOK_NAMES,
  },
};

const FILTER_TABS: FilterKey[] = [
  "all",
  "old-testament",
  "new-testament",
  "gospels",
];

// ─── Types ────────────────────────────────────────────────────────────────────
type BibleVersion = (typeof BIBLE_VERSIONS)[number];
type Book = { id: string; name: string; nameLong: string };
type Chapter = { id: string; number: string; bookId: string };
type Verse = { id: string; number: string; text: string; faved: boolean };

function parseVerses(
  rawText: string,
  bookId: string,
  chapterId: string,
): Verse[] {
  const cleaned = rawText
    .replace(/¶\s*/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();
  const parts = cleaned.split(/\[(\d+)\]/).filter(Boolean);
  const verses: Verse[] = [];
  for (let i = 0; i < parts.length - 1; i += 2) {
    const number = parts[i];
    const text = parts[i + 1]?.trim();
    if (number && text) {
      const chNum = chapterId.split(".")[1] ?? chapterId;
      verses.push({
        id: `${bookId}.${chNum}.${number}`,
        number,
        text,
        faved: false,
      });
    }
  }
  return verses;
}

export default function Bible() {
  const params = useLocalSearchParams<{ filter?: string }>();

  const [version, setVersion] = useState<BibleVersion>(BIBLE_VERSIONS[0]);
  const [showVersionPicker, setShowVersionPicker] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const [allBooks, setAllBooks] = useState<Book[]>([]); // full list from API
  const [books, setBooks] = useState<Book[]>([]); // filtered view
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [verses, setVerses] = useState<Verse[]>([]);

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [speaking, setSpeaking] = useState(false);
  const [speakingVerse, setSpeakingVerse] = useState<string | null>(null);

  // AI Breakdown State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiBreakdown, setAiBreakdown] = useState<BibleBreakdown | null>(null);

  const stopSpeech = useCallback(async () => {
    stopVoice();
    setSpeaking(false);
    setSpeakingVerse(null);
  }, []);

  const loadBooks = useCallback(
    async (bibleId: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BASE_URL}/bibles/${bibleId}/books`, {
          headers: API_HEADERS,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setAllBooks(json.data ?? []);
      } catch (e: any) {
        const is403 = e.message?.includes("403") || e.message?.includes("401");
        setError(
          is403
            ? `"${version.name}" requires a Bible ID or a higher API.Bible plan.`
            : "Failed to load books. Check your internet connection.",
        );
      } finally {
        setLoading(false);
      }
    },
    [version.name],
  );

  const handleSelectBook = useCallback(
    async (book: Book) => {
      await stopSpeech();
      setSelectedBook(book);
      setSelectedChapter(null);
      setVerses([]);
      setChapters([]);
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${BASE_URL}/bibles/${version.id}/books/${book.id}/chapters`,
          { headers: API_HEADERS },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setChapters(
          (json.data ?? []).filter((ch: Chapter) => ch.number !== "intro"),
        );
      } catch {
        setError("Failed to load chapters.");
      } finally {
        setLoading(false);
      }
    },
    [version.id, stopSpeech],
  );

  useFocusEffect(
    useCallback(() => {
      const incoming = (params.filter ?? "all") as FilterKey;
      if (incoming in FILTER_META) {
        setActiveFilter(incoming);
      }
    }, [params.filter]),
  );

  useEffect(() => {
    stopSpeech();
    setSelectedBook(null);
    setSelectedChapter(null);
    setChapters([]);
    setVerses([]);
    loadBooks(version.id);
  }, [version.id, stopSpeech, loadBooks]);

  useEffect(() => {
    loadPreferredVoice();
  }, []);

  useEffect(() => {
    const meta = FILTER_META[activeFilter];
    if (!meta.names) {
      setBooks(allBooks);
    } else {
      setBooks(allBooks.filter((b) => meta.names!.has(b.name)));
    }
  }, [allBooks, activeFilter]);

  useEffect(() => {
    if (
      (activeFilter === "psalms" || activeFilter === "proverbs") &&
      allBooks.length > 0 &&
      !selectedBook
    ) {
      const targetId = activeFilter === "psalms" ? "psalms" : "proverbs";
      const book = allBooks.find((b) => b.name === targetId);
      if (book) handleSelectBook(book);
    }
  }, [activeFilter, allBooks, selectedBook, handleSelectBook]);

  const handleSpeakVerse = useCallback(
    async (verse: Verse) => {
      try {
        if (speaking && speakingVerse === verse.id) {
          await stopSpeech();
          return;
        }

        await stopSpeech();
        setSpeaking(true);
        setSpeakingVerse(verse.id);

        const announcement = `${selectedBook?.name ?? ""} chapter ${selectedChapter?.number ?? ""} verse ${verse.number}`;

        await speakText(announcement);

        await speakText(verse.text);
      } catch (error) {
        console.log("Voice error:", error);
      } finally {
        setSpeaking(false);
        setSpeakingVerse(null);
      }
    },
    [speaking, speakingVerse, stopSpeech, selectedBook, selectedChapter],
  );

  const handleReadChapter = useCallback(async () => {
    try {
      if (speaking && speakingVerse === "ALL") {
        await stopSpeech();
        return;
      }

      if (!verses.length || !selectedBook || !selectedChapter) return;

      await stopSpeech();
      setSpeaking(true);
      setSpeakingVerse("ALL");

      const chapterAnnouncement = `${selectedBook.name} chapter ${selectedChapter.number}`;

      await speakText(chapterAnnouncement);

      const fullText = verses
        .map((v) => `Verse ${v.number}. ${v.text}`)
        .join(" ");

      await speakText(fullText);
    } catch (error) {
      console.log("Read chapter error:", error);
    } finally {
      setSpeaking(false);
      setSpeakingVerse(null);
    }
  }, [
    verses,
    speaking,
    speakingVerse,
    stopSpeech,
    selectedBook,
    selectedChapter,
  ]);

  const handleAiBreakdown = useCallback(async () => {
    if (!selectedBook || !selectedChapter || !verses.length) return;
    setShowAiModal(true);
    setAiLoading(true);
    setAiBreakdown(null);

    const fullText = verses.map((v) => `${v.number}: ${v.text}`).join(" ");
    const breakdown = await getBibleBreakdown(
      selectedBook.name,
      selectedChapter.number,
      fullText,
    );

    setAiBreakdown(breakdown);
    setAiLoading(false);
  }, [selectedBook, selectedChapter, verses]);

  const handleSelectChapter = useCallback(
    async (chapter: Chapter) => {
      await stopSpeech();
      setSelectedChapter(chapter);

      setVerses([]);
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          "content-type": "text",
          "include-verse-numbers": "true",
        });
        const res = await fetch(
          `${BASE_URL}/bibles/${version.id}/chapters/${chapter.id}?${params}`,
          { headers: API_HEADERS },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const parsed = parseVerses(
          json.data?.content ?? "",
          selectedBook?.id ?? "",
          chapter.id,
        );
        const withFavs = await Promise.all(
          parsed.map(async (v) => ({ ...v, faved: await isFavorite(v.id) })),
        );
        setVerses(withFavs);
      } catch {
        setError("Failed to load verses.");
      } finally {
        setLoading(false);
      }
    },
    [version, selectedBook, stopSpeech],
  );

  const handleToggleFavorite = useCallback(
    async (verse: Verse) => {
      if (!selectedBook || !selectedChapter) return;
      if (verse.faved) {
        await removeFavorite(verse.id);
      } else {
        const fav: FavoriteVerse = {
          id: verse.id,
          book: selectedBook.name,
          chapter: selectedChapter.number,
          verse: verse.number,
          text: verse.text,
          savedAt: Date.now(),
        };
        await addFavorite(fav);
      }
      setVerses((prev) =>
        prev.map((v) => (v.id === verse.id ? { ...v, faved: !v.faved } : v)),
      );
    },
    [selectedBook, selectedChapter],
  );

  const goBackToBooks = () => {
    stopSpeech();
    setSelectedBook(null);
    setSelectedChapter(null);
    setChapters([]);
    setVerses([]);
  };
  const goBackToChapters = () => {
    stopSpeech();
    setSelectedChapter(null);
    setVerses([]);
  };

  const LoadingView = () => (
    <View className="items-center py-20">
      <ActivityIndicator size="large" color={version.color} />
      <Text className="mt-3 text-[14px] text-[#666]">Loading...</Text>
    </View>
  );

  const ErrorView = () => (
    <View className="mt-6 rounded-[18px] border border-red-200 bg-red-50 p-5">
      <Text className="mb-2 text-[15px] font-bold text-red-600">
        Something went wrong
      </Text>
      <Text className="text-[13px] leading-[20px] text-red-400">{error}</Text>
      <TouchableOpacity
        onPress={() => loadBooks(version.id)}
        className="mt-4 self-start rounded-[10px] bg-red-100 px-4 py-2"
      >
        <Text className="text-[13px] font-bold text-red-600">Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const VersionPicker = () => (
    <View className="mb-4 overflow-hidden rounded-[18px] border border-[#E8E1CF] bg-white">
      {BIBLE_VERSIONS.map((v, i) => (
        <TouchableOpacity
          key={v.id}
          onPress={() => {
            setVersion(v);
            setShowVersionPicker(false);
          }}
          className={`flex-row items-center p-4 ${
            i < BIBLE_VERSIONS.length - 1 ? "border-b border-[#F0EAD8]" : ""
          }`}
          style={{ backgroundColor: version.id === v.id ? v.light : "#FFF" }}
          activeOpacity={0.7}
        >
          <View
            className="mr-4 h-11 w-[52px] items-center justify-center rounded-[12px]"
            style={{ backgroundColor: version.id === v.id ? v.color : v.light }}
          >
            <Text
              className="text-[13px] font-extrabold"
              style={{ color: version.id === v.id ? "#FFF" : v.color }}
            >
              {v.label}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-bold text-[#1A1A1A]">
              {v.name}
            </Text>
            <Text className="mt-[2px] text-[12px] text-[#999]">
              {v.description}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const VersionBar = () => (
    <TouchableOpacity
      onPress={() => setShowVersionPicker((p) => !p)}
      className="mb-4 flex-row items-center justify-between rounded-[14px] border border-[#E8E1CF] bg-white px-4 py-3"
      activeOpacity={0.8}
    >
      <View className="flex-row items-center gap-3">
        <View
          className="h-8 w-[46px] items-center justify-center rounded-[8px]"
          style={{ backgroundColor: version.color }}
        >
          <Text className="text-[12px] font-extrabold text-white">
            {version.label}
          </Text>
        </View>
        <View>
          <Text className="text-[13px] font-bold text-[#1A1A1A]">
            {version.name}
          </Text>
          <Text className="text-[11px] text-[#AAA]">
            Tap to switch translation
          </Text>
        </View>
      </View>
      <Text className="text-[16px] text-[#AAA]">
        {showVersionPicker ? "▲" : "▼"}
      </Text>
    </TouchableOpacity>
  );

  const FilterTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
    >
      {FILTER_TABS.map((key) => {
        const meta = FILTER_META[key];
        const isActive = activeFilter === key;
        return (
          <TouchableOpacity
            key={key}
            onPress={() => {
              setSelectedBook(null);
              setSelectedChapter(null);
              setChapters([]);
              setVerses([]);
              setActiveFilter(key);
            }}
            className="rounded-full px-4 py-[9px]"
            style={{
              backgroundColor: isActive ? meta.color : "#F0EDE5",
              borderWidth: 1,
              borderColor: isActive ? meta.color : "#E6DFCF",
            }}
            activeOpacity={0.75}
          >
            <Text
              className="text-[13px] font-bold"
              style={{ color: isActive ? "#FFF" : "#555" }}
            >
              {meta.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  const renderBooks = () => {
    const meta = FILTER_META[activeFilter];
    return (
      <View>
        <Text className="mb-1 text-[32px] font-extrabold text-[#1A1A1A]">
          Holy Bible
        </Text>
        <Text className="mb-6 text-[14px] text-[#666]">
          {books.length > 0
            ? `${books.length} Books · ${meta.label}`
            : "Loading…"}
        </Text>
        <VersionBar />
        {showVersionPicker && <VersionPicker />}
        <FilterTabs />
        {loading ? (
          <LoadingView />
        ) : error ? (
          <ErrorView />
        ) : (
          <View className="gap-y-3">
            {books.map((book) => (
              <TouchableOpacity
                key={book.id}
                className="flex-row items-center justify-between rounded-[20px] border border-[#ECE7D9] bg-white p-5"
                activeOpacity={0.7}
                onPress={() => handleSelectBook(book)}
              >
                <View className="flex-1 pr-3">
                  <Text className="text-[17px] font-bold text-[#202020]">
                    {book.name}
                  </Text>
                  <Text className="mt-[2px] text-[12px] text-[#9A9A9A]">
                    {book.nameLong}
                  </Text>
                </View>
                {(() => {
                  const isOT = OT_BOOK_NAMES.has(book.name);
                  const isNT = NT_BOOK_NAMES.has(book.name);

                  const badgeLabel = isOT ? "OT" : isNT ? "NT" : "BOOK";
                  const badgeBg = isOT
                    ? "#FEF3C7"
                    : isNT
                      ? "#DCFCE7"
                      : "#E5E7EB";
                  const badgeText = isOT
                    ? "#78350F"
                    : isNT
                      ? "#065F46"
                      : "#374151";

                  return (
                    <View
                      className="rounded-full px-3 py-[4px]"
                      style={{ backgroundColor: badgeBg }}
                    >
                      <Text
                        className="text-[10px] font-bold"
                        style={{ color: badgeText }}
                      >
                        {badgeLabel}
                      </Text>
                    </View>
                  );
                })()}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderChapters = () => (
    <View>
      <TouchableOpacity onPress={goBackToBooks} className="mb-4">
        <Text
          className="text-[14px] font-semibold"
          style={{ color: version.color }}
        >
          ← Back to Books
        </Text>
      </TouchableOpacity>
      <Text className="mb-1 text-[32px] font-extrabold text-[#1A1A1A]">
        {selectedBook?.name}
      </Text>
      <Text className="mb-6 text-[14px] text-[#666]">
        Select a chapter to begin reading
      </Text>
      <VersionBar />
      {showVersionPicker && <VersionPicker />}
      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView />
      ) : (
        <View className="flex-row flex-wrap gap-3">
          {chapters.map((chapter) => (
            <TouchableOpacity
              key={chapter.id}
              className="h-14 w-14 items-center justify-center rounded-[18px] border border-[#E6DFCF] bg-white"
              activeOpacity={0.7}
              onPress={() => handleSelectChapter(chapter)}
            >
              <Text className="text-[16px] font-bold text-[#202020]">
                {chapter.number}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderVerses = () => (
    <View>
      <TouchableOpacity onPress={goBackToChapters} className="mb-4">
        <Text
          className="text-[14px] font-semibold"
          style={{ color: version.color }}
        >
          ← Back to Chapters
        </Text>
      </TouchableOpacity>

      <Text className="text-[32px] font-extrabold text-[#1A1A1A]">
        {selectedBook?.name} {selectedChapter?.number}
      </Text>
      <Text className="mb-6 text-[14px] text-[#666]">
        {verses.length} Verses · {version.name}
      </Text>

      <View className="mb-6 flex-row gap-2">
        <TouchableOpacity
          onPress={handleReadChapter}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-[16px] py-[16px]"
          style={{
            backgroundColor:
              speaking && speakingVerse === "ALL" ? "#7F1D1D" : version.color,
          }}
        >
          <Text className="text-white font-bold text-sm">
            {speaking && speakingVerse === "ALL"
              ? "⏹ Stop Audio"
              : "Listen with Voice"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleAiBreakdown}
          className="flex-row items-center justify-center gap-2 rounded-[16px] bg-[#E5C77A] px-5"
        >
          <Text className="text-[#0E3B2E] font-bold">AI Breakdown</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <LoadingView />
      ) : error ? (
        <ErrorView />
      ) : (
        <View className="space-y-4">
          {verses.map((verse) => (
            <View
              key={verse.id}
              className="rounded-[22px] border p-5"
              style={{
                borderColor:
                  speakingVerse === verse.id ? version.color : "#ECE7D9",
                backgroundColor:
                  speakingVerse === verse.id ? version.light : "#FFFFFF",
              }}
            >
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-[12px] font-bold text-[#7D6B3A]">
                  Verse {verse.number}
                </Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => handleSpeakVerse(verse)}
                    className="rounded-full bg-[#F3F4F6] px-4 py-2"
                  >
                    <Text className="text-[14px]">
                      {speakingVerse === verse.id && speaking ? "⏹" : "🔊"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleToggleFavorite(verse)}
                    className="rounded-full bg-[#F3F4F6] px-4 py-2"
                  >
                    <Text className="text-[14px]">
                      {verse.faved ? "★" : "☆"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text className="text-[17px] leading-[28px] text-[#202020]">
                {verse.text}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* AI Breakdown Modal */}
      <Modal visible={showAiModal} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="h-[80%] rounded-t-[32px] bg-[#F6F4EE] p-6">
            <View className="mb-6 flex-row items-center justify-between">
              <Text className="text-[24px] font-bold text-[#0E3B2E]">
                AI Biblical Insights ✨
              </Text>
              <TouchableOpacity
                onPress={() => setShowAiModal(false)}
                className="rounded-full bg-white/50 p-2"
              >
                <Text className="text-[18px] font-bold text-[#0E3B2E]">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {aiLoading ? (
                <View className="items-center py-20">
                  <ActivityIndicator size="large" color="#0E3B2E" />
                  <Text className="mt-4 text-[16px] font-bold text-[#0E3B2E]">
                    Generating Insights...
                  </Text>
                  <Text className="mt-2 text-[14px] text-[#666] text-center px-10">
                    Our AI is studying the text to provide context, takeaways,
                    and applications.
                  </Text>
                </View>
              ) : aiBreakdown ? (
                <View className="gap-y-6">
                  <View>
                    <Text className="text-[14px] font-bold uppercase tracking-widest text-[#C49A28] mb-2">
                      Summary
                    </Text>
                    <Text className="text-[16px] leading-[26px] text-[#1A1A1A]">
                      {aiBreakdown.summary}
                    </Text>
                  </View>

                  <View>
                    <Text className="text-[14px] font-bold uppercase tracking-widest text-[#C49A28] mb-2">
                      Context
                    </Text>
                    <Text className="text-[16px] leading-[26px] text-[#1A1A1A]">
                      {aiBreakdown.context}
                    </Text>
                  </View>

                  <View>
                    <Text className="text-[14px] font-bold uppercase tracking-widest text-[#C49A28] mb-2">
                      Key Takeaways
                    </Text>
                    {aiBreakdown.keyTakeaways.map((point, i) => (
                      <View key={i} className="mb-3 flex-row gap-3">
                        <View className="mt-2 h-2 w-2 rounded-full bg-[#0E3B2E]" />
                        <Text className="flex-1 text-[16px] leading-[24px] text-[#1A1A1A] font-medium">
                          {point}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View className="rounded-[20px] bg-[#0E3B2E] p-6">
                    <Text className="text-[14px] font-bold uppercase tracking-widest text-[#E5C77A] mb-2">
                      Daily Application
                    </Text>
                    <Text className="text-[16px] leading-[26px] text-white italic">
                      {aiBreakdown.application}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text className="text-center text-red-500 py-10">
                  Failed to generate insights. Please check your API key and
                  connection.
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F6F4EE]">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
      >
        {selectedBook === null
          ? renderBooks()
          : selectedChapter === null
            ? renderChapters()
            : renderVerses()}
      </ScrollView>
    </SafeAreaView>
  );
}
