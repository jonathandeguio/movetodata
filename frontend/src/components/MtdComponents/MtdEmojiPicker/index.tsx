import React, { SetStateAction } from "react";
import EmojiPicker, { SuggestionMode } from "emoji-picker-react";

interface IEmojiPicker {
  isOpen: boolean;
  close: SetStateAction<boolean>;
}

export const MtdEmojiPicker: React.FC<IEmojiPicker> = ({ isOpen }) => {
  return (
    <EmojiPicker
      open={isOpen}
      lazyLoadEmojis
      suggestedEmojisMode={SuggestionMode.RECENT}
    />
  );
};
