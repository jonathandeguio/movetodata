import { BottomBarLayout } from "common/components/MtdLayout/BottomBarLayout";
import React from "react";
import { useSelector } from "react-redux";
import { FractalRestricted } from "./FractalRestricted.view";
import EditorBody from "./editor";
import { FRACTAL_USE_CASES } from "./editor.constants";
export default () => {
  const { info } = useSelector((state) => (state as any).license);

  if (!FRACTAL_USE_CASES.includes(info.product)) return <FractalRestricted />;
  return (
    <BottomBarLayout>
      <EditorBody />
    </BottomBarLayout>
  );
};
