import { Mentions, Typography } from "antd";
import MtdUserPopover from "components/UserPopover/userpopover";
import { User } from "global";
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "redux/types/store";
const { getMentions } = Mentions;
const { Text } = Typography;
export const ShowMessageFormatter = ({ message }: { message: string }) => {
  const { allusers } = useSelector((state: RootState) => state.allUserDetails);

  const tokenizeMessage = (message: string) => {
    const tokens = [];
    let currentWord = "";

    for (let char of message) {
      if (char === " ") {
        // If a space is encountered, add the current word and the space as tokens
        if (currentWord.trim() !== "") {
          tokens.push(currentWord);
          currentWord = "";
        }
        tokens.push(" ");
      } else if (char === "\n") {
        // Newline character: Add the current word and a line break as tokens
        if (currentWord.trim() !== "") {
          tokens.push(currentWord);
          currentWord = "";
        }
        tokens.push(<br key={tokens.length} />);
      } else if (char === "\t") {
        // Tab character: Add the current word and a tab space as tokens
        if (currentWord.trim() !== "") {
          tokens.push(currentWord);
          currentWord = "";
        }
        tokens.push(<span key={tokens.length} style={{ marginLeft: "1em" }} />);
      } else {
        // If a non-space character is encountered, add it to the current word
        currentWord += char;
      }
    }

    // Add the last word if there is any
    if (currentWord.trim() !== "") {
      tokens.push(currentWord);
    }

    return tokens;
  };

  const renderMessage = (message: string) => {
    const tokens = tokenizeMessage(message);

    return tokens.map((token, index) => {
      if (typeof token === "string") {
        if (token.startsWith("@")) {
          const userName = token.substring(1); // Remove '@'
          const userDetails = allusers.find((user: User) => {
            return user.username == userName;
          });
          if (userDetails)
            return (
              <MtdUserPopover record={userDetails}>
                <span
                  style={{
                    background: "var(--movetodata-table-selected)",
                    cursor: "pointer",
                    padding: "0.2rem",
                    borderRadius: "0.5rem",
                  }}
                >
                  @{userDetails.name}
                </span>
              </MtdUserPopover>
            );
          else return <span>{token}</span>;
        } else if (token.trim() === "") {
          // Preserve exact spaces
          return <span key={index}>&nbsp;</span>;
        } else {
          // Non-empty word: Display as is
          return <span key={index}>{token}</span>;
        }
      } else return token;
    });
  };
  return <div style={{ whiteSpace: "pre-wrap" }}>{renderMessage(message)}</div>;
};
