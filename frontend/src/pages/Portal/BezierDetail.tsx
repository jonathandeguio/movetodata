import axios from "axios";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import BezierD3 from "../../components/bezier/BezierD3";
import BottomTabs from "../../components/bottomBar/bottomTabs";

import { Spin } from "antd";

import { BottomBarLayout } from "common/components/MtdLayout/BottomBarLayout";
import { initBottomBar } from "common/components/MtdLayout/bottomBarSlice";
import Avatars from "components/Avatars/Avatars";
import Comments from "components/Comments/Comments.view";
import CustomBreadCrumb from "components/Nav/Manage/breadCrumb";
import { getBezierBottomBarItems } from "components/bezier/Bezier.utils";
import {
  favIconLoading,
  getDefaultFavicon,
} from "components/mtdLoader/FavIconLoader";
import { RootState } from "redux/types/store";
import { getLanguageLabel, isDefined, openNotification } from "utils/utilities";
import MtdLoader from "../../components/mtdLoader";

const antIcon = <MtdLoader />;

const BezierDetail = () => {
  const { id, branch } = useParams();
  const [pipeline, setpipeline] = useState();
  const [selectedName, setSelectedName] = useState<string | undefined>();

  const { data: buildSpec } = useSelector(
    (state) => (state as $TSFixMe).datasetBuildSpec
  );

  const pipelineDetails = async (
    id: string | undefined,
    branch: string | undefined
  ) => {
    try {
      const { data } = await axios.get(`/bezier/${id}/${branch}/getInitial`);

      const datasetIds: $TSFixMe = [];
      data.nodes.map((node: $TSFixMe) => datasetIds.push(node.id));
      const res = await axios.post(`/kitab/dataset/byIds`, datasetIds);
      const name_map = new Map();
      let name = "";
      res.data.map((node: any) => {
        name_map.set(node.id, node.name);
      });

      data.nodes.map((node: $TSFixMe) => {
        node.name = name_map.get(node.id);
        node.fx = 1;
        node.fy = 1;
        node.branchesShown = false;
        if (node.id == id) {
          name = node.name;
        }
        return 0;
      });
      setSelectedName(name);
      setpipeline(data);
    } catch (error) {
      openNotification("Pipeline Failed", " ", "error");
    }
  };
  const dispatch = useDispatch();

  const { data: datasetBuildSpec, loading: datasetBuildSpecLoading } =
    useSelector((state) => (state as $TSFixMe).datasetBuildSpec);
  const datasetMapping = useSelector(
    (state) => (state as $TSFixMe).datasetMapping[id ?? ""]
  );
  useEffect(() => {
    pipelineDetails(id, branch);
  }, [id, branch]);
  const { node } = useSelector((state: RootState) => state.pipelineDetails);

  useEffect(() => {
    if (isDefined(id)) {
      favIconLoading(!pipeline);
      return () => {
        let favicon = document.querySelector('link[rel="icon"]') as any;
        favicon.href = getDefaultFavicon();
      };
    }
  }, [pipeline]);

  useEffect(() => {
    if (isDefined(id) && isDefined(branch)) {
      if (isDefined(node)) {
        dispatch(
          initBottomBar({
            leftItems: getBezierBottomBarItems(node.id, branch, node.type),
          })
        );
      } else {
        dispatch(
          initBottomBar({
            leftItems: getBezierBottomBarItems(id, branch, undefined),
          })
        );
      }
    }
  }, [id, node, branch, datasetBuildSpec]);

  const { config, loading1 } = useSelector(
    (state) => (state as any).platformConfig
  );

  useEffect(() => {
    document.title = getLanguageLabel("dataLineage");
    let favicon = document.querySelector('link[rel="icon"]') as any;
    favicon.href = "/favicons/general/dataLineageIcon.svg";

    return () => {
      document.title =
        isDefined(config) && isDefined(config.platformName)
          ? config.platformName
          : "MoveToData";
    };
  }, []);

  return (
    <>
      <div className="blob-container-header">
        <CustomBreadCrumb />
        <div className="dataset-splitpane-header-btns">
          <Comments id={id} />
          <Avatars link={`/topic/${id}`} />
        </div>
        </div>
        <BottomBarLayout>
          <div className="pipeline">
            {pipeline !== null &&
            pipeline !== undefined &&
            (pipeline as $TSFixMe).nodes !== null &&
            (pipeline as $TSFixMe).nodes !== undefined ? (
              <BezierD3
                pipeline={pipeline}
                id={id}
                branch={branch}
                buildexist={buildSpec ? true : false}
                name={selectedName}
              />
            ) : (
              <Spin indicator={<MtdLoader />} />
            )}
            <BottomTabs id={id} branch={branch} page="pipeline" />
          </div>
        </BottomBarLayout>
      
    </>
  );
};

export default BezierDetail;
