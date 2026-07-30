import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

interface EmojiPickerPanelProps {
  onEmojiSelect: (emoji: { native?: string }) => void;
}

export default function EmojiPickerPanel({ onEmojiSelect }: EmojiPickerPanelProps) {
  return <Picker data={data} onEmojiSelect={onEmojiSelect} theme="auto" locale="fr" />;
}
