import { Input, InputProps } from "antd";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { isDefined } from "utils/utilities";
import "./OrpheaInput.scss";
import { useDebounceState } from "hooks/useDebounce";

interface MyCustomInputProps extends InputProps {
  debounceInterval?: number;
  editText?: boolean;
  dynamicWidth?: boolean;
  inputRef?: any;
  autofocus?: boolean;
  autoselect?: boolean;
  fontSize?: number;
}

const MoveToDataInput: React.FC<MyCustomInputProps> = (props) => {
  const [value, setValue] = useState(props.value);
  const debounceInterval = props.debounceInterval ?? 0;

  const [debounceEvent, setEvent, event] = useDebounceState<
    React.ChangeEvent<HTMLInputElement>
  >(undefined, debounceInterval);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isDefined(props.onChange) && isDefined(debounceEvent)) {
      props.onChange(debounceEvent);
    }
  }, [debounceEvent]);

  useEffect(() => {
    setValue(props.value);
  }, [props.value]);

  useEffect(() => {
    if (props.autofocus && inputRef.current) {
      inputRef.current.focus();
    }
    if (props.autoselect && inputRef.current) {
      inputRef.current.select();
    }
  }, [props.autofocus, props.autoselect]);

  const fontSize: number = useMemo(() => {
    return props.fontSize ?? 14;
  }, [props.fontSize]);

  return (
    <Input
      {...props}
      ref={props.autoselect || props.autofocus ? inputRef : props.inputRef}
      value={value}
      style={{
        ...props.style,
        fontSize: `${fontSize}px`,
        ...(props.dynamicWidth
          ? { width: ((value as any)?.length + 1) * (fontSize / 2 + 0.8) + 24 }
          : {}),
        height: `${fontSize * 1.8}px`,
        lineHeight: `${fontSize * 1.8}px`,
      }}
      className={`${
        isDefined(props.editText)
          ? "edit_text inputComponent"
          : "inputComponent"
      } ${props.className}`}
      onKeyDownCapture={(keyboardEvent) => {
        if (
          keyboardEvent.key === "Enter" &&
          isDefined(props.onChange) &&
          isDefined(event)
        ) {
          props.onChange(event);
        }
      }}
      onChange={(event) => {
        setEvent(event);
        setValue(event.target.value);
        event.stopPropagation();
      }}
    />
  );
};

export default MoveToDataInput;
