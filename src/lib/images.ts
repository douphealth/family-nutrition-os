import breakfast from "@/assets/slot-breakfast.jpg";
import lunch from "@/assets/slot-lunch.jpg";
import dinner from "@/assets/slot-dinner.jpg";
export const SLOT_IMAGE: Record<string, string> = { breakfast, lunch, snack: breakfast, dinner };
export const SLOT_EMOJI_TONE: Record<string, string> = { breakfast: "var(--sun)", lunch: "var(--terracotta)", snack: "var(--aegean)", dinner: "var(--olive)" };
