import React, { SetStateAction } from "react";
import Picker, { SuggestionMode } from "emoji-picker-react";

interface IEmojiPicker {
  isOpen: boolean;
  handleEmojiClick: () => void;
  close: SetStateAction<boolean>;
}

export const MtdReactionPicker: React.FC<IEmojiPicker> = ({
  isOpen,
  handleEmojiClick,
}) => {
  return (
    <Picker
      open={isOpen}
      onEmojiClick={handleEmojiClick}
      lazyLoadEmojis
      suggestedEmojisMode={SuggestionMode.RECENT}
    />
  );
};
