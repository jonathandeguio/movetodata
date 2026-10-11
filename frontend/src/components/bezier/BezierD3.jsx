import axios from "axios";
import randomColor from "randomcolor";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { selectedNode } from "../../redux/actions/pipelineActions";
import PipelineContextMenu, {
  PipelineContextMenus,
} from "../pipelineContextMenu";

import { Dropdown, Menu, Popover, Select, Skeleton } from "antd";
import dagre from "dagre";
import { getLanguageLabel } from "utils/utilities";
import { AddIcon } from "../../assets/icons/mtdActionIcons";
import {
  DataAgentsIcon,
  DataCellsIcon,
  DatabaseIcon,
  DatabaseViewIcon,
  ProjectIcon,
  SingleValueIcon,
} from "../../assets/icons/mtdDataIcons";

import { ChartIcon, GraphIcon } from "../../assets/icons/mtdChartIcons";
import {
  MapLegendIcon,
  PanIcon,
} from "../../assets/icons/mtdInterfaceIcons";

import { BuildIcon, SharedIcon } from "../../assets/icons/mtdActionIcons";
import { CodeCellIcon } from "../../assets/icons/mtdEditorIcons";
import { DocsIcon, FolderIcon } from "../../assets/icons/mtdFileIcons";
import { AppIcon, UploadIcon } from "../../assets/icons/mtdInterfaceIcons";
import { MonitorIcon } from "../../assets/icons/mtdMiscellaneousIcons";
import {
  ZoomInIcon,
  ZoomOutIcon,
  ZoomToFitIcon,
} from "../../assets/icons/mtdNavigationIcon";
import { SortDescIcon } from "../../assets/icons/mtdSortIcons";
import { FilterIcon } from "../../assets/icons/mtdTableIcons";

import { ResourceTypeEnum } from "Apps/explorer/explorer.utils";
import {
  ABORTED,
  CANCELLED,
  FAILED,
  SUCCESS,
} from "components/Builds/Builds.constants";
import { autoFormatter } from "utils/AutoFormatter";
import Avatars from "../Avatars/Avatars";
import MtdButton from "../MtdComponents/ButtonComponent/MtdButton";
import {
  BEZIER_CHARTS_SVG_ICONS,
  BEZIER_ICONS,
  KEPLER_CHARTS,
} from "./Bezier.constants";

/**
 * BEGIN OF REIGN OF BEZIER REFACTOR.
 * DEVS ASSEMBLE.....
 * */
export default function BezierD3({ pipeline, id, branch, buildexist, name }) {
  const d3 = require("d3");

  const dispatch = useDispatch();

  const [pipelineData, setPipelineData] = useState({
    pipeline: pipeline,
    currentSelectedNode: { id: id, type: "dataset", name: name },
    type: "initial",
    flow: false,
    color: "resource",
    repo_color: {
      build: new Map(),
      sync: new Map(),
      repo: new Map(),
      resource: new Map(),
      project: new Map(),
      folder: new Map(),
      rows: new Map(),
      columns: new Map(),
      files: new Map(),
      size: new Map(),
    },
    vis_color: {
      build: new Map(),
      sync: new Map(),
      repo: new Map(),
      resource: new Map(),
      project: new Map(),
      folder: new Map(),
      rows: new Map(),
      columns: new Map(),
      files: new Map(),
      size: new Map(),
    },
    colorLegend: true,
    loading: false,
    lastNode: { id: null },
  });
  const [contextMenu, setcontextMenu] = useState({
    event: undefined,
    record: undefined,
    dispatch: undefined,
    id: undefined,
    buildexist: undefined,
  });

  let nodes_hash = new Map();
  let cur_graph = new Map();
  let user_map = new Map();
  let nodes_pos_hash = new Map();
  let vis_color = {
    build: new Map(),
    sync: new Map(),
    repo: new Map(),
    resource: new Map(),
    project: new Map(),
    folder: new Map(),
    rows: new Map(),
    columns: new Map(),
    files: new Map(),
    size: new Map(),
  };
  let repo_color = {
    build: new Map(),
    sync: new Map(),
    repo: new Map(),
    resource: new Map(),
    project: new Map(),
    folder: new Map(),
    rows: new Map(),
    columns: new Map(),
    files: new Map(),
    size: new Map(),
  };
  let color_type_count = {
    build: new Map(),
    sync: new Map(),
    repo: new Map(),
    resource: new Map(),
    project: new Map(),
    folder: new Map(),
    rows: new Map(),
    columns: new Map(),
    files: new Map(),
    size: new Map(),
  };
  let repo_legend = [];
  let rows = [];
  let project_legend = [];
  let folder_legend = [];
  let rows_legend = [];
  let columns_legend = [];
  let files_legend = [];
  let size_legend = [];

  const svgref = useRef();
  const gref = useRef();

  const formatTime = d3.timeFormat("%e %B");

  function getColorPair() {
    const foregroundColor = randomColor({
      luminosity: "light",
    });
    const backgroundColor = randomColor({
      luminosity: "light",
    });
    return [foregroundColor, backgroundColor];
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  function createDirectedGraph(data) {
    var dagreGraph = new dagre.graphlib.Graph();

    // Set an object for the graph label
    dagreGraph.setGraph({
      rankdir: "LR",
      nodesep: 140,
      marginx: 0,
      marginy: 0,
      edgesep: 100,
      ranksep: 500,
    });

    // Default to assigning a new object as a label for each new edge.
    dagreGraph.setDefaultEdgeLabel(function () {
      return {};
    });

    // Add nodes to the graph. The first argument is the node id. The second is
    // metadata about the node. In this case we're going to add labels to each of
    // our nodes.
    data.nodes.forEach((node, index) => {
      dagreGraph.setNode(node.id, {
        id: node.id,
        label: node.name,
        style: { width: 50, fontSize: 11 },
        status: node.status,
      });
    });

    data.edges.forEach((edge) => {
      dagreGraph.setEdge(
        edge.source.id || edge.source,
        edge.target.id || edge.target
      );
    });

    dagre.layout(dagreGraph);

    return dagreGraph;
  }

  const preProcessData = (nodes, links) => {
    // Creating new entity to not overlap with old data
    nodes_hash = new Map();
    cur_graph = new Map();
    nodes_pos_hash = new Map();
    vis_color = pipelineData.vis_color;
    repo_color = pipelineData.repo_color;
    repo_legend = [];
    project_legend = [];
    folder_legend = [];
    rows_legend = [];
    columns_legend = [];
    files_legend = [];
    size_legend = [];
    let userIds = [];

    /*
     *
     *
     * cur_graph initialization
     * Note : cur_graph contains the child and parent nodes
     * for traversal to just collapse the children or parent
     * which are present in the current render of the bezier
     *
     *
     */

    nodes.forEach((node) => {
      if (!cur_graph.has(node.id)) {
        cur_graph.set(node.id, { parents: [], children: [] });
      }
      if (node.createdBy != null && node.createdBy) {
        userIds.push(node.createdBy);
      }
      if (node.updatedBy != null && node.updatedBy) {
        userIds.push(node.updatedBy);
      }
    });

    links.forEach((link) => {
      if (typeof link.source == "string") {
        nodes.forEach((node) => {
          if (node.id == link.source) {
            link.source = node;
          }
          if (node.id == link.target) {
            link.target = node;
          }
        });
      }
      if (!nodes_hash.has(link.source.id)) {
        nodes_hash.set(link.source.id, { parents: 0, children: 0 });
      }
      if (!nodes_hash.has(link.target.id)) {
        nodes_hash.set(link.target.id, { parents: 0, children: 0 });
      }
      if (link.target.id.length == 36) {
        nodes_hash.get(link.source.id).children =
          nodes_hash.get(link.source.id).children + 1;

        nodes_hash.get(link.target.id).parents =
          nodes_hash.get(link.target.id).parents + 1;
      }

      cur_graph;
      //
      //
      cur_graph.get(link.source.id).children.push(link.target);
      cur_graph.get(link.target.id).parents.push(link.source);
    });

    // Filling the remaining nodes
    nodes.forEach((node) => {
      if (!nodes_hash.has(node.id)) {
        nodes_hash.set(node.id, { parents: 0, children: 0 });
      }
    });

    if (pipelineData.type == "initial") {
      const dagre_graph = createDirectedGraph({ nodes: nodes, edges: links });
      dagre_graph.nodes().forEach((node) => {
        const cur_node = dagre_graph.node(node);
        nodes_pos_hash.set(cur_node.id, { x: cur_node.x, y: cur_node.y });
      });
      nodes.forEach((node) => {
        let pos = nodes_pos_hash.get(node.id);
        node.fx = pos.x;
        node.fy = pos.y;
        nodes_pos_hash.set(node.id, node);
      });
    } else {
      nodes.forEach((node) => {
        nodes_pos_hash.set(node.id, node);
      });
    }
    // Setting colors
    // Setting Repo Colors
    nodes.forEach((node) => {
      // Assigning colors to repo and project and folder
      if (
        node.repository != null &&
        !pipelineData.repo_color.repo.has(node.repository)
      ) {
        while (true) {
          let new_color = getColorPair();
          if (
            !pipelineData.vis_color.repo.has(new_color) &&
            new_color[1] != "#F2ABA2"
          ) {
            pipelineData.repo_color.repo.set(node.repository, new_color);
            pipelineData.vis_color.repo.set(new_color, node.repository);
            break;
          }
        }
      }
      // // Not available case
      // else if (node.repository == null && !repo_color.repo.has("Not Available")) {
      //
      //
      //     while (true) {
      //         let new_color = getColorPair();
      //         if (!vis_color.repo.has(new_color)) {
      //             repo_color.repo.set("Not Available", new_color);
      //             vis_color.repo.set(new_color, "Not Available");
      //             break;
      //         }
      //     }
      // }
      if (
        node.projectName != null &&
        !pipelineData.repo_color.project.has(node.projectName)
      ) {
        while (true) {
          let new_color = getColorPair();
          if (!pipelineData.vis_color.project.has(new_color)) {
            pipelineData.repo_color.project.set(node.projectName, new_color);
            pipelineData.vis_color.project.set(new_color, node.projectName);
            break;
          }
        }
      }

      if (
        node.parentFolder != null &&
        !pipelineData.repo_color.folder.has(node.parentFolder)
      ) {
        while (true) {
          let new_color = getColorPair();
          if (!pipelineData.vis_color.folder.has(new_color)) {
            pipelineData.repo_color.folder.set(node.parentFolder, new_color);
            pipelineData.vis_color.folder.set(new_color, node.parentFolder);
            break;
          }
        }
      }

      if (node.rows != null && !pipelineData.repo_color.rows.has(node.rows)) {
        while (true) {
          let new_color = getColorPair();
          if (!pipelineData.vis_color.rows.has(new_color)) {
            pipelineData.repo_color.rows.set(node.rows, new_color);
            pipelineData.vis_color.rows.set(new_color, node.rows);
            break;
          }
        }
      }

      if (
        node.columns != null &&
        !pipelineData.repo_color.columns.has(node.columns)
      ) {
        while (true) {
          let new_color = getColorPair();
          if (!pipelineData.vis_color.columns.has(new_color)) {
            pipelineData.repo_color.columns.set(node.columns, new_color);
            pipelineData.vis_color.columns.set(new_color, node.columns);
            break;
          }
        }
      }

      if (
        node.files != null &&
        !pipelineData.repo_color.files.has(node.files)
      ) {
        while (true) {
          let new_color = getColorPair();
          if (!pipelineData.vis_color.files.has(new_color)) {
            pipelineData.repo_color.files.set(node.files, new_color);
            pipelineData.vis_color.files.set(new_color, node.files);
            break;
          }
        }
      }

      if (node.size != null && !pipelineData.repo_color.size.has(node.size)) {
        while (true) {
          let new_color = getColorPair();
          if (!pipelineData.vis_color.size.has(new_color)) {
            pipelineData.repo_color.size.set(node.size, new_color);
            pipelineData.vis_color.size.set(new_color, node.size);
            break;
          }
        }
      }

      // Maintaining Count
      if (pipelineData.color == "build") {
        if (node.buildStatus != null) {
          if (!color_type_count.build.has(node.buildStatus)) {
            color_type_count.build.set(node.buildStatus, 1);
          } else {
            color_type_count.build.set(
              node.buildStatus,
              color_type_count.build.get(node.buildStatus) + 1
            );
          }
        } else {
          if (node.type == "source" || node.type == "chart") {
            if (!color_type_count.build.has("Not Applicable")) {
              color_type_count.build.set("Not Applicable", 1);
            } else {
              color_type_count.build.set(
                "Not Applicable",
                color_type_count.build.get("Not Applicable") + 1
              );
            }
          } else {
            if (!color_type_count.build.has("Not Available")) {
              color_type_count.build.set("Not Available", 1);
            } else {
              color_type_count.build.set(
                "Not Available",
                color_type_count.build.get("Not Available") + 1
              );
            }
          }
        }
      } else if (pipelineData.color == "sync") {
        if (node.syncStatus == "true") {
          if (!color_type_count.sync.has(node.syncStatus)) {
            color_type_count.sync.set(node.syncStatus, 1);
          } else {
            color_type_count.sync.set(
              node.syncStatus,
              color_type_count.sync.get(node.syncStatus) + 1
            );
          }
        } else {
          if (node.type == "source" || node.type == "chart") {
            if (!color_type_count.sync.has("Not Applicable")) {
              color_type_count.sync.set("Not Applicable", 1);
            } else {
              color_type_count.sync.set(
                "Not Applicable",
                color_type_count.sync.get("Not Applicable") + 1
              );
            }
          } else {
            // Not availble case
            if (!color_type_count.sync.has("false")) {
              color_type_count.sync.set("false", 1);
            } else {
              color_type_count.sync.set(
                "false",
                color_type_count.sync.get("false") + 1
              );
            }
          }
        }
      } else if (pipelineData.color == "resource") {
        if (node.type != null) {
          if (node.type == "source" || node.type == "chart") {
            if (!color_type_count.resource.has(node.type)) {
              color_type_count.resource.set(node.type, 1);
            } else {
              color_type_count.resource.set(
                node.type,
                color_type_count.resource.get(node.type) + 1
              );
            }
          } else if (node.type == "source" || node.type == "dashboard") {
            if (!color_type_count.resource.has(node.type)) {
              color_type_count.resource.set(node.type, 1);
            } else {
              color_type_count.resource.set(
                node.type,
                color_type_count.resource.get(node.type) + 1
              );
            }
          } else if (node.type == "dataset") {
            if (!color_type_count.resource.has(node.subType)) {
              color_type_count.resource.set(node.subType, 1);
            } else {
              color_type_count.resource.set(
                node.subType,
                color_type_count.resource.get(node.subType) + 1
              );
            }
          }
        }
      } else if (pipelineData.color == "project") {
        if (node.projectName != null) {
          if (!color_type_count.project.has(node.projectName)) {
            color_type_count.project.set(node.projectName, 1);
          } else {
            color_type_count.project.set(
              node.projectName,
              color_type_count.project.get(node.projectName) + 1
            );
          }
        }
      } else if (pipelineData.color == "folder") {
        if (node.parentFolder != null) {
          if (!color_type_count.folder.has(node.parentFolder)) {
            color_type_count.folder.set(node.parentFolder, 1);
          } else {
            color_type_count.folder.set(
              node.parentFolder,
              color_type_count.folder.get(node.parentFolder) + 1
            );
          }
        }
      } else if (pipelineData.color == "rows") {
        if (node.rows != null) {
          if (!color_type_count.rows.has(node.rows)) {
            color_type_count.rows.set(node.rows, 1);
          } else {
            color_type_count.rows.set(
              node.rows,
              color_type_count.rows.get(node.rows) + 1
            );
          }
        }
      } else if (pipelineData.color == "columns") {
        if (node.columns != null) {
          if (!color_type_count.columns.has(node.columns)) {
            color_type_count.columns.set(node.columns, 1);
          } else {
            color_type_count.columns.set(
              node.columns,
              color_type_count.columns.get(node.columns) + 1
            );
          }
        }
      } else if (pipelineData.color == "files") {
        if (node.files != null) {
          if (!color_type_count.files.has(node.files)) {
            color_type_count.files.set(node.files, 1);
          } else {
            color_type_count.files.set(
              node.files,
              color_type_count.files.get(node.files) + 1
            );
          }
        }
      } else if (pipelineData.color == "size") {
        if (node.size != null) {
          if (!color_type_count.size.has(node.size)) {
            color_type_count.size.set(node.size, 1);
          } else {
            color_type_count.size.set(
              node.size,
              color_type_count.size.get(node.size) + 1
            );
          }
        }
      } else if (pipelineData.color == "repo") {
        if (node.repository != null) {
          if (!color_type_count.repo.has(node.repository)) {
            color_type_count.repo.set(node.repository, 1);
          } else {
            color_type_count.repo.set(
              node.repository,
              color_type_count.repo.get(node.repository) + 1
            );
          }
        } else {
          if (node.type == "source" || node.type == "chart") {
            if (!color_type_count.repo.has("Not Applicable")) {
              color_type_count.repo.set("Not Applicable", 1);
            } else {
              color_type_count.repo.set(
                "Not Applicable",
                color_type_count.repo.get("Not Applicable") + 1
              );
            }
          } else {
            if (!color_type_count.repo.has("Not Available")) {
              color_type_count.repo.set("Not Available", 1);
            } else {
              color_type_count.repo.set(
                "Not Available",
                color_type_count.repo.get("Not Available") + 1
              );
            }
          }
        }
      }
    });

    getUsers(userIds);
  };

  const getParent = async (id) => {
    try {
      const branch = "master";

      const { data } = await axios.get(`/bezier/${id}/${branch}/getParents`);

      const datasetIds = [];
      data.nodes.map((node) => datasetIds.push(node.id));
      const res = await axios.post(`/kitab/dataset/byIds`, datasetIds);
      let name_map = new Map();
      res.data.map((node) => {
        name_map.set(node.id, node.name);
      });

      data.nodes.map((node) => {
        node.name = name_map.get(node.id);
        node.fx = 1;
        node.fy = 1;

        return 0;
      });

      let new_local_node = [];
      let new_local_link = [];
      data.nodes.forEach((node) => {
        let flag = true;
        pipelineData.pipeline.nodes.forEach((node_global) => {
          if (node_global.id == node.id) {
            flag = false;
          }
        });

        if (flag) {
          new_local_node.push(node);
        }
      });
      //
      //
      let present_nodes = new Map();
      present_nodes.set(id, true);

      new_local_node.forEach((node) => {
        present_nodes.set(node.id, true);
      });

      let dagre_edges = [];

      data.links.forEach((link) => {
        let flag = true;
        pipelineData.pipeline.links.forEach((link_global) => {
          if (
            link_global.source.id == link.source &&
            link_global.target.id == link.target
          ) {
            flag = false;
          }
        });
        if (flag) {
          if (present_nodes.has(link.source) && present_nodes.has(link.target))
            dagre_edges.push(link);

          new_local_link.push(link);
        }
      });

      let parentPosOld = nodes_pos_hash.get(id);
      let parentPosNew = null;

      const dagre_graph = createDirectedGraph({
        nodes: [...new_local_node, parentPosOld],
        edges: dagre_edges,
      });

      dagre_graph.nodes().forEach((node) => {
        const cur_node = dagre_graph.node(node);

        if (cur_node && cur_node != undefined && cur_node != null) {
          nodes_pos_hash.set(cur_node.id, { x: cur_node.x, y: cur_node.y });
          if (cur_node.id == id) {
            parentPosNew = cur_node;
          }
        }
      });

      let x_diff = parentPosNew.x - parentPosOld.fx;
      let y_diff = parentPosNew.y - parentPosOld.fy;

      new_local_node.forEach((node) => {
        let pos = nodes_pos_hash.get(node.id);
        node.fx = pos.x - x_diff;
        node.fy = pos.y - y_diff;
        nodes_pos_hash.set(node.id, node);
      });

      let merged_data = {
        nodes: [...new_local_node, ...pipelineData.pipeline.nodes],
        links: [...new_local_link, ...pipelineData.pipeline.links],
      };
      merged_data.nodes.forEach((node) => {
        if (
          node.repository != null &&
          !pipelineData.repo_color.repo.has(node.repository)
        ) {
          while (true) {
            let new_color = getColorPair();
            if (!pipelineData.vis_color.repo.has(new_color)) {
              pipelineData.repo_color.repo.set(node.repository, new_color);
              pipelineData.vis_color.repo.set(new_color, node.repository);
              break;
            }
          }
        }
      });
      //
      setPipelineData({
        pipeline: merged_data,
        currentSelectedNode: pipelineData.currentSelectedNode,
        type: "parent",
        flow: pipelineData.flow,
        color: pipelineData.color,
        repo_color: repo_color,
        vis_color: vis_color,
        colorLegend: pipelineData.colorLegend,
        loading: false,
        lastNode: { id: id },
      });
    } catch (error) {}
  };

  const getChildren = async (id) => {
    try {
      const branch = "master";

      const { data } = await axios.get(`/bezier/${id}/${branch}/getChildren`);

      const datasetIds = [];
      data.nodes.map((node) => datasetIds.push(node.id));
      const res = await axios.post(`/kitab/dataset/byIds`, datasetIds);
      let name_map = new Map();
      res.data.map((node) => {
        name_map.set(node.id, node.name);
      });

      data.nodes.map((node) => {
        node.name = name_map.get(node.id);
        node.fx = 1;
        node.fy = 1;

        return 0;
      });

      let new_local_node = [];
      let new_local_link = [];

      data.nodes.forEach((node) => {
        let flag = true;
        pipelineData.pipeline.nodes.forEach((node_global) => {
          if (node_global.id == node.id) {
            flag = false;
          }
        });

        if (flag) {
          new_local_node.push(node);
        }
      });

      let present_nodes = new Map();
      present_nodes.set(id, true);

      new_local_node.forEach((node) => {
        present_nodes.set(node.id, true);
      });

      let dagre_edges = [];

      data.links.forEach((link) => {
        let flag = true;
        pipelineData.pipeline.links.forEach((link_global) => {
          if (
            link_global.source.id == link.source &&
            link_global.target.id == link.target
          ) {
            flag = false;
          }
        });

        if (flag) {
          if (present_nodes.has(link.source) && present_nodes.has(link.target))
            dagre_edges.push(link);

          new_local_link.push(link);
        }
      });

      let parentPosOld = nodes_pos_hash.get(id);
      let parentPosNew = null;

      const dagre_graph = createDirectedGraph({
        nodes: [...new_local_node, parentPosOld],
        edges: dagre_edges,
      });

      dagre_graph.nodes().forEach((node) => {
        const cur_node = dagre_graph.node(node);

        if (cur_node && cur_node != undefined && cur_node != null) {
          nodes_pos_hash.set(cur_node.id, { x: cur_node.x, y: cur_node.y });
          if (cur_node.id == id) {
            parentPosNew = cur_node;
          }
        }
      });

      let x_diff = parentPosNew.x - parentPosOld.fx;
      let y_diff = parentPosNew.y - parentPosOld.fy;

      new_local_node.forEach((node) => {
        let pos = nodes_pos_hash.get(node.id);
        node.fx = pos.x - x_diff;
        node.fy = pos.y - y_diff;
        nodes_pos_hash.set(node.id, node);
      });

      let merged_data = {
        nodes: [...new_local_node, ...pipelineData.pipeline.nodes],
        links: [...new_local_link, ...pipelineData.pipeline.links],
      };
      merged_data.nodes.forEach((node) => {
        if (
          node.repository != null &&
          !pipelineData.repo_color.repo.has(node.repository)
        ) {
          while (true) {
            let new_color = getColorPair();
            if (!pipelineData.vis_color.repo.has(new_color)) {
              pipelineData.repo_color.repo.set(node.repository, new_color);
              pipelineData.vis_color.repo.set(new_color, node.repository);
              break;
            }
          }
        }
      });
      setPipelineData({
        pipeline: merged_data,
        currentSelectedNode: pipelineData.currentSelectedNode,
        type: "children",
        flow: pipelineData.flow,
        color: pipelineData.color,
        repo_color: repo_color,
        vis_color: vis_color,
        colorLegend: pipelineData.colorLegend,
        loading: false,
        lastNode: { id: id },
      });
    } catch (error) {}
  };

  const showOtherBranches = async (d) => {
    //
    d.branchesShown = true;
    let id = d.id;
    let branches = d.branches;
    let otherBranches = [];
    let otherBranchesLinks = [];
    // Will contain all the parents of the current node, whose other branches are asked for
    let parents = cur_graph.get(d.id).parents;
    //
    try {
      branches.map((branch) => {
        if (branch.branch != "master") {
          let newNode = { ...d };
          newNode.fx = 1;
          newNode.fy = 1;
          newNode.id = newNode.id + branch.branch;
          newNode.branch = branch.branch;
          newNode.branches = [];
          newNode.totalParents = 0;
          newNode.totalChildren = 0;
          otherBranches.push(newNode);
        }
      });
      parents.map((parent) => {
        otherBranches.map((otherBranch) => {
          // parent.totalChildren = parent.totalChildren + 1;
          // Expand parent of branches nodes, if needed here
          otherBranchesLinks.push({
            source: parent.id,
            target: otherBranch.id,
          });
        });
      });

      //

      let new_local_node = otherBranches;
      let new_local_link = [];

      let present_nodes = new Map();
      present_nodes.set(id, true);

      new_local_node.forEach((node) => {
        present_nodes.set(node.id, true);
      });

      let dagre_edges = [];

      otherBranchesLinks.forEach((link) => {
        let flag = true;
        pipelineData.pipeline.links.forEach((link_global) => {
          if (
            link_global.source.id == link.source &&
            link_global.target.id == link.target
          ) {
            flag = false;
          }
        });

        if (flag) {
          if (present_nodes.has(link.source) && present_nodes.has(link.target))
            dagre_edges.push(link);

          new_local_link.push(link);
        }
      });
      //
      //
      //
      let parentPosOld = nodes_pos_hash.get(id);
      //
      let parentPosNew = null;

      const dagre_graph = createDirectedGraph({
        nodes: [...new_local_node, parentPosOld],
        edges: dagre_edges,
      });

      dagre_graph.nodes().forEach((node) => {
        const cur_node = dagre_graph.node(node);

        if (cur_node && cur_node != undefined && cur_node != null) {
          nodes_pos_hash.set(cur_node.id, { x: cur_node.x, y: cur_node.y });
          if (cur_node.id == id) {
            //
            parentPosNew = cur_node;
          }
        }
      });
      //
      let x_diff = parentPosNew.x - parentPosOld.fx;
      let y_diff = parentPosNew.y - parentPosOld.fy;

      new_local_node.forEach((node) => {
        let pos = nodes_pos_hash.get(node.id);
        node.fx = pos.x - x_diff;
        node.fy = pos.y - y_diff;
        nodes_pos_hash.set(node.id, node);
      });

      let merged_data = {
        nodes: [...new_local_node, ...pipelineData.pipeline.nodes],
        links: [...new_local_link, ...pipelineData.pipeline.links],
      };
      merged_data.nodes.forEach((node) => {
        if (
          node.repository != null &&
          !pipelineData.repo_color.repo.has(node.repository)
        ) {
          while (true) {
            let new_color = getColorPair();
            if (!pipelineData.vis_color.repo.has(new_color)) {
              pipelineData.repo_color.repo.set(node.repository, new_color);
              pipelineData.vis_color.repo.set(new_color, node.repository);
              break;
            }
          }
        }
      });
      //
      setPipelineData({
        pipeline: merged_data,
        currentSelectedNode: pipelineData.currentSelectedNode,
        type: "children",
        flow: pipelineData.flow,
        color: pipelineData.color,
        repo_color: repo_color,
        vis_color: vis_color,
        colorLegend: pipelineData.colorLegend,
        loading: false,
        lastNode: { id: id },
      });
    } catch (error) {}
  };

  const hideOtherBranches = async (d) => {
    let id = d.id;
    d.branchesShown = false;
    let newNodes = [];
    let newLinks = [];
    let parents = cur_graph.get(d.id).parents;
    //
    parents.map((parent) => {
      // parent.totalChildren = parent.totalChildren - d.branches.size();
      // parent.children = parent.children - d.branches.size();
    });
    function isNonMasterOfNode(toCheck, id) {
      if (toCheck.length == 36) {
        return false;
      } else if (toCheck.length > 36) {
        if (toCheck.slice(0, 36) == id) return true;
      }
      return false;
    }
    pipelineData.pipeline.nodes.forEach((node) => {
      if (!isNonMasterOfNode(node.id, id)) newNodes.push(node);
    });
    pipelineData.pipeline.links.forEach((link) => {
      if (
        !isNonMasterOfNode(link.source.id, id) &&
        !isNonMasterOfNode(link.target.id, id)
      ) {
        newLinks.push(link);
      }
    });
    let merged_data = {
      nodes: newNodes,
      links: newLinks,
    };
    //
    //
    let new_repo_color = new Map();
    let new_vis_color = new Map();
    newNodes.map((node) => {
      if (
        node.repository != null &&
        pipelineData.repo_color.repo.has(node.repository)
      ) {
        let old_color = pipelineData.repo_color.repo.get(node.repository);
        if (!new_vis_color.has(old_color)) {
          new_repo_color.set(node.repository, old_color);
          new_vis_color.set(old_color, node.repository);
        }
      }
    });

    setPipelineData({
      pipeline: merged_data,
      currentSelectedNode: pipelineData.currentSelectedNode,
      type: "children",
      flow: pipelineData.flow,
      color: pipelineData.color,
      repo_color: {
        build: pipelineData.repo_color.build,
        sync: pipelineData.repo_color.sync,
        repo: new_repo_color,
        resource: pipelineData.repo_color.resource,
        project: pipelineData.repo_color.project,
        folder: pipelineData.repo_color.folder,
        columns: pipelineData.repo_color.columns,
        rows: pipelineData.repo_color.rows,
        files: pipelineData.repo_color.files,
        size: pipelineData.repo_color.size,
      },
      vis_color: {
        build: pipelineData.vis_color.build,
        sync: pipelineData.vis_color.sync,
        repo: new_vis_color,
        resource: pipelineData.vis_color.resource,
        project: pipelineData.vis_color.project,
        folder: pipelineData.repo_color.folder,
        columns: pipelineData.repo_color.columns,
        rows: pipelineData.repo_color.rows,
        files: pipelineData.repo_color.files,
        size: pipelineData.repo_color.size,
      },
      colorLegend: pipelineData.colorLegend,
      loading: false,
      lastNode: { id: id },
    });
  };

  const collapseParent = async (id) => {
    try {
      // BFS to get parent and its ancestors
      let data = { nodes: [], links: [] };
      let visited = new Map();
      let queue = [];
      queue.push(id);

      while (queue.length > 0) {
        let count = queue.length;
        while (count--) {
          const node = queue.shift();

          cur_graph.get(node).parents.forEach((parent) => {
            /*
                            A node which is parent of the current node.
                            As well as link between them must be collapsed.

                            But if a parent contains multiple child.
                            Child2 
                                   \ 
                                    \
                                       Parent
                                    /
                                   /
                            Child1
                            
                            Clicking collapse of Child1. Will only remove the 
                            link between child1 and parent. It wont remove Parent.
                        */

            if (!visited.has(parent.id)) {
              if (nodes_hash.get(parent.id).children == 1) {
                data.nodes.push(parent);
                queue.push(parent.id);
                visited.set(parent.id, true);
              }

              data.links.push({ source: parent.id, target: node });
            }
          });
        }
      }

      let uniqueNodesAfterSubtract = pipelineData.pipeline.nodes.filter(
        function (obj) {
          return !data.nodes.some(function (obj2) {
            return obj.id == obj2.id;
          });
        }
      );

      let uniqueLinksAfterSubtract = pipelineData.pipeline.links.filter(
        function (obj) {
          return !data.links.some(function (obj2) {
            return obj.source.id == obj2.source && obj.target.id == obj2.target;
          });
        }
      );

      let merged_data = {
        nodes: uniqueNodesAfterSubtract,
        links: uniqueLinksAfterSubtract,
      };
      let new_vis_color = new Map();
      let new_repo_color = new Map();

      uniqueNodesAfterSubtract.map((node) => {
        if (
          node.repository != null &&
          pipelineData.repo_color.repo.has(node.repository)
        ) {
          let old_color = pipelineData.repo_color.repo.get(node.repository);
          if (!new_vis_color.has(old_color)) {
            new_repo_color.set(node.repository, old_color);
            new_vis_color.set(old_color, node.repository);
          }
        }
      });

      setPipelineData({
        pipeline: merged_data,
        currentSelectedNode: pipelineData.currentSelectedNode,
        type: "parent",
        flow: pipelineData.flow,
        color: pipelineData.color,
        repo_color: {
          build: pipelineData.repo_color.build,
          sync: pipelineData.repo_color.sync,
          repo: new_repo_color,
          resource: pipelineData.repo_color.resource,
          project: pipelineData.repo_color.project,
          folder: pipelineData.repo_color.folder,
          columns: pipelineData.repo_color.columns,
          rows: pipelineData.repo_color.rows,
          files: pipelineData.repo_color.files,
          size: pipelineData.repo_color.size,
        },
        vis_color: {
          build: pipelineData.vis_color.build,
          sync: pipelineData.vis_color.sync,
          repo: new_vis_color,
          resource: pipelineData.vis_color.resource,
          project: pipelineData.vis_color.project,
          folder: pipelineData.repo_color.folder,
          columns: pipelineData.repo_color.columns,
          rows: pipelineData.repo_color.rows,
          files: pipelineData.repo_color.files,
          size: pipelineData.repo_color.size,
        },
        colorLegend: pipelineData.colorLegend,
        loading: false,
        lastNode: { id: id },
      });
    } catch (error) {}
  };

  const collapseChildren = async (id) => {
    try {
      // BFS to get parent and its ancestors
      let data = { nodes: [], links: [] };
      let visited = new Map();
      let queue = [];
      queue.push(id);

      while (queue.length > 0) {
        let count = queue.length;
        while (count--) {
          const node = queue.shift();

          cur_graph.get(node).children.forEach((child) => {
            /*
                            A node which has a children. And that children
                            got two parents.
                            If we collapse children of that node. 
                            It wont remove the child node as it contains
                            more than 1 parent.
                            It will just remove the link between them

                            Parent2 
                                   \ 
                                    \
                                       Child
                                    /
                                   /
                            Parent1
                        
                        */

            if (!visited.has(child.id)) {
              if (nodes_hash.get(child.id).parents == 1) {
                data.nodes.push(child);
                queue.push(child.id);
                visited.set(child.id, true);
              }

              data.links.push({ source: node, target: child.id });
            }
          });
        }
      }

      let uniqueNodesAfterSubtract = pipelineData.pipeline.nodes.filter(
        function (obj) {
          return !data.nodes.some(function (obj2) {
            return obj.id == obj2.id;
          });
        }
      );

      let uniqueLinksAfterSubtract = pipelineData.pipeline.links.filter(
        function (obj) {
          return !data.links.some(function (obj2) {
            return obj.source.id == obj2.source && obj.target.id == obj2.target;
          });
        }
      );

      let merged_data = {
        nodes: uniqueNodesAfterSubtract,
        links: uniqueLinksAfterSubtract,
      };
      let new_vis_color = new Map();
      let new_repo_color = new Map();

      uniqueNodesAfterSubtract.map((node) => {
        if (
          node.repository != null &&
          pipelineData.repo_color.repo.has(node.repository)
        ) {
          let old_color = pipelineData.repo_color.repo.get(node.repository);
          if (!new_vis_color.has(old_color)) {
            new_repo_color.set(node.repository, old_color);
            new_vis_color.set(old_color, node.repository);
          }
        }
      });

      setPipelineData({
        pipeline: merged_data,
        currentSelectedNode: pipelineData.currentSelectedNode,
        type: "children",
        flow: pipelineData.flow,
        color: pipelineData.color,
        repo_color: {
          build: pipelineData.repo_color.build,
          sync: pipelineData.repo_color.sync,
          repo: new_repo_color,
          resource: pipelineData.repo_color.resource,
          project: pipelineData.repo_color.project,
          folder: pipelineData.repo_color.folder,
          columns: pipelineData.repo_color.columns,
          rows: pipelineData.repo_color.rows,
          files: pipelineData.repo_color.files,
          size: pipelineData.repo_color.size,
        },
        vis_color: {
          build: pipelineData.vis_color.build,
          sync: pipelineData.vis_color.sync,
          repo: new_vis_color,
          resource: pipelineData.vis_color.resource,
          project: pipelineData.vis_color.project,
          folder: pipelineData.repo_color.folder,
          columns: pipelineData.repo_color.columns,
          rows: pipelineData.repo_color.rows,
          files: pipelineData.repo_color.files,
          size: pipelineData.repo_color.size,
        },
        colorLegend: pipelineData.colorLegend,
        loading: false,
        lastNode: { id: id },
      });
    } catch (error) {}
  };

  const getUsers = async (userIds) => {
    try {
      const { data } = await axios.post(`/passport/users/byIds`, userIds);

      let map = new Map();
      for (const [key, value] of Object.entries(data)) {
        map.set(key, value);
      }

      user_map = map;
    } catch (error) {}
  };

  const nodes = pipelineData.pipeline.nodes;
  let links = pipelineData.pipeline.links;
  preProcessData(nodes, links);
  useEffect(() => {
    const svg_ref = d3.select(svgref.current);
    const g_ref = d3.select(gref.current);
    const height = parseInt(svg_ref.style("height"));
    const width = parseInt(svg_ref.style("width"));

    // Grid Variables
    const gridSize = 20;
    const gridDotSize = 2.2;
    const gridColor = "#c1c1c1"; // a4a4a4

    /*
     *
     *
     * Initialization
     *
     *
     */

    svg_ref
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height]);

    /*
             Background Gird
             1. Dot Background
             2. Cross Lines Background

             //  Dot Background
            svg_ref.append('pattern')
            .attr('id', 'dot-pattern')
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', gridSize)
            .attr('height', gridSize)
            .append('rect') 
            .attr('width', gridDotSize)
            .attr('height', gridDotSize)
            .attr('fill', gridColor)
            .attr('x', (gridSize / 2) - (gridDotSize / 2))
            .attr('y', (gridSize / 2) - (gridDotSize / 2));
        */

    // Cross Lines Background
    var pattern = svg_ref
      .append("pattern")
      .attr("id", "grid-pattern")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", gridSize)
      .attr("height", gridSize);
    pattern
      .append("line")
      .attr("stroke", gridColor)
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", gridSize * 16)
      .attr("y2", 0);
    pattern
      .append("line")
      .attr("stroke", gridColor)
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", gridSize * 16);

    // Change to grid <-> dot for respective background
    svg_ref
      .append("rect")
      .attr("fill", "url(#grid-pattern)")
      .attr("width", "100%")
      .attr("height", "100%")
      .style("opacity", 0);

    /*
            As g is predefined. 
            After adding newly background our g containing
            all the data got under the new background.
            Therfore not able to perform any funciton on it.
            Hence we raise it up
        */

    g_ref.raise();

    let div = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 1)
      .style("display", "none");

    let family_info = d3
      .select("body")
      .append("div")
      .attr("class", "family_info")
      .style("opacity", 1)
      .style("display", "none");

    let node_normal_group = g_ref
      .selectAll(".bezier-node-group")
      .data(nodes, (d) => d.id)
      .join("g")
      .filter((d) => d.type == "dataset")
      .attr("class", "bezier-node-group")
      .attr("id", function (d) {
        return "node" + String(d.id);
      });

    let node_source_group = g_ref
      .selectAll(".bezier-node-group")
      .data(nodes, (d) => d.id)
      .join("g")
      .filter((d) => d.type == "source")
      .attr("class", "bezier-node-group")
      .attr("id", function (d) {
        return "node" + String(d.id);
      });

    let node_chart_group = g_ref
      .selectAll(".bezier-node-group")

      .data(nodes, (d) => d.id)
      .join("g")
      .filter((d) => d.type == "chart")
      .attr("class", "bezier-node-group")
      .attr("id", function (d) {
        return "node" + String(d.id);
      });

    let node_dashboard_group = g_ref
      .selectAll(".bezier-node-group")
      .data(nodes, (d) => d.id)
      .join("g")
      .filter((d) => d.type == "dashboard")
      .attr("class", "bezier-node-group")
      .attr("id", function (d) {
        return "node" + String(d.id);
      });

    const texts_normal = node_normal_group
      .append("text")
      .attr("class", "label")
      .attr("id", function (d) {
        return "label" + String(d.id);
      })
      .attr("fill", function (d) {
        if (pipelineData.color == "sync" && d.syncStatus == "true")
          return "white";
        else return "#24527a";
      })
      .text(function (d) {
        return d.name;
      })
      .attr("text-anchor", "left")
      .style("font-size", "20px");

    const texts_source = node_source_group
      .append("text")
      .attr("class", "label")
      .attr("id", function (d) {
        return "label" + String(d.id);
      })
      .attr("fill", "black")
      .text(function (d) {
        return d.name;
      })
      .attr("text-anchor", "left")
      .style("font-size", "20px")
      .style("fill", "#24527a");

    const texts_chart = node_chart_group
      .append("text")
      .attr("class", "label")
      .attr("id", function (d) {
        return "label" + String(d.id);
      })
      .attr("fill", "black")
      .text(function (d) {
        return d.name;
      })
      .attr("text-anchor", "left")
      .style("font-size", "20px")
      .style("fill", "#24527a");

    const texts_dashboard = node_dashboard_group
      .append("text")
      .attr("class", "label")
      .attr("id", function (d) {
        return "label" + String(d.id);
      })
      .attr("fill", "black")
      .text(function (d) {
        return d.name;
      })
      .attr("text-anchor", "left")
      .style("font-size", "20px")
      .style("fill", "#24527a");

    let node_normal = node_normal_group
      .append("rect")
      .attr("class", "bezier-node")
      // .style("filter", "url(#drop-shadow)")
      .attr("width", function (d) {
        let width = 117;
        if (d3.select("#label" + d.id).size() !== 0) {
          width = d3
            .select("#label" + d.id)
            .node()
            .getBBox().width;
          return width + 117;
        }
        return width;
      })
      .attr("height", 60)
      .attr("stroke", function (d) {
        if (
          pipelineData.type == "children" &&
          pipelineData.currentSelectedNode.id == pipelineData.lastNode.id
        ) {
          let children = cur_graph.get(pipelineData.lastNode.id).children;
          for (let child of children) {
            if (child.id == d.id) {
              return "#FFBF00";
            }
          }
        } else if (
          pipelineData.type == "parent" &&
          pipelineData.currentSelectedNode.id == pipelineData.lastNode.id
        ) {
          let parents = cur_graph.get(pipelineData.lastNode.id).parents;
          for (let parent of parents) {
            if (parent.id == d.id) {
              return "#FFBF00";
            }
          }
        }
        if (pipelineData.currentSelectedNode.id === d.id) return "#FFBF00";
        else if (d.buildStatus === SUCCESS) return "#9be9a8";
        else if (d.buildStatus === FAILED) return "#ea5c58";
        else if (d.buildStatus === ABORTED) return "#FFBF00";
        else if (d.buildStatus === CANCELLED) return "#FA999C";
        else return "#C4BFBA";
      })
      .attr("fill", function (d) {
        let nodeColor = "#FFAD99";
        if (pipelineData.color == "resource") {
          if (d.subType == "PYTHON") return "#FFD34E";
          else if (d.subType == "uploaded") return "#dfe3ee";
          else if (d.subType == "SQL") return "#8ABBFF";
          else if (d.subType == "connect") {
            return "#FFAD99";
          } else return "green";
        } else if (pipelineData.color == "build") {
          if (d.buildStatus === SUCCESS) {
            return "#77dd77";
          } else if (d.buildStatus === FAILED) {
            return "#f88379";
          } else if (d.buildStatus === ABORTED) {
            return "#FFBF00";
          } else if (d.buildStatus === CANCELLED) {
            return "#FA999C";
          } else {
            return "#f0fff0";
          }
        } else if (pipelineData.color == "repo") {
          if (d.repository) {
            return pipelineData.repo_color.repo.get(d.repository)[1];
          } else {
            // return pipelineData.repo_color.repo.get("Not Available")[1];
            return "#F2ABA2";
          }
        } else if (pipelineData.color == "project") {
          if (d.projectName) {
            return pipelineData.repo_color.project.get(d.projectName)[1];
          } else {
            return "white";
          }
        } else if (pipelineData.color == "folder") {
          if (d.parentFolder) {
            return pipelineData.repo_color.folder.get(d.parentFolder)[1];
          } else {
            return "white";
          }
        } else if (pipelineData.color == "rows") {
          if (d.rows) {
            return pipelineData.repo_color.rows.get(d.rows)[1];
          } else {
            return "white";
          }
        } else if (pipelineData.color == "columns") {
          if (d.columns) {
            return pipelineData.repo_color.columns.get(d.columns)[1];
          } else {
            return "white";
          }
        } else if (pipelineData.color == "files") {
          if (d.files) {
            return pipelineData.repo_color.files.get(d.files)[1];
          } else {
            return "white";
          }
        } else if (pipelineData.color == "size") {
          if (d.size) {
            return pipelineData.repo_color.size.get(d.size)[1];
          } else {
            return "white";
          }
        } else if (pipelineData.color == "sync") {
          if (d.syncStatus == "true") {
            return "";
          } else {
            return "#acc7df";
          }
        } else {
          return "white";
        }
      })
      .attr("rx", 8)
      .attr("ry", 8)
      .attr("transform", (d) => "translate(" + [d.x, d.y] + ")")
      .on("mouseover", function (event, d) {
        d3.select(this).style("strokeWidth", 6);
        if (d.totalParents != 0) {
          d3.select("#arrow_outer_left" + String(d.id)).style(
            "display",
            "block"
          );
        }
        if (d.totalChildren != 0) {
          d3.select("#arrow_outer_right" + String(d.id)).style(
            "display",
            "block"
          );
        }

        d3.select("#information" + String(d.id)).style("opacity", 1);
        function displayUser(userDetails) {
          if (!user_map.has(userDetails)) {
            return "NONE";
          }
          return user_map.get(userDetails).name;
        }

        div.style("opacity", 1).style("display", "block");
        div
          .html(
            `
                    <div class="info-container"> 
                        <div class="info-container-header">
                            <div class="info-container-header-row">` +
              (d.subType == "connect"
                ? `<svg color="#ffcf00" data-icon="dataset-icon" fill="currentColor" height="16" viewBox="0 0 16 16" width="16" > {" "} <desc>dynamic</desc>{" "} <g id="Artboard-1" transform="translate(0.000000, -1.000000)"> {" "} <path id="Shape" d="M15,2H1C0.4,2,0,2.5,0,3v12c0,0.6,0.4,1,1,1h14c0.6,0,1-0.4,1-1V3 C16,2.5,15.6,2,15,2L15,2z M6,14H2v-2h4V14L6,14z M6,11H2V9h4V11L6,11z M6,8H2V6h4V8L6,8z M14,14H7v-2h7V14L14,14z M14,11H7V9h7 V11L14,11z M14,8H7V6h7V8L14,8z" fill={color} fillRule="evenodd" />{" "} </g>{" "} </svg>`
                : d.subType == "uploaded"
                ? `<svg color="#717a94" data-icon="dataset-icon" fill="currentColor" height="16" viewBox="0 0 16 16" width="16" > {" "} <desc>dynamic</desc>{" "} <g id="Artboard-1" transform="translate(0.000000, -1.000000)"> {" "} <path id="Shape" d="M15,2H1C0.4,2,0,2.5,0,3v12c0,0.6,0.4,1,1,1h14c0.6,0,1-0.4,1-1V3 C16,2.5,15.6,2,15,2L15,2z M6,14H2v-2h4V14L6,14z M6,11H2V9h4V11L6,11z M6,8H2V6h4V8L6,8z M14,14H7v-2h7V14L14,14z M14,11H7V9h7 V11L14,11z M14,8H7V6h7V8L14,8z" fill={color} fillRule="evenodd" />{" "} </g>{" "} </svg>`
                : `<svg color="#4C90F0" data-icon="dataset-icon" fill="currentColor" height="16" viewBox="0 0 16 16" width="16" > {" "} <desc>dynamic</desc>{" "} <g id="Artboard-1" transform="translate(0.000000, -1.000000)"> {" "} <path id="Shape" d="M15,2H1C0.4,2,0,2.5,0,3v12c0,0.6,0.4,1,1,1h14c0.6,0,1-0.4,1-1V3 C16,2.5,15.6,2,15,2L15,2z M6,14H2v-2h4V14L6,14z M6,11H2V9h4V11L6,11z M6,8H2V6h4V8L6,8z M14,14H7v-2h7V14L14,14z M14,11H7V9h7 V11L14,11z M14,8H7V6h7V8L14,8z" fill={color} fillRule="evenodd" />{" "} </g>{" "} </svg>`) +
              `
                            
                                &nbsp;
                                ${d.name}
                            </div>
                            <div class="info-container-header-row">   
                                <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svgjs="http://svgjs.com/svgjs" width="16" height="16" x="0" y="0" viewBox="0 0 511 511" style="enable-background:new 0 0 512 512" xml:space="preserve" class=""><g><g><path d="m99.5 63.5h32v384h-32z" fill="#bddbff" data-original="#bddbff"></path><path d="m131.5 235.5-32 32v20l32-32z" fill="#57a4ff" data-original="#57a4ff"></path><path d="m99.5 101.168c5.071 1.51 10.438 2.332 16 2.332s10.929-.823 16-2.332v-37.668h-32z" fill="#57a4ff" data-original="#57a4ff"></path><g><path d="m99.5 447.5v-160l128-128h160v32h-144l-112 112v144" fill="#bddbff" data-original="#bddbff"></path></g><path d="m339.5 175.5c0 5.562.823 10.929 2.332 16h45.668v-32h-45.668c-1.509 5.071-2.332 10.438-2.332 16z" fill="#57a4ff" data-original="#57a4ff"></path><circle cx="395.5" cy="175.5" fill="#d7fc7e" r="40" data-original="#d7fc7e"></circle><path d="m131.5 409.832c-5.071-1.51-10.438-2.332-16-2.332s-10.929.823-16 2.332v37.668h32z" fill="#57a4ff" data-original="#57a4ff"></path><circle cx="115.5" cy="47.5" fill="#ff7956" r="40" data-original="#ff7956"></circle><path d="m115.5 7.5c-2.74 0-5.415.277-8 .802 18.258 3.706 32 19.847 32 39.198s-13.742 35.492-32 39.198c2.585.525 5.26.802 8 .802 22.091 0 40-17.909 40-40 0-22.091-17.909-40-40-40z" fill="#ff3f62" data-original="#ff3f62"></path><path d="m395.5 135.5c-2.74 0-5.415.277-8 .802 18.258 3.706 32 19.847 32 39.198s-13.742 35.492-32 39.198c2.585.525 5.26.802 8 .802 22.091 0 40-17.909 40-40s-17.909-40-40-40z" fill="#55e072" data-original="#55e072"></path><circle cx="115.5" cy="463.5" fill="#ffe477" r="40" data-original="#ffe477"></circle><path d="m115.5 423.5c-2.74 0-5.415.277-8 .802 18.258 3.706 32 19.847 32 39.198s-13.742 35.492-32 39.198c2.585.525 5.26.802 8 .802 22.091 0 40-17.909 40-40s-17.909-40-40-40z" fill="#ffb655" data-original="#ffb655"></path><g><path d="m115.5 95c26.191 0 47.5-21.309 47.5-47.5s-21.309-47.5-47.5-47.5-47.5 21.309-47.5 47.5 21.309 47.5 47.5 47.5zm0-80c17.92 0 32.5 14.58 32.5 32.5s-14.58 32.5-32.5 32.5-32.5-14.58-32.5-32.5 14.58-32.5 32.5-32.5z" fill="#000000" data-original="#000000"></path><path d="m395.5 128c-17.646 0-33.063 9.679-41.253 24h-129.853l-85.394 85.394v-133.894h-15v148.894l-17 17v-165.894h-15v318.747c-14.321 8.19-24 23.608-24 41.253 0 26.191 21.309 47.5 47.5 47.5s47.5-21.309 47.5-47.5c0-17.646-9.679-33.063-24-41.253v-54.747h-15v49.277c-2.76-.501-5.598-.777-8.5-.777s-5.74.276-8.5.777v-126.17l123.606-123.607h118.17c-.501 2.76-.777 5.598-.777 8.5s.276 5.74.777 8.5h-108.382l-116.394 116.394v51.106h15v-44.894l107.606-107.606h107.64c8.19 14.321 23.608 24 41.253 24 26.191 0 47.5-21.309 47.5-47.5s-21.308-47.5-47.499-47.5zm-247.5 335.5c0 17.92-14.58 32.5-32.5 32.5s-32.5-14.58-32.5-32.5 14.58-32.5 32.5-32.5 32.5 14.58 32.5 32.5zm247.5-255.5c-17.92 0-32.5-14.58-32.5-32.5s14.58-32.5 32.5-32.5 32.5 14.58 32.5 32.5-14.58 32.5-32.5 32.5z" fill="#000000" data-original="#000000"></path></g><g><path d="m107.5 40h16v15h-16z" fill="#ffffff" data-original="#ffffff"></path></g><g><path d="m387.5 168h16v15h-16z" fill="#ffffff" data-original="#ffffff"></path></g><g><path d="m107.5 456h16v15h-16z" fill="#ffffff" data-original="#ffffff"></path></g></g></g></svg>
                                &nbsp;
                                ${d.branch}
                            </div>
                        </div>
                       
                        <div class="info-container-header-row">
                        <svg color="#717a94" data-icon="FOLDER" fill="#717a94" height="16" viewBox="0 0 16 16" width="16" > <desc>dynamic</desc> <g strokeWidth="1"> <g transform=""> <path clipRule="evenodd" d="M2.146 3.146A.5.5 0 0 1 2.5 3h3.793l2 2H13.5a.5.5 0 0 1 .5.5V7H2V3.5a.5.5 0 0 1 .146-.354ZM2 8v4.5a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5V8H2Zm.5-6A1.5 1.5 0 0 0 1 3.5v9A1.5 1.5 0 0 0 2.5 14h11a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 13.5 4H8.707l-2-2H2.5Z" fill="currentColor" fillRule="evenodd" ></path> </g> </g> </svg>
                            &nbsp;
                            ${d.path}
                        </div>
                    ` +
              (d.repository && d.repository != null
                ? `
                        <div class="info-container-header-row">
                        <svg viewBox="64 64 896 896" focusable="false" data-icon="github" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M511.6 76.3C264.3 76.2 64 276.4 64 523.5 64 718.9 189.3 885 363.8 946c23.5 5.9 19.9-10.8 19.9-22.2v-77.5c-135.7 15.9-141.2-73.9-150.3-88.9C215 726 171.5 718 184.5 703c30.9-15.9 62.4 4 98.9 57.9 26.4 39.1 77.9 32.5 104 26 5.7-23.5 17.9-44.5 34.7-60.8-140.6-25.2-199.2-111-199.2-213 0-49.5 16.3-95 48.3-131.7-20.4-60.5 1.9-112.3 4.9-120 58.1-5.2 118.5 41.6 123.2 45.3 33-8.9 70.7-13.6 112.9-13.6 42.4 0 80.2 4.9 113.5 13.9 11.3-8.6 67.3-48.8 121.3-43.9 2.9 7.7 24.7 58.3 5.5 118 32.4 36.8 48.9 82.7 48.9 132.3 0 102.2-59 188.1-200 212.9a127.5 127.5 0 0138.1 91v112.5c.8 9 0 17.9 15 17.9 177.1-59.7 304.6-227 304.6-424.1 0-247.2-200.4-447.3-447.5-447.3z"></path></svg>
                            &nbsp
                            ${d.repository}
                        </div>
                        `
                : ``) +
              `
                        <div class="info-container-header-row">
                        <svg color="#717a94" data-icon="list-search-icon" fill="#717a94" height="16" viewBox="0 0 16 16" width="16" > <desc>dynamic</desc> <g strokeWidth="1"> <g transform=""> <path clipRule="evenodd" d="M5.682 2c-.426.283-.814.62-1.154 1H.5a.5.5 0 0 1 0-1h5.182ZM.5 13h11.022a.5.5 0 0 1 0 1H.5a.5.5 0 0 1 0-1Zm3.51-2.667a5.986 5.986 0 0 1-.54-1H.5a.5.5 0 0 0 0 1h3.51ZM.5 5.667h2.649a6 6 0 0 0-.14 1H.5a.5.5 0 0 1 0-1Zm6.97-2.363a4 4 0 1 1 3.06 7.391 4 4 0 0 1-3.06-7.39ZM9 2a5 5 0 1 0 3.164 8.871l2.482 2.483.708-.708-2.483-2.482A5 5 0 0 0 9 2Z" fill="currentColor" fillRule="evenodd" ></path> </g> </g> </svg>
                            &nbsp;
                            ${autoFormatter(d.size, "bytes")} . ${autoFormatter(
                d.files
              )} files | ${autoFormatter(d.rows)} rows . ${d.columns} cols
                        </div>
                    ` +
              (d.buildStatus && d.buildStatus != null
                ? `
                        <div class="info-container-header-row">
                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" version="1.1" viewBox="0 0 16 16" width="1em" height="1em" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;"><path d="M15.784 14.309l-8.572-7.804 0.399-0.4c0.326-0.327 0.503-0.75 0.53-1.181 0.016-0.007 0.031-0.014 0.046-0.023l1.609-1.006c0.218-0.256 0.202-0.66-0.036-0.898l-2.799-2.806c-0.237-0.238-0.641-0.254-0.896-0.036l-1.004 1.614c-0.008 0.015-0.015 0.031-0.022 0.046-0.43 0.027-0.852 0.204-1.178 0.531l-1.522 1.527c-0.327 0.327-0.503 0.75-0.53 1.181-0.016 0.007-0.031 0.014-0.046 0.023l-1.609 1.006c-0.218 0.256-0.202 0.66 0.036 0.898l2.799 2.806c0.237 0.238 0.641 0.254 0.896 0.036l1.004-1.614c0.008-0.015 0.015-0.031 0.023-0.046 0.43-0.027 0.852-0.204 1.178-0.531l0.442-0.443 7.783 8.596c0.226 0.249 0.573 0.289 0.773 0.089l0.787-0.789c0.199-0.2 0.159-0.549-0.089-0.775z"></path></svg>
                            &nbsp;
                            Built ${capitalizeFirstLetter(d.buildStatus)} 
                        </div>
                    `
                : ``) +
              `
                        <div class="info-container-header-row">
                        <svg data-icon="writeback-cell" fill="#717a94" height="16" viewBox="0 0 16 16" width="16"><desc>dynamic</desc><g strokeWidth="1"><g transform=""><path clipRule="evenodd" d="m2.15.61.042-.014C3.372.222 4.07 0 7 0c1.965 0 3.645.226 4.85.608.601.19 1.113.428 1.485.718.369.287.665.68.665 1.173v3.304a5.971 5.971 0 0 0-1-.462V3.897c-.323.19-.713.353-1.15.491-1.205.382-2.885.609-4.85.609-2.93 0-3.628-.221-4.807-.595l-.044-.014A5.656 5.656 0 0 1 1 3.898v3.598c0 .059.033.192.28.384.242.189.63.382 1.171.553l.13.042c.762.243 1.315.419 2.774.488a5.958 5.958 0 0 0-.264.988c-1.424-.083-2.032-.276-2.899-.55l-.043-.014A5.652 5.652 0 0 1 1 8.895v3.597c0 .059.033.192.279.383.243.19.63.382 1.172.554l.13.04c.834.267 1.416.452 3.207.506.208.363.453.703.73 1.014-2.53-.024-3.214-.24-4.326-.593l-.043-.014c-.6-.19-1.112-.428-1.484-.717-.369-.287-.665-.68-.665-1.173V2.5c0-.493.296-.886.665-1.173.372-.29.884-.527 1.484-.718ZM13 2.498c0 .058-.033.192-.279.383-.242.188-.63.381-1.172.553-1.078.341-2.648.562-4.549.562-2.782 0-3.42-.203-4.42-.52l-.129-.042c-.541-.171-.93-.364-1.172-.553C1.033 2.691 1 2.558 1 2.5c0-.059.033-.192.28-.384.242-.189.63-.382 1.171-.553l.13-.042C3.579 1.203 4.217 1 7 1c1.901 0 3.471.22 4.549.562.541.171.93.364 1.172.553.246.191.279.325.279.384ZM11 6a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm-4 5a4 4 0 1 1 8 0 4 4 0 0 1-8 0Zm3.5-2.25v1.75H8.75v1h1.75v1.75h1V11.5h1.75v-1H11.5V8.75h-1Z" fill="currentColor" fillRule="evenodd"></path></g></g></svg>
                        &nbsp;
                        Build Source :
                            &nbsp;
                            ${capitalizeFirstLetter(d.subType)}
                        </div>
                    ` +
              `
                        <div class="info-container-header-row">
                        Created
                            &nbsp;
                            ${
                              formatTime(d.createdAt) +
                              " by " +
                              displayUser(d.createdBy)
                            }
                        </div>
                    ` +
              (d.updatedAt && d.updatedAt != null
                ? `
                        <div class="info-container-header-row">
                        Updated
                            &nbsp;
                            ${
                              formatTime(d.updatedAt) +
                              " by " +
                              displayUser(d.updatedBy)
                            }
                        </div>
                    `
                : "") +
              `
                    </div>
                    `
          )
          .style("left", event.pageX + 20 + "px")
          .style("top", event.pageY + 40 + "px");
      })
      .on("mouseout", function (event, d) {
        d3.select(this).style("strokeWidth", 2);
        d3.select("#arrow_outer_left" + String(d.id)).style(
          "display",
          function (d) {
            if (
              d.totalParents > 0 &&
              d.totalParents > nodes_hash.get(d.id).parents
            ) {
              return "block";
            } else {
              return "none";
            }
          }
        );
        d3.select("#arrow_outer_right" + String(d.id)).style(
          "display",
          function (d) {
            if (
              d.totalChildren > 0 &&
              d.totalChildren > nodes_hash.get(d.id).children
            ) {
              return "block";
            } else {
              return "none";
            }
          }
        );

        d3.select("#information" + String(d.id)).style("opacity", 0);
        div.style("opacity", 0).style("display", "none");
      })
      .on("click", function (event, d) {
        dispatch(selectedNode({ id: d.id, type: d.type, name: d.name }));
        setPipelineData({
          pipeline: pipelineData.pipeline,
          currentSelectedNode: { id: d.id, name: d.name },
          type: "selected",
          flow: pipelineData.flow,
          color: pipelineData.color,
          repo_color: pipelineData.repo_color,
          vis_color: pipelineData.vis_color,
          colorLegend: pipelineData.colorLegend,
          loading: pipelineData.loading,
          lastNode: pipelineData.lastNode,
        });
      })
      .on("contextmenu", function (event, d) {
        // dispatch(getBuildSpec(d.id, d.branch));
        div.style("opacity", 0).style("display", "none");
        event.preventDefault();
        let buildExist = d.repository != undefined;
        PipelineContextMenus(
          event,
          {
            id: d.id,
            type: "dataset",
            branch: d.branch,
            transactionId: d.transactionId,
          },
          dispatch,
          id,
          buildExist
        );
        setcontextMenu({
          event: event,
          record: {
            id: d.id,
            type: "dataset",
            branch: d.branch,
          },
          dispatch: dispatch,
          id: id,
          buildexist: buildExist,
        });
      })
      .classed("bezier-node", true)
      .classed("bezier-fixed", (d) => d.fx !== undefined)
      .classed("bezier-fixed", (d) => d.fx !== undefined);
    // .style("animation", "transcolor 3s infinite linear alternate");

    let node_source = node_source_group
      .append("rect")
      .attr("class", "bezier-node")
      // .style("filter", "url(#drop-shadow)")
      .attr("width", function (d) {
        let width = 117 + 17;
        if (d3.select("#label" + d.id).size() !== 0) {
          width += d3
            .select("#label" + d.id)
            .node()
            .getBBox().width;
          return width;
        }
        return width;
      })
      .attr("height", 60)
      .attr("stroke", function (d) {
        if (
          pipelineData.type == "children" &&
          pipelineData.currentSelectedNode.id == pipelineData.lastNode.id
        ) {
          let children = cur_graph.get(pipelineData.lastNode.id).children;
          for (let child of children) {
            if (child.id == d.id) {
              return "#FFBF00";
            }
          }
        } else if (
          pipelineData.type == "parent" &&
          pipelineData.currentSelectedNode.id == pipelineData.lastNode.id
        ) {
          let parents = cur_graph.get(pipelineData.lastNode.id).parents;
          for (let parent of parents) {
            if (parent.id == d.id) {
              return "#FFBF00";
            }
          }
        }
        if (pipelineData.currentSelectedNode.id === d.id) return "#FFBF00";
        else if (d.buildStatus === "success") return "#9be9a8";
        else if (d.buildStatus === "fail") return "#ea5c58";
        else return "#C4BFBA";
      })
      .attr("fill", function (d) {
        if (pipelineData.color == "project") {
          if (d.projectName) {
            return pipelineData.repo_color.project.get(d.projectName)[1];
          } else {
            return "white";
          }
        } else {
          return "white";
        }
      })
      .attr("rx", 2)
      .attr("ry", 2)
      .attr("transform", (d) => "translate(" + [d.x, d.y] + ")")
      .on("mouseover", function (event, d) {
        d3.select(this).style("strokeWidth", 6);
        if (d.totalParents != 0) {
          d3.select("#arrow_outer_left" + String(d.id)).style(
            "display",
            "block"
          );
        }
        if (d.totalChildren != 0) {
          d3.select("#arrow_outer_right" + String(d.id)).style(
            "display",
            "block"
          );
        }

        d3.select("#information" + String(d.id)).style("opacity", 1);
        function displayUser(userDetails) {
          if (!user_map.has(userDetails)) {
            return "NONE";
          }
          return user_map.get(userDetails).name;
        }
      })
      .on("mouseout", function (event, d) {
        d3.select(this).style("strokeWidth", 2);
        d3.select("#arrow_outer_left" + String(d.id)).style(
          "display",
          function (d) {
            if (
              d.totalParents > 0 &&
              d.totalParents > nodes_hash.get(d.id).parents
            ) {
              return "block";
            } else {
              return "none";
            }
          }
        );
        d3.select("#arrow_outer_right" + String(d.id)).style(
          "display",
          function (d) {
            if (
              d.totalChildren > 0 &&
              d.totalChildren > nodes_hash.get(d.id).children
            ) {
              return "block";
            } else {
              return "none";
            }
          }
        );

        d3.select("#information" + String(d.id)).style("opacity", 0);
      })
      .on("click", function (event, d) {
        dispatch(selectedNode({ id: d.id, type: d.type, name: d.name }));
        setPipelineData({
          pipeline: pipelineData.pipeline,
          currentSelectedNode: { id: d.id, name: d.name },
          type: "selected",
          flow: pipelineData.flow,
          color: pipelineData.color,
          repo_color: pipelineData.repo_color,
          vis_color: pipelineData.vis_color,
          colorLegend: pipelineData.colorLegend,
          loading: pipelineData.loading,
          lastNode: pipelineData.lastNode,
        });
      })
      .on("contextmenu", function (event, d) {
        // dispatch(getBuildSpec(d.id, d.branch));
        div.style("opacity", 0).style("display", "none");

        event.preventDefault();
        PipelineContextMenus(
          event,
          {
            id: d.id,
            type: "dataset",
            branch: d.branch,
          },
          dispatch,
          id,
          false
        );
        setcontextMenu({
          event: event,
          record: {
            id: d.id,
            type: "dataset",
            branch: d.branch,
          },
          dispatch: dispatch,
          id: id,
          buildexist: false,
        });
      })
      .classed("bezier-node", true)
      .classed("bezier-fixed", (d) => d.fx !== undefined);

    let node_chart = node_chart_group
      .append("rect")
      .attr("class", "bezier-node-chart")
      // .style("filter", "url(#drop-shadow)")
      .style("strokeWidth", 2)
      .attr("width", function (d) {
        let width = 117 + 0;
        if (d3.select("#label" + d.id).size() !== 0) {
          width += d3
            .select("#label" + d.id)
            .node()
            .getBBox().width;
          return width;
        }
        return width;
      })
      .attr("height", 60)
      .attr("stroke", function (d) {
        if (
          pipelineData.type == "children" &&
          pipelineData.currentSelectedNode.id == pipelineData.lastNode.id
        ) {
          let children = cur_graph.get(pipelineData.lastNode.id).children;
          for (let child of children) {
            if (child.id == d.id) {
              //
              return "#FFBF00";
            }
          }
        } else if (
          pipelineData.type == "parent" &&
          pipelineData.currentSelectedNode.id == pipelineData.lastNode.id
        ) {
          let parents = cur_graph.get(pipelineData.lastNode.id).parents;
          for (let parent of parents) {
            if (parent.id == d.id) {
              //
              return "#FFBF00";
            }
          }
        }
        if (pipelineData.currentSelectedNode.id === d.id) return "#FFBF00";
        else return "#f2e5f2";
      })
      .attr("fill", function (d) {
        if (pipelineData.color == "project") {
          if (d.projectName != null) {
            return pipelineData.repo_color.project.get(d.projectName)[1];
          } else {
            return "white";
          }
        } else if (pipelineData.color == "folder") {
          return "white";
        } else if (pipelineData.color == "columns") {
          return "white";
        } else if (pipelineData.color == "rows") {
          return "white";
        } else if (pipelineData.color == "files") {
          return "white";
        } else if (pipelineData.color == "size") {
          return "white";
        } else if (pipelineData.color == "repo") {
          return "white";
        } else if (pipelineData.color == "sync") {
          return "white";
        } else if (pipelineData.color == "build") {
          return "white";
        } else {
          return "#CABDFF";
        }
      })
      .attr("rx", 2)
      .attr("ry", 2)
      .attr("transform", (d) => "translate(" + [d.x, d.y] + ")")
      .on("mouseover", function (event, d) {
        d3.select(this).style("strokeWidth", 6);
        if (d.totalParents != 0) {
          d3.select("#arrow_outer_left" + String(d.id)).style(
            "display",
            "block"
          );
        }
        if (d.totalChildren != 0) {
          d3.select("#arrow_outer_right" + String(d.id)).style(
            "display",
            "block"
          );
        }

        d3.select("#information" + String(d.id)).style("opacity", 1);
        function displayUser(userDetails) {
          if (!user_map.has(userDetails)) {
            return "NONE";
          }
          return user_map.get(userDetails).name;
        }

        // hover icon div popover
        div.style("opacity", 1).style("display", "block");
        div
          .html(
            `
                    <div class="info-container"> 
                        <div class="info-container-header">
                            <div class="info-container-header-row">
                            ` +
              BEZIER_CHARTS_SVG_ICONS[d.subType] +
              `
                                &nbsp;
                                ${d.name}
                            </div>
                            <div class="info-container-header-row">   
                                <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svgjs="http://svgjs.com/svgjs" width="16" height="16" x="0" y="0" viewBox="0 0 511 511" style="enable-background:new 0 0 512 512" xml:space="preserve" class=""><g><g><path d="m99.5 63.5h32v384h-32z" fill="#bddbff" data-original="#bddbff"></path><path d="m131.5 235.5-32 32v20l32-32z" fill="#57a4ff" data-original="#57a4ff"></path><path d="m99.5 101.168c5.071 1.51 10.438 2.332 16 2.332s10.929-.823 16-2.332v-37.668h-32z" fill="#57a4ff" data-original="#57a4ff"></path><g><path d="m99.5 447.5v-160l128-128h160v32h-144l-112 112v144" fill="#bddbff" data-original="#bddbff"></path></g><path d="m339.5 175.5c0 5.562.823 10.929 2.332 16h45.668v-32h-45.668c-1.509 5.071-2.332 10.438-2.332 16z" fill="#57a4ff" data-original="#57a4ff"></path><circle cx="395.5" cy="175.5" fill="#d7fc7e" r="40" data-original="#d7fc7e"></circle><path d="m131.5 409.832c-5.071-1.51-10.438-2.332-16-2.332s-10.929.823-16 2.332v37.668h32z" fill="#57a4ff" data-original="#57a4ff"></path><circle cx="115.5" cy="47.5" fill="#ff7956" r="40" data-original="#ff7956"></circle><path d="m115.5 7.5c-2.74 0-5.415.277-8 .802 18.258 3.706 32 19.847 32 39.198s-13.742 35.492-32 39.198c2.585.525 5.26.802 8 .802 22.091 0 40-17.909 40-40 0-22.091-17.909-40-40-40z" fill="#ff3f62" data-original="#ff3f62"></path><path d="m395.5 135.5c-2.74 0-5.415.277-8 .802 18.258 3.706 32 19.847 32 39.198s-13.742 35.492-32 39.198c2.585.525 5.26.802 8 .802 22.091 0 40-17.909 40-40s-17.909-40-40-40z" fill="#55e072" data-original="#55e072"></path><circle cx="115.5" cy="463.5" fill="#ffe477" r="40" data-original="#ffe477"></circle><path d="m115.5 423.5c-2.74 0-5.415.277-8 .802 18.258 3.706 32 19.847 32 39.198s-13.742 35.492-32 39.198c2.585.525 5.26.802 8 .802 22.091 0 40-17.909 40-40s-17.909-40-40-40z" fill="#ffb655" data-original="#ffb655"></path><g><path d="m115.5 95c26.191 0 47.5-21.309 47.5-47.5s-21.309-47.5-47.5-47.5-47.5 21.309-47.5 47.5 21.309 47.5 47.5 47.5zm0-80c17.92 0 32.5 14.58 32.5 32.5s-14.58 32.5-32.5 32.5-32.5-14.58-32.5-32.5 14.58-32.5 32.5-32.5z" fill="#000000" data-original="#000000"></path><path d="m395.5 128c-17.646 0-33.063 9.679-41.253 24h-129.853l-85.394 85.394v-133.894h-15v148.894l-17 17v-165.894h-15v318.747c-14.321 8.19-24 23.608-24 41.253 0 26.191 21.309 47.5 47.5 47.5s47.5-21.309 47.5-47.5c0-17.646-9.679-33.063-24-41.253v-54.747h-15v49.277c-2.76-.501-5.598-.777-8.5-.777s-5.74.276-8.5.777v-126.17l123.606-123.607h118.17c-.501 2.76-.777 5.598-.777 8.5s.276 5.74.777 8.5h-108.382l-116.394 116.394v51.106h15v-44.894l107.606-107.606h107.64c8.19 14.321 23.608 24 41.253 24 26.191 0 47.5-21.309 47.5-47.5s-21.308-47.5-47.499-47.5zm-247.5 335.5c0 17.92-14.58 32.5-32.5 32.5s-32.5-14.58-32.5-32.5 14.58-32.5 32.5-32.5 32.5 14.58 32.5 32.5zm247.5-255.5c-17.92 0-32.5-14.58-32.5-32.5s14.58-32.5 32.5-32.5 32.5 14.58 32.5 32.5-14.58 32.5-32.5 32.5z" fill="#000000" data-original="#000000"></path></g><g><path d="m107.5 40h16v15h-16z" fill="#ffffff" data-original="#ffffff"></path></g><g><path d="m387.5 168h16v15h-16z" fill="#ffffff" data-original="#ffffff"></path></g><g><path d="m107.5 456h16v15h-16z" fill="#ffffff" data-original="#ffffff"></path></g></g></g></svg>
                                &nbsp;
                                ${d.branch}
                            </div>
                        </div>
                       
                        <div class="info-container-header-row">
                        <svg color="#717a94" data-icon="FOLDER" fill="#717a94" height="16" viewBox="0 0 16 16" width="16" > <desc>dynamic</desc> <g strokeWidth="1"> <g transform=""> <path clipRule="evenodd" d="M2.146 3.146A.5.5 0 0 1 2.5 3h3.793l2 2H13.5a.5.5 0 0 1 .5.5V7H2V3.5a.5.5 0 0 1 .146-.354ZM2 8v4.5a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5V8H2Zm.5-6A1.5 1.5 0 0 0 1 3.5v9A1.5 1.5 0 0 0 2.5 14h11a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 13.5 4H8.707l-2-2H2.5Z" fill="currentColor" fillRule="evenodd" ></path> </g> </g> </svg>
                            &nbsp;
                            ${d.path}
                        </div>
                    ` +
              `
                        <div class="info-container-header-row">
                        Created
                            &nbsp;
                            ${
                              formatTime(d.createdAt) +
                              " by " +
                              displayUser(d.createdBy)
                            }
                        </div>
                    ` +
              (d.updatedAt && d.updatedAt != null
                ? `
                        <div class="info-container-header-row">
                        Updated
                            &nbsp;
                            ${
                              formatTime(d.updatedAt) +
                              " by " +
                              displayUser(d.updatedBy)
                            }
                        </div>
                    `
                : "") +
              `
                    </div>
                    `
          )
          .style("left", event.pageX + 20 + "px")
          .style("top", event.pageY + 40 + "px");
      })
      .on("mouseout", function (event, d) {
        d3.select(this).style("strokeWidth", 2);
        d3.select("#arrow_outer_left" + String(d.id)).style(
          "display",
          function (d) {
            if (
              d.totalParents > 0 &&
              d.totalParents > nodes_hash.get(d.id).parents
            ) {
              return "block";
            } else {
              return "none";
            }
          }
        );
        d3.select("#arrow_outer_right" + String(d.id)).style(
          "display",
          function (d) {
            if (
              d.totalChildren > 0 &&
              d.totalChildren > nodes_hash.get(d.id).children
            ) {
              return "block";
            } else {
              return "none";
            }
          }
        );

        d3.select("#information" + String(d.id)).style("opacity", 0);
        div.style("opacity", 0).style("display", "none");
      })
      .on("click", function (event, d) {
        dispatch(selectedNode({ id: d.id, type: d.type, name: d.name }));
        setPipelineData({
          pipeline: pipelineData.pipeline,
          currentSelectedNode: { id: d.id, name: d.name },
          type: "selected",
          flow: pipelineData.flow,
          color: pipelineData.color,
          repo_color: pipelineData.repo_color,
          vis_color: pipelineData.vis_color,
          colorLegend: pipelineData.colorLegend,
          loading: pipelineData.loading,
          lastNode: pipelineData.lastNode,
        });
      })
      .on("contextmenu", function (event, d) {
        // dispatch(getBuildSpec(d.id, d.branch));
        div.style("opacity", 0).style("display", "none");

        event.preventDefault();
        PipelineContextMenus(
          event,
          {
            id: d.id,
            type: "chart",
            branch: d.branch,
          },
          dispatch,
          id,
          false
        );
        setcontextMenu({
          event: event,
          record: {
            id: d.id,
            type: "chart",
            branch: d.branch,
          },
          dispatch: dispatch,
          id: id,
          buildexist: false,
        });
      })
      .classed("bezier-node-chart", true);

    let node_dashboard = node_dashboard_group
      .append("rect")
      .attr("class", "bezier-node-dashboard")
      // .style("filter", "url(#drop-shadow)")
      .attr("width", function (d) {
        let width = 117 + 8;
        if (d3.select("#label" + d.id).size() !== 0) {
          width += d3
            .select("#label" + d.id)
            .node()
            .getBBox().width;
          return width;
        }
        return width;
      })
      .attr("height", 60)
      .attr("stroke", function (d) {
        if (
          pipelineData.type == "children" &&
          pipelineData.currentSelectedNode.id == pipelineData.lastNode.id
        ) {
          let children = cur_graph.get(pipelineData.lastNode.id).children;
          for (let child of children) {
            if (child.id == d.id) {
              return "#FFBF00";
            }
          }
        } else if (
          pipelineData.type == "parent" &&
          pipelineData.currentSelectedNode.id == pipelineData.lastNode.id
        ) {
          let parents = cur_graph.get(pipelineData.lastNode.id).parents;
          for (let parent of parents) {
            if (parent.id == d.id) {
              return "#FFBF00";
            }
          }
        }
        if (pipelineData.currentSelectedNode.id === d.id) return "#FFBF00";
        else return "#f2e5f2";
      })
      .attr("fill", function (d) {
        if (pipelineData.color == "project") {
          if (d.projectName != null) {
            return pipelineData.repo_color.project.get(d.projectName)[1];
          } else {
            return "white";
          }
        } else if (pipelineData.color == "folder") {
          return "white";
        } else if (pipelineData.color == "columns") {
          return "white";
        } else if (pipelineData.color == "rows") {
          return "white";
        } else if (pipelineData.color == "files") {
          return "white";
        } else if (pipelineData.color == "size") {
          return "white";
        } else if (pipelineData.color == "repo") {
          return "white";
        } else if (pipelineData.color == "sync") {
          return "white";
        } else if (pipelineData.color == "build") {
          return "white";
        } else {
          return "#86CDF1";
        }
      })
      .attr("rx", 2)
      .attr("ry", 2)
      .attr("transform", (d) => "translate(" + [d.x, d.y] + ")")
      .on("mouseover", function (event, d) {
        d3.select(this).style("strokeWidth", 6);
        if (d.totalParents != 0) {
          d3.select("#arrow_outer_left" + String(d.id)).style(
            "display",
            "block"
          );
        }
        if (d.totalChildren != 0) {
          d3.select("#arrow_outer_right" + String(d.id)).style(
            "display",
            "block"
          );
        }

        d3.select("#information" + String(d.id)).style("opacity", 1);
        function displayUser(userDetails) {
          if (!user_map.has(userDetails)) {
            return "NONE";
          }
          return user_map.get(userDetails).name;
        }

        div.style("opacity", 1).style("display", "block");
        div
          .html(
            `
                    <div class="info-container"> 
                        <div class="info-container-header">
                            <div class="info-container-header-row">
                            <svg color="#717a94" data-icon="monitor" fill="#717a94" height="16" viewBox="0 0 16 16" width="16" > <desc>dynamic</desc> <g strokeWidth="1"> <g transform=""> <path d="M3 14H13V15H3V14Z" fill="currentColor"></path> <path d="M7 11H9V14H7V11Z" fill="currentColor"></path> <path clipRule="evenodd" d="M15 2H1V10H15V2ZM1 1C0.447715 1 0 1.44772 0 2V10C0 10.5523 0.447715 11 1 11H15C15.5523 11 16 10.5523 16 10V2C16 1.44772 15.5523 1 15 1H1Z" fill="currentColor" fillRule="evenodd" ></path> </g> </g> </svg>
                                &nbsp;
                                ${d.name}
                            </div>
                            <div class="info-container-header-row">   
                                <svg xmlns="http://www.w3.org/2000/svg" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svgjs="http://svgjs.com/svgjs" width="16" height="16" x="0" y="0" viewBox="0 0 511 511" style="enable-background:new 0 0 512 512" xml:space="preserve" class=""><g><g><path d="m99.5 63.5h32v384h-32z" fill="#bddbff" data-original="#bddbff"></path><path d="m131.5 235.5-32 32v20l32-32z" fill="#57a4ff" data-original="#57a4ff"></path><path d="m99.5 101.168c5.071 1.51 10.438 2.332 16 2.332s10.929-.823 16-2.332v-37.668h-32z" fill="#57a4ff" data-original="#57a4ff"></path><g><path d="m99.5 447.5v-160l128-128h160v32h-144l-112 112v144" fill="#bddbff" data-original="#bddbff"></path></g><path d="m339.5 175.5c0 5.562.823 10.929 2.332 16h45.668v-32h-45.668c-1.509 5.071-2.332 10.438-2.332 16z" fill="#57a4ff" data-original="#57a4ff"></path><circle cx="395.5" cy="175.5" fill="#d7fc7e" r="40" data-original="#d7fc7e"></circle><path d="m131.5 409.832c-5.071-1.51-10.438-2.332-16-2.332s-10.929.823-16 2.332v37.668h32z" fill="#57a4ff" data-original="#57a4ff"></path><circle cx="115.5" cy="47.5" fill="#ff7956" r="40" data-original="#ff7956"></circle><path d="m115.5 7.5c-2.74 0-5.415.277-8 .802 18.258 3.706 32 19.847 32 39.198s-13.742 35.492-32 39.198c2.585.525 5.26.802 8 .802 22.091 0 40-17.909 40-40 0-22.091-17.909-40-40-40z" fill="#ff3f62" data-original="#ff3f62"></path><path d="m395.5 135.5c-2.74 0-5.415.277-8 .802 18.258 3.706 32 19.847 32 39.198s-13.742 35.492-32 39.198c2.585.525 5.26.802 8 .802 22.091 0 40-17.909 40-40s-17.909-40-40-40z" fill="#55e072" data-original="#55e072"></path><circle cx="115.5" cy="463.5" fill="#ffe477" r="40" data-original="#ffe477"></circle><path d="m115.5 423.5c-2.74 0-5.415.277-8 .802 18.258 3.706 32 19.847 32 39.198s-13.742 35.492-32 39.198c2.585.525 5.26.802 8 .802 22.091 0 40-17.909 40-40s-17.909-40-40-40z" fill="#ffb655" data-original="#ffb655"></path><g><path d="m115.5 95c26.191 0 47.5-21.309 47.5-47.5s-21.309-47.5-47.5-47.5-47.5 21.309-47.5 47.5 21.309 47.5 47.5 47.5zm0-80c17.92 0 32.5 14.58 32.5 32.5s-14.58 32.5-32.5 32.5-32.5-14.58-32.5-32.5 14.58-32.5 32.5-32.5z" fill="#000000" data-original="#000000"></path><path d="m395.5 128c-17.646 0-33.063 9.679-41.253 24h-129.853l-85.394 85.394v-133.894h-15v148.894l-17 17v-165.894h-15v318.747c-14.321 8.19-24 23.608-24 41.253 0 26.191 21.309 47.5 47.5 47.5s47.5-21.309 47.5-47.5c0-17.646-9.679-33.063-24-41.253v-54.747h-15v49.277c-2.76-.501-5.598-.777-8.5-.777s-5.74.276-8.5.777v-126.17l123.606-123.607h118.17c-.501 2.76-.777 5.598-.777 8.5s.276 5.74.777 8.5h-108.382l-116.394 116.394v51.106h15v-44.894l107.606-107.606h107.64c8.19 14.321 23.608 24 41.253 24 26.191 0 47.5-21.309 47.5-47.5s-21.308-47.5-47.499-47.5zm-247.5 335.5c0 17.92-14.58 32.5-32.5 32.5s-32.5-14.58-32.5-32.5 14.58-32.5 32.5-32.5 32.5 14.58 32.5 32.5zm247.5-255.5c-17.92 0-32.5-14.58-32.5-32.5s14.58-32.5 32.5-32.5 32.5 14.58 32.5 32.5-14.58 32.5-32.5 32.5z" fill="#000000" data-original="#000000"></path></g><g><path d="m107.5 40h16v15h-16z" fill="#ffffff" data-original="#ffffff"></path></g><g><path d="m387.5 168h16v15h-16z" fill="#ffffff" data-original="#ffffff"></path></g><g><path d="m107.5 456h16v15h-16z" fill="#ffffff" data-original="#ffffff"></path></g></g></g></svg>
                                &nbsp;
                                ${d.branch}
                            </div>
                        </div>
                       
                        <div class="info-container-header-row">
                        <div className="text-and-icon-center">
                        <svg color="#717a94" data-icon="FOLDER" fill="#717a94" height="16" viewBox="0 0 16 16" width="16" > <desc>dynamic</desc> <g strokeWidth="1"> <g transform=""> <path clipRule="evenodd" d="M2.146 3.146A.5.5 0 0 1 2.5 3h3.793l2 2H13.5a.5.5 0 0 1 .5.5V7H2V3.5a.5.5 0 0 1 .146-.354ZM2 8v4.5a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5V8H2Zm.5-6A1.5 1.5 0 0 0 1 3.5v9A1.5 1.5 0 0 0 2.5 14h11a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 13.5 4H8.707l-2-2H2.5Z" fill="currentColor" fillRule="evenodd" ></path> </g> </g> </svg>
                            &nbsp;
                            ${d.path}
                            </div>
                        </div>
                    ` +
              `
                        <div class="info-container-header-row">
                        Created
                            &nbsp;
                            ${
                              formatTime(d.createdAt) +
                              " by " +
                              displayUser(d.createdBy)
                            }
                        </div>
                    ` +
              (d.updatedAt && d.updatedAt != null
                ? `
                        <div class="info-container-header-row">
                        Updated
                            &nbsp;
                            ${
                              formatTime(d.updatedAt) +
                              " by " +
                              displayUser(d.updatedBy)
                            }
                        </div>
                    `
                : "") +
              `
                    </div>
                    `
          )
          .style("left", event.pageX + 20 + "px")
          .style("top", event.pageY + 40 + "px");
      })
      .on("mouseout", function (event, d) {
        d3.select(this).style("strokeWidth", 2);
        d3.select("#arrow_outer_left" + String(d.id)).style(
          "display",
          function (d) {
            if (
              d.totalParents > 0 &&
              d.totalParents > nodes_hash.get(d.id).parents
            ) {
              return "block";
            } else {
              return "none";
            }
          }
        );
        d3.select("#arrow_outer_right" + String(d.id)).style(
          "display",
          function (d) {
            if (
              d.totalChildren > 0 &&
              d.totalChildren > nodes_hash.get(d.id).children
            ) {
              return "block";
            } else {
              return "none";
            }
          }
        );

        d3.select("#information" + String(d.id)).style("opacity", 0);
        div.style("opacity", 0).style("display", "none");
      })
      .on("click", function (event, d) {
        dispatch(selectedNode({ id: d.id, type: d.type, name: d.name }));
        setPipelineData({
          pipeline: pipelineData.pipeline,
          currentSelectedNode: { id: d.id, name: d.name },
          type: "selected",
          flow: pipelineData.flow,
          color: pipelineData.color,
          repo_color: pipelineData.repo_color,
          vis_color: pipelineData.vis_color,
          colorLegend: pipelineData.colorLegend,
          loading: pipelineData.loading,
          lastNode: pipelineData.lastNode,
        });
      })
      .on("contextmenu", function (event, d) {
        // dispatch(getBuildSpec(d.id, d.branch));
        div.style("opacity", 0).style("display", "none");

        event.preventDefault();
        PipelineContextMenus(
          event,
          {
            id: d.id,
            type: "dashboard",
            branch: d.branch,
          },
          dispatch,
          id,
          false
        );
        setcontextMenu({
          event: event,
          record: {
            id: d.id,
            type: "dashboard",
            branch: d.branch,
          },
          dispatch: dispatch,
          id: id,
          buildexist: false,
        });
      })
      .classed("bezier-node-dashboard", true);

    const arrow_outer_left_normal = node_normal_group
      .append("g")
      .attr("class", "arrow_outer_left")
      .attr("id", function (d) {
        return "arrow_outer_left" + String(d.id);
      })
      .attr("transform", "scale(0.05)")
      .on("click", function (event, d) {
        if (d.totalParents > nodes_hash.get(d.id).parents) {
          setPipelineData({
            pipeline: pipelineData.pipeline,
            currentSelectedNode: pipelineData.currentSelectedNode,
            type: "loading",
            flow: pipelineData.flow,
            color: pipelineData.color,
            repo_color: pipelineData.repo_color,
            vis_color: pipelineData.vis_color,
            colorLegend: pipelineData.colorLegend,
            loading: true,
            lastNode: pipelineData.lastNode,
          });
          getParent(d.id);
        } else {
          collapseParent(d.id);
        }
      })
      .on("mouseover", function (event, d) {
        // Create a small pop over
        // Only Display if it got parents
        if (d.totalParents > 0) {
          d3.select("#arrow_outer_left" + String(d.id)).style(
            "display",
            "block"
          );
        }

        family_info.style("opacity", 1).style("display", "block");
        if (d.totalParents > nodes_hash.get(d.id).parents) {
          family_info
            .html(
              d.totalParents -
                nodes_hash.get(d.id).parents +
                " more parent" +
                (d.totalParents - nodes_hash.get(d.id).parents > 1 ? "s" : "") +
                " to expand."
            )
            .style("left", event.pageX + "px")
            .style("top", event.pageY - 60 + "px");
        } else {
          family_info
            .html("Collapse the parents.")
            .style("left", event.pageX + "px")
            .style("top", event.pageY - 60 + "px");
        }
      })
      .on("mouseout", function (event, d) {
        // Remove pop over
        d3.select("#arrow_outer_left" + String(d.id)).style(
          "display",
          function () {
            if (
              d.totalParents > 0 &&
              d.totalParents > nodes_hash.get(d.id).parents
            ) {
              return "block";
            } else {
              return "none";
            }
          }
        );

        family_info.style("opacity", 0).style("display", "none");
      })
      .style("display", function (d) {
        if (d.type == "dataset" && d.branch != "master") {
          return "none";
        }
        if (
          d.totalParents > 0 &&
          d.totalParents > nodes_hash.get(d.id).parents
        ) {
          return "block";
        } else {
          return "none";
        }
      });

    arrow_outer_left_normal
      .append("path")
      .attr("d", function (d) {
        return BEZIER_ICONS.OUTER;
      })
      .attr("fill", "rgba(0,0,0,0)");

    arrow_outer_left_normal
      .append("path")
      .attr("d", function (d) {
        // If parents need to be expanded
        if (d.totalParents > nodes_hash.get(d.id).parents) {
          return BEZIER_ICONS.LEFT;
        }
        // If parents need to be collapsed on equality case
        else {
          return BEZIER_ICONS.RIGHT;
        }
      })
      .attr("fill", function (d) {
        return "grey";
      });

    const arrow_outer_left_source = node_source_group
      .append("g")
      .attr("class", "arrow_outer_left")
      .attr("id", function (d) {
        return "arrow_outer_left" + String(d.id);
      })
      .attr("transform", "scale(0.05)")
      .on("click", function (event, d) {
        if (d.totalParents > nodes_hash.get(d.id).parents) {
          setPipelineData({
            pipeline: pipelineData.pipeline,
            currentSelectedNode: pipelineData.currentSelectedNode,
            type: "loading",
            flow: pipelineData.flow,
            color: pipelineData.color,
            repo_color: pipelineData.repo_color,
            vis_color: pipelineData.vis_color,
            colorLegend: pipelineData.colorLegend,
            loading: true,
            lastNode: pipelineData.lastNode,
          });
          getParent(d.id);
        } else {
          collapseParent(d.id);
        }
      })
      .on("mouseover", function (event, d) {
        // Create a small pop over
        // Only Display if it got parents
        if (d.totalParents > 0) {
          d3.select("#arrow_outer_left" + String(d.id)).style(
            "display",
            "block"
          );
        }

        family_info.style("opacity", 1).style("display", "block");
        if (d.totalParents > nodes_hash.get(d.id).parents) {
          family_info
            .html(
              d.totalParents -
                nodes_hash.get(d.id).parents +
                " more parent" +
                (d.totalParents - nodes_hash.get(d.id).parents > 1 ? "s" : "") +
                " to expand."
            )
            .style("left", event.pageX + "px")
            .style("top", event.pageY - 60 + "px");
        } else {
          family_info
            .html("Collapse the parents.")
            .style("left", event.pageX + "px")
            .style("top", event.pageY - 60 + "px");
        }
      })
      .on("mouseout", function (event, d) {
        // Remove pop over
        d3.select("#arrow_outer_left" + String(d.id)).style(
          "display",
          function () {
            if (
              d.totalParents > 0 &&
              d.totalParents > nodes_hash.get(d.id).parents
            ) {
              return "block";
            } else {
              return "none";
            }
          }
        );

        family_info.style("opacity", 0).style("display", "none");
      })
      .style("display", function (d) {
        if (
          d.totalParents > 0 &&
          d.totalParents > nodes_hash.get(d.id).parents
        ) {
          return "block";
        } else {
          return "none";
        }
      });

    arrow_outer_left_source
      .append("path")
      .attr("d", function (d) {
        return BEZIER_ICONS.OUTER;
      })
      .attr("fill", "rgba(0,0,0,0)");

    arrow_outer_left_source
      .append("path")
      .attr("d", function (d) {
        // If parents need to be expanded
        if (d.totalParents > nodes_hash.get(d.id).parents) {
          return BEZIER_ICONS.LEFT;
        }
        // If parents need to be collapsed on equality case
        else {
          return BEZIER_ICONS.RIGHT;
        }
      })
      .attr("fill", function (d) {
        return "grey";
      });

    const arrow_outer_left_chart = node_chart_group
      .append("g")
      .attr("class", "arrow_outer_left")
      .attr("id", function (d) {
        return "arrow_outer_left" + String(d.id);
      })
      .attr("transform", "scale(0.05)")
      .on("click", function (event, d) {
        if (d.totalParents > nodes_hash.get(d.id).parents) {
          setPipelineData({
            pipeline: pipelineData.pipeline,
            currentSelectedNode: pipelineData.currentSelectedNode,
            type: "loading",
            flow: pipelineData.flow,
            color: pipelineData.color,
            repo_color: pipelineData.repo_color,
            vis_color: pipelineData.vis_color,
            colorLegend: pipelineData.colorLegend,
            loading: true,
            lastNode: pipelineData.lastNode,
          });
          getParent(d.id);
        } else {
          collapseParent(d.id);
        }
      })
      .on("mouseover", function (event, d) {
        // Create a small pop over
        // Only Display if it got parents
        if (d.totalParents > 0) {
          d3.select("#arrow_outer_left" + String(d.id)).style(
            "display",
            "block"
          );
        }

        family_info.style("opacity", 1).style("display", "block");
        if (d.totalParents > nodes_hash.get(d.id).parents) {
          family_info
            .html(
              d.totalParents -
                nodes_hash.get(d.id).parents +
                " more parent" +
                (d.totalParents - nodes_hash.get(d.id).parents > 1 ? "s" : "") +
                " to expand."
            )
            .style("left", event.pageX + "px")
            .style("top", event.pageY - 60 + "px");
        } else {
          family_info
            .html("Collapse the parents.")
            .style("left", event.pageX + "px")
            .style("top", event.pageY - 60 + "px");
        }
      })
      .on("mouseout", function (event, d) {
        // Remove pop over
        d3.select("#arrow_outer_left" + String(d.id)).style(
          "display",
          function () {
            if (
              d.totalParents > 0 &&
              d.totalParents > nodes_hash.get(d.id).parents
            ) {
              return "block";
            } else {
              return "none";
            }
          }
        );

        family_info.style("opacity", 0).style("display", "none");
      })
      .style("display", function (d) {
        if (
          d.totalParents > 0 &&
          d.totalParents > nodes_hash.get(d.id).parents
        ) {
          return "block";
        } else {
          return "none";
        }
      });

    arrow_outer_left_chart
      .append("path")
      .attr("d", function (d) {
        return BEZIER_ICONS.OUTER;
      })
      .attr("fill", "rgba(0,0,0,0)");

    arrow_outer_left_chart
      .append("path")
      .attr("d", function (d) {
        // If parents need to be expanded
        if (d.totalParents > nodes_hash.get(d.id).parents) {
          return BEZIER_ICONS.LEFT;
        }
        // If parents need to be collapsed on equality case
        else {
          return BEZIER_ICONS.RIGHT;
        }
      })
      .attr("fill", function (d) {
        return "#F9F9F9";
      });

    const arrow_outer_right_normal = node_normal_group
      .append("g")
      .attr("class", "arrow_outer_right")
      .attr("id", function (d) {
        return "arrow_outer_right" + String(d.id);
      })
      .attr("transform", "scale(0.05)")
      .on("click", function (event, d) {
        if (d.totalChildren > nodes_hash.get(d.id).children) {
          setPipelineData({
            pipeline: pipelineData.pipeline,
            currentSelectedNode: pipelineData.currentSelectedNode,
            type: "loading",
            flow: pipelineData.flow,
            color: pipelineData.color,
            repo_color: pipelineData.repo_color,
            vis_color: pipelineData.vis_color,
            colorLegend: pipelineData.colorLegend,
            loading: true,
            lastNode: pipelineData.lastNode,
          });
          getChildren(d.id);
        } else {
          collapseChildren(d.id);
        }
      })
      .on("mouseover", function (event, d) {
        // Add small pop over
        // Only Display if it got children
        if (d.totalChildren > 0) {
          d3.select("#arrow_outer_right" + String(d.id)).style(
            "display",
            "block"
          );
        }

        family_info.style("opacity", 1).style("display", "block");
        if (d.totalChildren > nodes_hash.get(d.id).children) {
          family_info
            .html(
              d.totalChildren -
                nodes_hash.get(d.id).children +
                " more " +
                (d.totalChildren - nodes_hash.get(d.id).children > 1
                  ? " children"
                  : " child") +
                " to expand."
            )
            .style("left", event.pageX + "px")
            .style("top", event.pageY - 60 + "px");
        } else {
          family_info
            .html("Collapse the children.")
            .style("left", event.pageX + "px")
            .style("top", event.pageY - 60 + "px");
        }
      })
      .on("mouseout", function (event, d) {
        // Remove small pop over
        d3.select("#arrow_outer_right" + String(d.id)).style(
          "display",
          function (event, d) {
            if (d.type == "dataset" && d.branch != "master") {
              return "none";
            }
            if (
              d.totalChildren > 0 &&
              d.totalChildren > nodes_hash.get(d.id).children
            ) {
              return "block";
            } else {
              return "none";
            }
          }
        );

        family_info.style("opacity", 0).style("display", "none");
      })
      .style("display", function (d) {
        if (
          d.totalChildren > 0 &&
          d.totalChildren > nodes_hash.get(d.id).children
        ) {
          return "block";
        } else {
          return "none";
        }
      });

    arrow_outer_right_normal
      .append("path")
      .attr("d", function (d) {
        return BEZIER_ICONS.OUTER;
      })
      .attr("fill", "rgba(0,0,0,0)");

    arrow_outer_right_normal
      .append("path")
      .attr("d", function (d) {
        // If Children need to be expanded
        if (d.totalChildren > nodes_hash.get(d.id).children) {
          return BEZIER_ICONS.RIGHT;
        }
        // If children need to be collapsed on equality case
        else {
          return BEZIER_ICONS.LEFT;
        }
      })
      .attr("fill", function (d) {
        return "grey";
      });

    const arrow_outer_left_dashboard = node_dashboard_group
      .append("g")
      .attr("class", "arrow_outer_left")
      .attr("id", function (d) {
        return "arrow_outer_left" + String(d.id);
      })
      .attr("transform", "scale(0.05)")
      .on("click", function (event, d) {
        if (d.totalParents > nodes_hash.get(d.id).parents) {
          setPipelineData({
            pipeline: pipelineData.pipeline,
            currentSelectedNode: pipelineData.currentSelectedNode,
            type: "loading",
            flow: pipelineData.flow,
            color: pipelineData.color,
            repo_color: pipelineData.repo_color,
            vis_color: pipelineData.vis_color,
            colorLegend: pipelineData.colorLegend,
            loading: true,
            lastNode: pipelineData.lastNode,
          });
          getParent(d.id);
        } else {
          collapseParent(d.id);
        }
      })
      .on("mouseover", function (event, d) {
        // Create a small pop over
        // Only Display if it got parents
        if (d.totalParents > 0) {
          d3.select("#arrow_outer_left" + String(d.id)).style(
            "display",
            "block"
          );
        }

        family_info.style("opacity", 1).style("display", "block");
        if (d.totalParents > nodes_hash.get(d.id).parents) {
          family_info
            .html(
              d.totalParents -
                nodes_hash.get(d.id).parents +
                " more parent" +
                (d.totalParents - nodes_hash.get(d.id).parents > 1 ? "s" : "") +
                " to expand."
            )
            .style("left", event.pageX + "px")
            .style("top", event.pageY - 60 + "px");
        } else {
          family_info
            .html("Collapse the parents.")
            .style("left", event.pageX + "px")
            .style("top", event.pageY - 60 + "px");
        }
      })
      .on("mouseout", function (event, d) {
        // Remove pop over
        d3.select("#arrow_outer_left" + String(d.id)).style(
          "display",
          function () {
            if (
              d.totalParents > 0 &&
              d.totalParents > nodes_hash.get(d.id).parents
            ) {
              return "block";
            } else {
              return "none";
            }
          }
        );

        family_info.style("opacity", 0).style("display", "none");
      })
      .style("display", function (d) {
        if (
          d.totalParents > 0 &&
          d.totalParents > nodes_hash.get(d.id).parents
        ) {
          return "block";
        } else {
          return "none";
        }
      });

    arrow_outer_left_dashboard
      .append("path")
      .attr("d", function (d) {
        return BEZIER_ICONS.OUTER;
      })
      .attr("fill", "rgba(0,0,0,0)");

    arrow_outer_left_dashboard
      .append("path")
      .attr("d", function (d) {
        // If parents need to be expanded
        if (d.totalParents > nodes_hash.get(d.id).parents) {
          return BEZIER_ICONS.LEFT;
        }
        // If parents need to be collapsed on equality case
        else {
          return BEZIER_ICONS.RIGHT;
        }
      })
      .attr("fill", function (d) {
        return "#F9F9F9";
      });

    const arrow_outer_right_source = node_source_group
      .append("g")
      .attr("class", "arrow_outer_right")
      .attr("id", function (d) {
        return "arrow_outer_right" + String(d.id);
      })
      .attr("transform", "scale(0.05)")
      .on("click", function (event, d) {
        if (d.totalChildren > nodes_hash.get(d.id).children) {
          setPipelineData({
            pipeline: pipelineData.pipeline,
            currentSelectedNode: pipelineData.currentSelectedNode,
            type: "loading",
            flow: pipelineData.flow,
            color: pipelineData.color,
            repo_color: pipelineData.repo_color,
            vis_color: pipelineData.vis_color,
            colorLegend: pipelineData.colorLegend,
            loading: true,
            lastNode: pipelineData.lastNode,
          });
          getChildren(d.id);
        } else {
          collapseChildren(d.id);
        }
      })
      .on("mouseover", function (event, d) {
        // Add small pop over
        // Only Display if it got children
        if (d.totalChildren > 0) {
          d3.select("#arrow_outer_right" + String(d.id)).style(
            "display",
            "block"
          );
        }

        family_info.style("opacity", 1).style("display", "block");
        if (d.totalChildren > nodes_hash.get(d.id).children) {
          family_info
            .html(
              d.totalChildren -
                nodes_hash.get(d.id).children +
                " more " +
                (d.totalChildren - nodes_hash.get(d.id).children > 1
                  ? " children"
                  : " child") +
                " to expand."
            )
            .style("left", event.pageX + "px")
            .style("top", event.pageY - 60 + "px");
        } else {
          family_info
            .html("Collapse the children.")
            .style("left", event.pageX + "px")
            .style("top", event.pageY - 60 + "px");
        }
      })
      .on("mouseout", function (event, d) {
        // Remove small pop over
        d3.select("#arrow_outer_right" + String(d.id)).style(
          "display",
          function (event, d) {
            if (
              d.totalChildren > 0 &&
              d.totalChildren > nodes_hash.get(d.id).children
            ) {
              return "block";
            } else {
              return "none";
            }
          }
        );

        family_info.style("opacity", 0).style("display", "none");
      })
      .style("display", function (d) {
        if (
          d.totalChildren > 0 &&
          d.totalChildren > nodes_hash.get(d.id).children
        ) {
          return "block";
        } else {
          return "none";
        }
      });

    arrow_outer_right_source
      .append("path")
      .attr("d", function (d) {
        return BEZIER_ICONS.OUTER;
      })
      .attr("fill", "rgba(0,0,0,0)");

    arrow_outer_right_source
      .append("path")
      .attr("d", function (d) {
        // If Children need to be expanded
        if (d.totalChildren > nodes_hash.get(d.id).children) {
          return BEZIER_ICONS.RIGHT;
        }
        // If children need to be collapsed on equality case
        else {
          return BEZIER_ICONS.LEFT;
        }
      })
      .attr("fill", function (d) {
        return "grey";
      });

    const arrow_outer_right_chart = node_chart_group
      .append("g")
      .attr("class", "arrow_outer_right")
      .attr("id", function (d) {
        return "arrow_outer_right" + String(d.id);
      })
      .attr("transform", "scale(0.05)")
      .on("click", function (event, d) {
        if (d.totalChildren > nodes_hash.get(d.id).children) {
          setPipelineData({
            pipeline: pipelineData.pipeline,
            currentSelectedNode: pipelineData.currentSelectedNode,
            type: "loading",
            flow: pipelineData.flow,
            color: pipelineData.color,
            repo_color: pipelineData.repo_color,
            vis_color: pipelineData.vis_color,
            colorLegend: pipelineData.colorLegend,
            loading: true,
            lastNode: pipelineData.lastNode,
          });
          getChildren(d.id);
        } else {
          collapseChildren(d.id);
        }
      })
      .on("mouseover", function (event, d) {
        // Add small pop over
        // Only Display if it got children
        if (d.totalChildren > 0) {
          d3.select("#arrow_outer_right" + String(d.id)).style(
            "display",
            "block"
          );
        }

        family_info.style("opacity", 1).style("display", "block");
        if (d.totalChildren > nodes_hash.get(d.id).children) {
          family_info
            .html(
              d.totalChildren -
                nodes_hash.get(d.id).children +
                " more " +
                (d.totalChildren - nodes_hash.get(d.id).children > 1
                  ? " children"
                  : " child") +
                " to expand."
            )
            .style("left", event.pageX + "px")
            .style("top", event.pageY - 60 + "px");
        } else {
          family_info
            .html("Collapse the children.")
            .style("left", event.pageX + "px")
            .style("top", event.pageY - 60 + "px");
        }
      })
      .on("mouseout", function (event, d) {
        // Remove small pop over
        d3.select("#arrow_outer_right" + String(d.id)).style(
          "display",
          function (event, d) {
            if (
              d.totalChildren > 0 &&
              d.totalChildren > nodes_hash.get(d.id).children
            ) {
              return "block";
            } else {
              return "none";
            }
          }
        );

        family_info.style("opacity", 0).style("display", "none");
      })
      .style("display", function (d) {
        if (
          d.totalChildren > 0 &&
          d.totalChildren > nodes_hash.get(d.id).children
        ) {
          return "block";
        } else {
          return "none";
        }
      });

    arrow_outer_right_chart
      .append("path")
      .attr("d", function (d) {
        return BEZIER_ICONS.OUTER;
      })
      .attr("fill", "rgba(0,0,0,0)");

    arrow_outer_right_chart
      .append("path")
      .attr("d", function (d) {
        // If Children need to be expanded
        if (d.totalChildren > nodes_hash.get(d.id).children) {
          return BEZIER_ICONS.RIGHT;
        }
        // If children need to be collapsed on equality case
        else {
          return BEZIER_ICONS.LEFT;
        }
      })
      .attr("fill", function (d) {
        return "#F9F9F9";
      });

    const arrow_outer_right_dashboard = node_dashboard_group
      .append("g")
      .attr("class", "arrow_outer_right")
      .attr("id", function (d) {
        return "arrow_outer_right" + String(d.id);
      })
      .attr("transform", "scale(0.05)")
      .on("click", function (event, d) {
        if (d.totalChildren > nodes_hash.get(d.id).children) {
          setPipelineData({
            pipeline: pipelineData.pipeline,
            currentSelectedNode: pipelineData.currentSelectedNode,
            type: "loading",
            flow: pipelineData.flow,
            color: pipelineData.color,
            repo_color: pipelineData.repo_color,
            vis_color: pipelineData.vis_color,
            colorLegend: pipelineData.colorLegend,
            loading: true,
            lastNode: pipelineData.lastNode,
          });
          getChildren(d.id);
        } else {
          collapseChildren(d.id);
        }
      })
      .on("mouseover", function (event, d) {
        // Add small pop over
        // Only Display if it got children
        if (d.totalChildren > 0) {
          d3.select("#arrow_outer_right" + String(d.id)).style(
            "display",
            "block"
          );
        }

        family_info.style("opacity", 1).style("display", "block");
        if (d.totalChildren > nodes_hash.get(d.id).children) {
          family_info
            .html(
              d.totalChildren -
                nodes_hash.get(d.id).children +
                " more " +
                (d.totalChildren - nodes_hash.get(d.id).children > 1
                  ? " children"
                  : " child") +
                " to expand."
            )
            .style("left", event.pageX + "px")
            .style("top", event.pageY - 60 + "px");
        } else {
          family_info
            .html("Collapse the children.")
            .style("left", event.pageX + "px")
            .style("top", event.pageY - 60 + "px");
        }
      })
      .on("mouseout", function (event, d) {
        // Remove small pop over
        d3.select("#arrow_outer_right" + String(d.id)).style(
          "display",
          function (event, d) {
            if (
              d.totalChildren > 0 &&
              d.totalChildren > nodes_hash.get(d.id).children
            ) {
              return "block";
            } else {
              return "none";
            }
          }
        );

        family_info.style("opacity", 0).style("display", "none");
      })
      .style("display", function (d) {
        if (
          d.totalChildren > 0 &&
          d.totalChildren > nodes_hash.get(d.id).children
        ) {
          return "block";
        } else {
          return "none";
        }
      });

    arrow_outer_right_dashboard
      .append("path")
      .attr("d", function (d) {
        return BEZIER_ICONS.OUTER;
      })
      .attr("fill", "rgba(0,0,0,0)");

    arrow_outer_right_dashboard
      .append("path")
      .attr("d", function (d) {
        // If Children need to be expanded
        if (d.totalChildren > nodes_hash.get(d.id).children) {
          return BEZIER_ICONS.RIGHT;
        }
        // If children need to be collapsed on equality case
        else {
          return BEZIER_ICONS.LEFT;
        }
      })
      .attr("fill", function (d) {
        return "#F9F9F9";
      });

    const icon_source_folder = node_source_group
      .append("g")
      .filter((d) => d.type == "source" && d.subType == "folder")
      .attr("class", "icon_source_folder")
      .attr("id", function (d) {
        return "icon_source_folder" + String(d.id);
      })
      .attr("transform", "scale(0.05)");

    icon_source_folder
      .append("path")
      .attr("d", function (d) {
        return BEZIER_ICONS.FOLDER_ICON;
      })
      .attr("fill", "#717a94");

    const icon_dataset_connect = node_normal_group
      .append("g")
      .filter((d) => d.type == "dataset" && d.subType == "connect")
      .attr("class", "icon_dataset_connect")
      .attr("id", function (d) {
        return "icon_dataset_connect" + String(d.id);
      })
      .attr("transform", "scale(0.05)");

    icon_dataset_connect
      .append("path")
      .attr("d", function (d) {
        return BEZIER_ICONS.DATASET_ICON;
      })
      .attr("fill", "#ffcf00");

    const icon_dataset_raw = node_normal_group
      .append("g")
      .filter((d) => d.type == "dataset" && d.subType == "uploaded")
      .attr("class", "icon_dataset_raw")
      .attr("id", function (d) {
        return "icon_dataset_raw" + String(d.id);
      })
      .attr("transform", "scale(0.05)");

    icon_dataset_raw
      .append("path")
      .attr("d", function (d) {
        return BEZIER_ICONS.DATASET_ICON;
      })
      .attr("fill", "#717a94");

    const icon_dataset_parquet = node_normal_group
      .append("g")
      .filter(
        (d) =>
          d.type == "dataset" && (d.subType == "PYTHON" || d.subType == "SQL")
      )
      .attr("class", "icon_dataset_parquet")
      .attr("id", function (d) {
        return "icon_dataset_parquet" + String(d.id);
      })
      .attr("transform", "scale(0.05)");

    icon_dataset_parquet
      .append("path")
      .attr("d", function (d) {
        return BEZIER_ICONS.DATASET_ICON;
      })
      .attr("fill", "#4C90F0");

    const icon_source_postgres = node_source_group
      .append("g")
      .filter(
        (d) =>
          d.type == "source" && d.subType == ResourceTypeEnum.POSTGRESSOURCE
      )
      .attr("class", "icon_source_postgres")
      .attr("id", function (d) {
        return "icon_source_postgres" + String(d.id);
      })
      .attr("transform", "scale(0.05)");

    icon_source_postgres
      .append("circle")
      .attr("cx", 256)
      .attr("cy", 256)
      .attr("r", 256)
      .attr("fill", "#336791");

    const icon_source_postgres_g = icon_source_postgres.append("g");

    icon_source_postgres_g
      .append("path")
      .attr("d", function (d) {
        return BEZIER_ICONS.POSTGRES_FIRST;
      })
      .attr("fill", "white");

    icon_source_postgres_g
      .append("path")
      .attr("d", function (d) {
        return BEZIER_ICONS.POSTGRES_SECOND;
      })
      .attr("fill", "white");

    icon_source_postgres_g
      .append("path")
      .attr("d", function (d) {
        return BEZIER_ICONS.POSTGRES_THIRD;
      })
      .attr("fill", "white");

    const chart_icon = node_chart_group
      .append("g")
      .attr("class", "chart_icon")
      .attr("id", function (d) {
        return "chart_icon" + String(d.id);
      })
      .attr("transform", "scale(0.05)");

    chart_icon
      .append("path")
      .attr("d", function (d) {
        if (d.subType == "barChart") return BEZIER_ICONS.BAR_CHART_ICON_FIRST;
        else if (d.subType == "lineAreaChart")
          return BEZIER_ICONS.areaChartIcon_first;
        else if (d.subType == "bigNumber")
          return BEZIER_ICONS.bigNumberIcon_first;
        else if (d.subType == "lineChart") return BEZIER_ICONS.lineChartIcon;
        else if (d.subType == "pieChart") return BEZIER_ICONS.PIE_CHART_ICON;
        else if (d.subType == "scatterChart")
          return BEZIER_ICONS.scatterChartIcon_1;
        else if (d.subType == "VerticalAxisChart")
          return BEZIER_ICONS.VerticalAxisChartIcon;
        else if (d.subType == "table") return BEZIER_ICONS.tableCellIcon;
        else if (d.subType == "mapChart") return BEZIER_ICONS.mapChartIcon;
        else if (d.subType == "horizontalBarChart")
          return BEZIER_ICONS.horizontalBarChartIcon_1;
        else if (d.subType == "radarChart")
          return BEZIER_ICONS.radarChartIcon_1;
        else if (d.subType == "gaugeChart")
          return BEZIER_ICONS.gaugeChartIcon_1;
        else if (d.subType == "sunBurstChart")
          return BEZIER_ICONS.sunBurstChartIcon_1;
        else if (d.subType == "waterFallChart")
          return BEZIER_ICONS.WATERFALL_CHART_ICON_1;
        else if (d.subType == KEPLER_CHARTS.PARAMETER_CHART)
          return BEZIER_ICONS.PAREMETER_CHART_ICON_1;
        else if (d.subType == KEPLER_CHARTS.WORDCLOUD_CHART)
          return BEZIER_ICONS.WORDCLOUD_CHART_ICON_1;
        else if (d.subType == KEPLER_CHARTS.TREEMAP_CHART)
          return BEZIER_ICONS.TREEMAP_CHART_ICON_1;
        return BEZIER_ICONS.BAR_CHART_ICON_FIRST;
        r;
      })
      .attr("fill", "#717a94")
      .attr("transform", function (d) {
        if (
          d.subType == "radarChart" ||
          d.subType == "gaugeChart" ||
          d.subType == "sunBurstChart"
        )
          return "scale(0.15)";
        else if (
          d.subType == "waterFallChart" ||
          d.subType == KEPLER_CHARTS.TREEMAP_CHART ||
          d.subType == KEPLER_CHARTS.WORDCLOUD_CHART
        )
          return "scale(0.5)";
        return "";
      });

    chart_icon
      .append("path")
      .attr("d", function (d) {
        if (d.subType == "barChart") return BEZIER_ICONS.BAR_CHART_ICON_SECOND;
        else if (d.subType == "lineAreaChart")
          return BEZIER_ICONS.areaChartIcon_second;
        else if (d.subType == "bigNumber")
          return BEZIER_ICONS.bigNumberIcon_second;
        else if (d.subType == "lineChart") return "";
        else if (d.subType == "pieChart") return "";
        else if (d.subType == "scatterChart")
          return BEZIER_ICONS.scatterChartIcon_2;
        else if (d.subType == "VerticalAxisChart") return "";
        else if (d.subType == "mapChart") return "";
        else if (d.subType == "table") return "";
        else if (d.subType == "horizontalBarChart")
          return BEZIER_ICONS.horizontalBarChartIcon_2;
        else if (d.subType == "radarChart") return "";
        else if (d.subType == "gaugeChart") return "";
        else if (d.subType == "sunBurstChart")
          return BEZIER_ICONS.sunBurstChartIcon_2;
        else if (d.subType == "waterFallChart") return "";
        else if (
          d.subType == KEPLER_CHARTS.PARAMETER_CHART ||
          d.subType == KEPLER_CHARTS.WORDCLOUD_CHART ||
          d.subType == KEPLER_CHARTS.TREEMAP_CHART
        )
          return "";

        return BEZIER_ICONS.BAR_CHART_ICON_SECOND;
      })
      .attr("fill", "#717a94")
      .attr("transform", function (d) {
        if (
          d.subType == "radarChart" ||
          d.subType == "gaugeChart" ||
          d.subType == "sunBurstChart"
        )
          return "scale(0.15)";
        return "";
      });

    chart_icon
      .append("path")
      .attr("d", function (d) {
        if (d.subType == "barChart") return BEZIER_ICONS.BAR_CHART_ICON_THIRD;
        else if (d.subType == "lineAreaChart")
          return BEZIER_ICONS.areaChartIcon_third;
        else if (d.subType == "bigNumber") return "";
        else if (d.subType == "lineChart") return "";
        else if (d.subType == "pieChart") return "";
        else if (d.subType == "scatterChart")
          return BEZIER_ICONS.scatterChartIcon_3;
        else if (d.subType == "VerticalAxisChart") return "";
        else if (d.subType == "mapChart") return "";
        else if (d.subType == "table") return "";
        else if (d.subType == "horizontalBarChart")
          return BEZIER_ICONS.horizontalBarChartIcon_3;
        else if (d.subType == "radarChart") return "";
        else if (d.subType == "gaugeChart") return "";
        else if (d.subType == "sunBurstChart") return "";
        else if (d.subType == "waterFallChart") return "";
        else if (
          d.subType == KEPLER_CHARTS.PARAMETER_CHART ||
          d.subType == KEPLER_CHARTS.WORDCLOUD_CHART ||
          d.subType == KEPLER_CHARTS.TREEMAP_CHART
        )
          return "";
        return BEZIER_ICONS.BAR_CHART_ICON_THIRD;
      })
      .attr("fill", "#717a94");

    chart_icon
      .append("path")
      .attr("d", function (d) {
        if (d.subType == "barChart") return BEZIER_ICONS.BAR_CHART_ICON_FOURTH;
        else if (d.subType == "lineAreaChart") return "";
        else if (d.subType == "bigNumber") return "";
        else if (d.subType == "lineChart") return "";
        else if (d.subType == "pieChart") return "";
        else if (d.subType == "scatterChart")
          return BEZIER_ICONS.scatterChartIcon_4;
        else if (d.subType == "VerticalAxisChart") return "";
        else if (d.subType == "mapChart") return "";
        else if (d.subType == "table") return "";
        else if (d.subType == "horizontalBarChart")
          return BEZIER_ICONS.horizontalBarChartIcon_4;
        else if (d.subType == "radarChart") return "";
        else if (d.subType == "gaugeChart") return "";
        else if (d.subType == "sunBurstChart") return "";
        else if (d.subType == "waterFallChart") return "";
        else if (
          d.subType == KEPLER_CHARTS.PARAMETER_CHART ||
          d.subType == KEPLER_CHARTS.WORDCLOUD_CHART ||
          d.subType == KEPLER_CHARTS.TREEMAP_CHART
        )
          return "";
        return BEZIER_ICONS.BAR_CHART_ICON_FOURTH;
      })
      .attr("fill", "#717a94");

    chart_icon
      .append("path")
      .attr("d", function (d) {
        if (d.subType == "barChart") return BEZIER_ICONS.BAR_CHART_ICON_FIFTH;
        else if (d.subType == "lineAreaChart") return "";
        else if (d.subType == "bigNumber") return "";
        else if (d.subType == "lineChart") return "";
        else if (d.subType == "pieChart") return "";
        else if (d.subType == "scatterChart")
          return BEZIER_ICONS.scatterChartIcon_5;
        else if (d.subType == "VerticalAxisChart") return "";
        else if (d.subType == "mapChart") return "";
        else if (d.subType == "table") return "";
        else if (d.subType == "horizontalBarChart")
          return BEZIER_ICONS.horizontalBarChartIcon_5;
        else if (d.subType == "radarChart") return "";
        else if (d.subType == "gaugeChart") return "";
        else if (d.subType == "sunBurstChart") return "";
        else if (d.subType == "waterFallChart") return "";
        else if (
          d.subType == KEPLER_CHARTS.PARAMETER_CHART ||
          d.subType == KEPLER_CHARTS.WORDCLOUD_CHART ||
          d.subType == KEPLER_CHARTS.TREEMAP_CHART
        )
          return "";
        return BEZIER_ICONS.BAR_CHART_ICON_FIFTH;
      })
      .attr("fill", "#717a94");

    for (let i = 6; i <= 14; i++)
      chart_icon
        .append("path")
        .attr("d", function (d) {
          if (d.subType == "scatterChart")
            return BEZIER_ICONS[`scatterChartIcon_${i}`];
          else return "";
        })
        .attr("fill", "#717a94");

    const dashboard_icon = node_dashboard_group
      .append("g")
      .attr("class", "dashboard_icon")
      .attr("id", function (d) {
        return "dashboard_icon" + String(d.id);
      })
      .attr("transform", "scale(0.5)");

    dashboard_icon
      .append("path")
      .attr("d", function (d) {
        return BEZIER_ICONS.dashboard_icon_poly_first;
      })
      .attr("fill", "#717a94");

    dashboard_icon
      .append("path")
      .attr("d", function (d) {
        return BEZIER_ICONS.dashboard_icon_poly_second;
      })
      .attr("fill", "#717a94");

    dashboard_icon
      .append("path")
      .attr("d", function (d) {
        return BEZIER_ICONS.dashboard_icon_poly_third;
      })
      .attr("fill", "#717a94");

    const sync_icon = node_normal_group
      .append("g")
      .filter((d) => d.syncStatus && d.syncStatus == "true")
      .attr("class", "sync_icon")
      // .classed("star", true)
      .attr("id", function (d) {
        return "sync_icon" + String(d.id);
      })
      .on("mouseover", function (event, d) {
        family_info.style("opacity", 1).style("display", "block");

        family_info
          .html("Dataset Synced")
          .style("left", event.pageX + "px")
          .style("top", event.pageY - 60 + "px");
      })
      .on("mouseout", function (event, d) {
        family_info.style("opacity", 0).style("display", "none");
      });

    sync_icon
      .append("circle")
      .attr("cx", 256)
      .attr("cy", 256)
      .attr("r", 256)
      .attr("stroke", "#717A94")
      .attr("strokeWidth", "12")
      .attr("fill", "#EFEDED");

    sync_icon
      .append("path")
      .attr("d", function (d) {
        return BEZIER_ICONS.sync_icon;
      })
      .attr("fill", "#717A94");

    const git_icon = node_normal_group
      .append("g")
      .filter((d) => d.branches && d.branches.length > 1)
      .attr("class", "git_icon")
      // .classed("star", true)
      .attr("id", function (d) {
        return "git_icon" + String(d.id);
      })
      .on("click", function (event, d) {
        // if (d.totalParents > nodes_hash.get(d.id).parents) {
        setPipelineData({
          pipeline: pipelineData.pipeline,
          currentSelectedNode: pipelineData.currentSelectedNode,
          type: "loading",
          flow: pipelineData.flow,
          color: pipelineData.color,
          repo_color: pipelineData.repo_color,
          vis_color: pipelineData.vis_color,
          colorLegend: pipelineData.colorLegend,
          loading: true,
          lastNode: pipelineData.lastNode,
        });
        if (d.branchesShown) {
          hideOtherBranches(d);
        } else {
          showOtherBranches(d);
        }
        //   getParent(d.id);
        // } else {
        //   collapseParent(d.id);
        // }
      })
      .on("mouseover", function (event, d) {
        family_info.style("opacity", 1).style("display", "block");

        family_info
          .html(
            d.branchesShown
              ? `Hide ${d.branches.length - 1} non master branches`
              : `Show ${d.branches.length - 1} non master branches`
          )
          .style("left", event.pageX + "px")
          .style("top", event.pageY - 60 + "px");
      })
      .on("mouseout", function (event, d) {
        family_info.style("opacity", 0).style("display", "none");
      });

    git_icon
      .append("circle")
      .attr("cx", 18)
      .attr("cy", 18)
      .attr("r", 16)
      .attr("stroke", "#717A94")
      .attr("fill", "#EFEDED");

    git_icon
      .append("path")
      .attr("d", function (d) {
        if (d.branchesShown) {
          return BEZIER_ICONS.git_icon_hide;
        } else {
          return BEZIER_ICONS.git_icon_show;
        }
      })
      .attr("fill", "#717A94");

    git_icon
      .append("g")
      .attr("filter", "url(#filter0_d_255_32907)")
      .append("path")
      .attr("d", function (d) {
        if (d.branchesShown) {
          return "M7.5 27.5L27 7";
        } else {
          return "";
        }
      })
      .attr("stroke", "#717A94")
      .attr("strokeWidth", "2")
      .attr("stroke-linecap", "round");

    const branch_dataset_icon = node_normal_group
      .append("g")
      .filter((d) => d.branch && d.branch != "master")
      .attr("class", "branch_dataset_icon")
      .attr("id", function (d) {
        return "branch_dataset_icon" + String(d.id);
      });

    branch_dataset_icon
      .append("path")
      .attr("d", function (d) {
        return BEZIER_ICONS.git_icon_hide;
      })
      .attr("fill", "#3063aa");
    // .attr("fill", "#091b2bc7");

    const link = g_ref
      .selectAll("path.bezier-link")
      .data(links, (d) => d.source.id + d.target.id)
      .join("path")
      .attr("class", "bezier-link")
      .attr("id", (d, i) => `link${i}`)
      .style("filter", "url(#drop-shadow)")
      .attr("stroke", function (d) {
        if (
          pipelineData.currentSelectedNode.id === d.source.id ||
          pipelineData.currentSelectedNode.id === d.target.id
        ) {
          return "#FFBF00";
        } else {
          return "var(--movetodata-font-color-muted)";
        }
      })
      .attr("stroke-linecap", "round")
      .attr("fill", "none")
      .attr("marker-end", function (d) {
        if (
          pipelineData.currentSelectedNode.id === d.source.id ||
          pipelineData.currentSelectedNode.id === d.target.id
        ) {
          d3.select(this).raise();
          return "url(#arrowheadSelected)";
        } else {
          d3.select(this).lower();
          return "url(#arrowhead)";
        }
      })
      .style("strokeWidth", 2.3)
      .classed("bezier-link", true)
      .on("mouseover", function (event, d) {
        d3.select(this).style("strokeWidth", 3.5).style("cursor", "grab");
      })
      .on("mouseout", function (event, d) {
        d3.select(this).style("strokeWidth", 2.3);
      });

    function animLink(d) {
      d3.select(this)
        .transition()
        .delay(0)
        .duration(20000)
        .ease(d3.easeLinear)
        .attrTween("stroke-dashoffset", function () {
          var i = d3.interpolateString("1000", "0");
          return function (t) {
            return i(t);
          };
        })
        .on("end", animLink);
    }

    link
      .style("stroke-dasharray", function () {
        return pipelineData.flow == true ? 10 + " " + 10 : undefined;
      })
      .transition()
      .on("start", pipelineData.flow == true ? animLink : undefined);

    /*
            Compulsary to raise the labels as
            the nodes above use the text width to get its 
            own width
            Therefore label got assigned before it. 
            And then label comes below node.
            Hence raised it again.
            
        */
    nodes.map((node) => {
      d3.select(`#label${node.id}`).raise();
    });
    nodes.map((node) => {
      d3.select(`#arrow_outer_left${node.id}`).raise();
      d3.select(`#arrow_outer_right${node.id}`).raise();

      if (node.type == "source") {
        if (node.subType == ResourceTypeEnum.FOLDER)
          d3.select(`#icon_source_folder${node.id}`).raise();

        if (node.subType == ResourceTypeEnum.POSTGRESSOURCE)
          d3.select(`#icon_source_postgres${node.id}`).raise();
      }

      if (node.type == "dataset") {
        if (node.subType == "connect")
          d3.select(`#icon_dataset_connect${node.id}`).raise();
        if (node.subType == "uploaded")
          d3.select(`#icon_dataset_raw${node.id}`).raise();
        if (node.subType == "PYTHON" || node.subType == "SQL")
          d3.select(`#icon_dataset_parquet${node.id}`).raise();
        if (node.branches && node.branches.length >= 1) {
          d3.select(`#git_icon${node.id}`).raise();
        }
        if (node.branch && node.branch != "master") {
          d3.select(`#branch_dataset_icon${node.id}`).raise();
        }
      }
      if (node.type == "chart") {
        d3.select(`#chart_icon${node.id}`).raise();
      }
      if (node.type == "dashboard") {
        d3.select(`#dashboard_icon${node.id}`).raise();
      }
      if (node.syncStatus) {
        d3.select(`#sync_icon${node.id}`).raise();
      }
    });

    const simulation = d3
      .forceSimulation()
      .nodes(nodes)
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("link", d3.forceLink(links))
      .on("tick", ticked);

    function ticked() {
      node_normal.attr("transform", function (d) {
        return "translate(" + -60 + "," + -30 + ")";
      });

      node_normal.attr("x", (d) => d.x).attr("y", (d) => d.y);

      node_source.attr("transform", function (d) {
        return "translate(" + -60 + "," + -30 + ")";
      });

      node_source.attr("x", (d) => d.x).attr("y", (d) => d.y);

      node_chart.attr("transform", function (d) {
        return "translate(" + -54 + "," + -30 + ")";
      });

      node_chart.attr("x", (d) => d.x).attr("y", (d) => d.y);

      link.attr("d", (d) => curved_lines(d));

      texts_chart.attr("transform", function (d) {
        return "translate(" + (d.x + 25) + "," + (d.y + 7) + ")";
      });

      node_dashboard.attr("transform", function (d) {
        return "translate(" + -54 + "," + -30 + ")";
      });

      node_dashboard.attr("x", (d) => d.x).attr("y", (d) => d.y);

      texts_dashboard.attr("transform", function (d) {
        return "translate(" + (d.x + 25) + "," + (d.y + 7) + ")";
      });

      texts_normal.attr("transform", function (d) {
        return "translate(" + d.x + "," + (d.y + 7) + ")";
      });

      texts_source.attr("transform", function (d) {
        return "translate(" + (d.x + 25) + "," + (d.y + 7) + ")";
      });

      icon_source_folder.attr("transform", function (d) {
        let width = 50;
        if (d3.select("#label" + String(d.id)).size() !== 0) {
          width = d3
            .select("#label" + String(d.id))
            .node()
            .getBBox().width;
        }

        return "translate(" + (d.x - 13) + "," + (d.y - 12) + ") scale(1.5)";
      });

      icon_dataset_connect.attr("transform", function (d) {
        let width = 50;
        if (d3.select("#label" + String(d.id)).size() !== 0) {
          width = d3
            .select("#label" + String(d.id))
            .node()
            .getBBox().width;
        }

        return "translate(" + (d.x - 27) + "," + (d.y - 10) + ") scale(1.2)";
      });

      icon_dataset_parquet.attr("transform", function (d) {
        let width = 50;
        if (d3.select("#label" + String(d.id)).size() !== 0) {
          width = d3
            .select("#label" + String(d.id))
            .node()
            .getBBox().width;
        }

        return "translate(" + (d.x - 27) + "," + (d.y - 10) + ") scale(1.2)";
      });

      icon_dataset_raw.attr("transform", function (d) {
        let width = 50;
        if (d3.select("#label" + String(d.id)).size() !== 0) {
          width = d3
            .select("#label" + String(d.id))
            .node()
            .getBBox().width;
        }

        return "translate(" + (d.x - 27) + "," + (d.y - 10) + ") scale(1.2)";
      });

      icon_source_postgres.attr("transform", function (d) {
        let width = 50;
        if (d3.select("#label" + String(d.id)).size() !== 0) {
          width = d3
            .select("#label" + String(d.id))
            .node()
            .getBBox().width;
        }

        return "translate(" + (d.x - 10) + "," + (d.y - 12) + ") scale(0.05)";
      });

      chart_icon.attr("transform", function (d) {
        let width = 50;
        if (d3.select("#label" + String(d.id)).size() !== 0) {
          width = d3
            .select("#label" + String(d.id))
            .node()
            .getBBox().width;
        }

        return "translate(" + (d.x - 10) + "," + (d.y - 12) + ") scale(1.3)";
        // x and y are for position from center of the node and scale is for size of the icon
      });

      dashboard_icon.attr("transform", function (d) {
        let width = 50;
        if (d3.select("#label" + String(d.id)).size() !== 0) {
          width = d3
            .select("#label" + String(d.id))
            .node()
            .getBBox().width;
        }

        return "translate(" + (d.x - 10) + "," + (d.y - 12) + ") scale(1.5)";
      });

      sync_icon.attr("transform", function (d) {
        let width = 50;
        if (d3.select("#label" + String(d.id)).size() !== 0) {
          width = d3
            .select("#label" + String(d.id))
            .node()
            .getBBox().width;
        }
        return "translate(" + (d.x - 65) + "," + (d.y - 40) + ") scale(0.038)";
      });

      git_icon.attr("transform", function (d) {
        let width = 50;
        if (d3.select("#label" + String(d.id)).size() !== 0) {
          width = d3
            .select("#label" + String(d.id))
            .node()
            .getBBox().width;
        }
        if (d.syncStatus && d.syncStatus == "true") {
          return (
            "translate(" + (d.x - 65 + 23) + "," + (d.y - 41) + ") scale(0.6)"
          );
        } else {
          return "translate(" + (d.x - 65) + "," + (d.y - 41) + ") scale(0.6)";
        }
      });

      branch_dataset_icon.attr("transform", function (d) {
        let width = 50;
        if (d3.select("#label" + String(d.id)).size() !== 0) {
          width = d3
            .select("#label" + String(d.id))
            .node()
            .getBBox().width;
        }

        return "translate(" + (d.x - 38) + "," + (d.y - 19) + ") scale(0.7)";
      });

      arrow_outer_left_normal.attr("transform", function (d) {
        let width = 50;
        if (d3.select("#label" + String(d.id)).size() !== 0) {
          width = d3
            .select("#label" + String(d.id))
            .node()
            .getBBox().width;
        }
        return "translate(" + (d.x - 52) + "," + (d.y - 16) + ")";
      });

      arrow_outer_left_source.attr("transform", function (d) {
        let width = 50;
        if (d3.select("#label" + String(d.id)).size() !== 0) {
          width = d3
            .select("#label" + String(d.id))
            .node()
            .getBBox().width;
        }
        return "translate(" + (d.x - 52) + "," + (d.y - 16) + ")";
      });

      arrow_outer_left_chart.attr("transform", function (d) {
        let width = 50;
        if (d3.select("#label" + String(d.id)).size() !== 0) {
          width = d3
            .select("#label" + String(d.id))
            .node()
            .getBBox().width;
        }

        return "translate(" + (d.x - 42) + "," + (d.y - 16) + ")";
      });

      arrow_outer_left_dashboard.attr("transform", function (d) {
        let width = 50;
        if (d3.select("#label" + String(d.id)).size() !== 0) {
          width = d3
            .select("#label" + String(d.id))
            .node()
            .getBBox().width;
        }

        return "translate(" + (d.x - 42) + "," + (d.y - 16) + ")";
      });

      arrow_outer_right_normal.attr("transform", function (d) {
        let width = 50;
        if (d3.select("#label" + String(d.id)).size() !== 0) {
          width = d3
            .select("#label" + String(d.id))
            .node()
            .getBBox().width;
        }
        return "translate(" + (d.x + width + 18) + "," + (d.y - 16) + ")";
      });

      arrow_outer_right_source.attr("transform", function (d) {
        let width = 50;
        if (d3.select("#label" + String(d.id)).size() !== 0) {
          width = d3
            .select("#label" + String(d.id))
            .node()
            .getBBox().width;
        }
        return "translate(" + (d.x + width + 35) + "," + (d.y - 16) + ")";
      });

      arrow_outer_right_chart.attr("transform", function (d) {
        let width = 50;
        if (d3.select("#label" + String(d.id)).size() !== 0) {
          width = d3
            .select("#label" + String(d.id))
            .node()
            .getBBox().width;
        }
        return "translate(" + (d.x + width + 28) + "," + (d.y - 16) + ")";
      });

      arrow_outer_right_dashboard.attr("transform", function (d) {
        let width = 50;
        if (d3.select("#label" + String(d.id)).size() !== 0) {
          width = d3
            .select("#label" + String(d.id))
            .node()
            .getBBox().width;
        }
        return "translate(" + (d.x + width + 28) + "," + (d.y - 16) + ")";
      });
    }

    /*
     *
     *
     * Defs and Utility functions
     *
     *
     */

    //  Marker Def

    const defs = svg_ref
      .append("svg:defs")
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 0 12.4 12.4")
      .attr("refX", 10)
      .attr("refY", 6)
      .attr("orient", "auto")
      .attr("markerWidth", 12)
      .attr("markerHeight", 12)
      .append("svg:path")
      .attr("d", "M2,2 L10,6 L2,10 L2,2")
      .attr("fill", "var(--movetodata-font-color-muted)")
      .style("stroke", "none");

    const defs_selected = svg_ref
      .append("svg:defs")
      .append("marker")
      .attr("id", "arrowheadSelected")
      .attr("viewBox", "0 0 12.4 12.4")
      .attr("refX", 10)
      .attr("refY", 6)
      .attr("orient", "auto")
      .attr("markerWidth", 12)
      .attr("markerHeight", 12)
      .append("svg:path")
      .attr("d", "M2,2 L10,6 L2,10 L2,2")
      .attr("fill", "#FFBF00")
      .style("stroke", "none");

    const dropShadowFilter = defs
      .append("svg:filter")
      .attr("id", "drop-shadow");

    dropShadowFilter
      .append("svg:feGaussianBlur")
      .attr("in", "SourceGraphic") // SourceAlpha or SourceGraphic
      .attr("stdDeviation", 2)
      .attr("result", "blur");
    dropShadowFilter
      .append("svg:feColorMatrix")
      .attr("in", "blur")
      .attr("type", "hueRotate")
      .attr("values", 180)
      .attr("result", "color-out");
    dropShadowFilter
      .append("svg:feOffset")
      .attr("in", "blur")
      .attr("dx", 2)
      .attr("dy", 2)
      .attr("result", "offsetBlur");
    dropShadowFilter
      .append("svg:feBlend")
      .attr("in", "SourceGraphic")
      .attr("in2", "the-shadow")
      .attr("mode", "normal");

    // Curved Lines function

    function curved_lines(d) {
      let width = 117;
      if (d3.select("#label" + d.source.id).size() !== 0) {
        width = d3
          .select("#label" + d.source.id)
          .node()
          .getBBox().width;
      }

      if (d.source.type == "source") {
        width += 17;
      }

      const sourcex = d.source.x + width + 59,
        sourcey = d.source.y,
        targetx = d.target.x - 59,
        targety = d.target.y,
        path = d3.path();

      const spaceBetweenX = Math.abs(targetx - sourcex),
        spaceBetweenY = Math.abs(targety - sourcey),
        curveCalculation = Math.max(
          spaceBetweenX / 2,
          Math.min(spaceBetweenY, 80 * 2)
        ),
        controlPoint1 = {
          x: sourcex + curveCalculation,
          y: sourcey,
        },
        controlPoint2 = {
          x: targetx - curveCalculation,
          y: targety,
        };

      path.moveTo(sourcex, sourcey);

      path.bezierCurveTo(
        controlPoint1.x,
        controlPoint1.y,
        controlPoint2.x,
        controlPoint2.y,
        targetx,
        targety
      );

      // path.attr("stroke-dasharray", 50 + " " + 50)
      //     .attr("stroke-dashoffset", 50)
      //     .transition()
      //     .duration(1250)
      //     .attr("stroke-dashoffset", 0);

      return path;
    }

    /*
        Gird Background
        1. Dot Background
        2. Cross Lines Background

        // Dot Background
        function updateGrid(zoomEvent) {
            svg_ref.select('#dot-pattern')
                .attr('x', zoomEvent.transform.x)
                .attr('y', zoomEvent.transform.y)
                .attr('width', gridSize * zoomEvent.transform.k)
                .attr('height', gridSize * zoomEvent.transform.k)
                .selectAll('rect')
                .attr('x', (gridSize * zoomEvent.transform.k / 2) - (gridDotSize / 2))
                .attr('y', (gridSize * zoomEvent.transform.k / 2) - (gridDotSize / 2))
                .attr('opacity', Math.min(zoomEvent.transform.k, 1)); // Lower opacity as the pattern gets more dense.
        }
        */

    // Cross Lines Background
    function updateGrid(zoomEvent) {
      svg_ref
        .select("#grid-pattern")
        .attr("x", zoomEvent.transform.x)
        .attr("y", zoomEvent.transform.y)
        .attr("width", gridSize * zoomEvent.transform.k)
        .attr("height", gridSize * zoomEvent.transform.k)
        .selectAll("line")
        .attr("opacity", Math.min(zoomEvent.transform.k, 1)); // Lower opacity as the pattern gets more dense.
    }

    /*
     *
     *
     * Drag Events
     *
     *
     */

    const drag = d3
      .drag()
      .on("start", dragstart)
      .on("drag", dragged)
      .on("end", dragend);

    function dragstart(event, d) {
      d3.select(this).classed("bezier-grabbed", true);
    }

    function dragged(event, d) {
      div.style("opacity", 0);

      let flag = false;
      if (pipelineData.currentSelectedNode.id == d.id) {
        d3.select(this).raise();
        d.fx = event.x;
        d.fy = event.y;
      } else if (
        pipelineData.type == "children" &&
        pipelineData.currentSelectedNode.id == pipelineData.lastNode.id
      ) {
        let children = cur_graph.get(pipelineData.lastNode.id).children;

        let offsetx = event.x - d.fx;
        let offsety = event.y - d.fy;

        for (let child of children) {
          if (child.id == d.id) {
            flag = true;
            break;
          }
        }

        if (flag) {
          for (let child of children) {
            d3.select("#node" + child.id).raise();
            child.fx += offsetx;
            child.fy += offsety;
          }
        }
      } else if (
        pipelineData.type == "parent" &&
        pipelineData.currentSelectedNode.id == pipelineData.lastNode.id
      ) {
        let parents = cur_graph.get(pipelineData.lastNode.id).parents;

        let offsetx = event.x - d.fx;
        let offsety = event.y - d.fy;

        for (let parent of parents) {
          if (parent.id == d.id) {
            flag = true;
            break;
          }
        }
        if (flag) {
          for (let parent of parents) {
            d3.select("#node" + parent.id).raise();
            parent.fx += offsetx;
            parent.fy += offsety;
          }
        }
      }
      if (!flag) {
        d3.select(this).raise();
        d.fx = event.x;
        d.fy = event.y;
      }

      simulation.alpha(1).restart();
    }

    function dragend(event, d) {
      d3.select(this).classed("bezier-grabbed", false);
      nodes_pos_hash.set(d.id, d);
      div.style("opacity", 1);
    }

    /*
     *
     *
     * Zoom Event
     *
     *
     */

    function zoomToRect(rect) {
      // Bounds in local coordinates space:
      // var bounds = rect.getBBox();

      // // Corners of rect in local coordinate space:
      // var corners = [
      //     { x: bounds.x, y: bounds.y },
      //     { x: bounds.x + bounds.width, y: bounds.y },
      //     { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
      //     { x: bounds.x, y: bounds.y + bounds.height }
      // ];

      // // Reset transform:
      // // g_ref.attr("transform", "");

      // // relevant transform:
      // var t = rect.getCTM();

      // // Convert the points to global SVG coordainte space:
      // for (var i = 0; i < corners.length; i++) {
      //     var point = svg_ref.node().createSVGPoint();
      //     point.x = corners[i].x;
      //     point.y = corners[i].y;
      //     corners[i] = point.matrixTransform(t);
      // }

      // // get extents for x,y in global SVG space:
      // var x = d3.extent(corners, function (d) { return d.x; });
      // var y = d3.extent(corners, function (d) { return d.y; });
      // var w = x[1] - x[0];
      // var h = y[1] - y[0];
      // var k = scale(w, h, width, height);
      // // Offset to center feature:
      // var ox = (width - w * k) / 2;
      // var oy = (height - h * k) / 2;

      var newTransform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(2);

      svg_ref.call(zoom.transform, newTransform);
    }

    function focusSelectedNode() {
      const pos = nodes_pos_hash.get(pipelineData.currentSelectedNode.id);

      svg_ref
        .transition()
        .duration(2500)
        .call(
          zoom.transform,
          d3.zoomIdentity
            .translate(width / 2, height / 2)
            .scale(2.5)
            .translate(-pos.fx, -pos.fy)
        );
    }

    function ZoomToFit() {
      const box = g_ref.node().getBBox();
      // The subtraction is for padding
      const scale = Math.min(
        1,
        Math.min((width - 400) / box.width, (height - 400) / box.height)
      );
      // Reset transform.
      let transform = d3.zoomIdentity;
      // Center [0, 0].
      transform = transform.translate(width / 2, height / 2);
      // Apply scale.
      transform = transform.scale(scale);
      // Center elements.
      transform = transform.translate(
        -box.x - box.width / 2,
        -box.y - box.height / 2
      );
      zoom.transform(svg_ref.transition().duration(1500), transform);
    }

    function reset() {
      svg_ref
        .transition()
        .duration(750)
        .call(
          zoom.transform,
          d3.zoomIdentity,
          d3.zoomTransform(svg_ref.node()).invert([width / 2, height / 2])
        );
    }
    d3.select("#focus_selected_node").on("click", focusSelectedNode);
    d3.select("#zoom_to_fit").on("click", ZoomToFit);
    d3.select("#reset").on("click", reset);
    d3.select("#zoom_in").on("click", function () {
      zoom.scaleBy(svg_ref.transition().duration(750), 1.5);
    });
    d3.select("#zoom_out").on("click", function () {
      zoom.scaleBy(svg_ref.transition().duration(750), 0.75);
    });

    function zoomed(e) {
      g_ref.attr("transform", e.transform);
      svg_ref.select("rect").style("opacity", 1);

      svg_ref
        .select("rect")
        .transition()
        .duration(500)
        .delay(150)
        .style("opacity", 0);

      updateGrid(e);
    }

    const zoom = d3
      .zoom()
      .extent([
        [0, 0],
        [width, height],
      ])
      .scaleExtent([0.005, 10])
      .on("zoom", zoomed);

    /*
     *
     *
     * Calls
     *
     *
     */

    node_normal_group.call(drag);
    node_source_group.call(drag);
    node_chart_group.call(drag);
    node_dashboard_group.call(drag);
    svg_ref.call(zoom).on("dblclick.zoom", null);

    if (pipelineData.type == "initial") g_ref.transition().on("end", ZoomToFit);

    /*
     *
     *
     * Cleanup Function
     *
     *
     */

    return () => {
      /*
                TODO 
            1. Save the state on cloud while clean up

            */
      pattern.remove();
      family_info.remove();
      div.remove();
      sync_icon.remove();
      git_icon.remove();
      branch_dataset_icon.remove();

      node_normal_group.remove();
      node_source_group.remove();
      node_chart_group.remove();
      node_dashboard_group.remove();
    };
  }, [pipelineData]);

  return (
    <>
      <svg ref={svgref} height={"calc(100vh - 40px)"} width={"calc(100vw)"}>
        <g ref={gref} id="container">
          {" "}
        </g>
      </svg>
      {contextMenu.event != undefined && (
        <PipelineContextMenu
          event={contextMenu.event}
          record={contextMenu.record}
          dispatch={contextMenu.dispatch}
          id={contextMenu.id}
          buildexist={contextMenu.buildexist}
        />
      )}

      <div className="bezier-tools-top">
        <div className="bezier-tools-top-left">
          <div className="bezier-tools-top-left-icon">
            <Popover
              placement="bottom"
              content={getLanguageLabel("autoLayout")}
            >
              <MtdButton
                className="bezier-tools-top-left-btn"
                onClick={() =>
                  setPipelineData({
                    pipeline: pipelineData.pipeline,
                    currentSelectedNode: pipelineData.currentSelectedNode,
                    type: "initial",
                    flow: pipelineData.flow,
                    color: pipelineData.color,
                    repo_color: pipelineData.repo_color,
                    vis_color: pipelineData.vis_color,
                    colorLegend: pipelineData.colorLegend,
                    loading: pipelineData.loading,
                    lastNode: pipelineData.lastNode,
                  })
                }
                icon={<GraphIcon />}
                outlined
                icononly
              ></MtdButton>
            </Popover>
            {getLanguageLabel("layout")}
          </div>
          <div className="bezier-tools-top-left-icon">
            <Popover
              placement="bottom"
              content={getLanguageLabel("animateFlow")}
            >
              <MtdButton
                className="bezier-tools-top-left-btn"
                onClick={() =>
                  setPipelineData({
                    pipeline: pipelineData.pipeline,
                    currentSelectedNode: pipelineData.currentSelectedNode,
                    type: "flow",
                    flow: !pipelineData.flow,
                    color: pipelineData.color,
                    repo_color: pipelineData.repo_color,
                    vis_color: pipelineData.vis_color,
                    colorLegend: pipelineData.colorLegend,
                    loading: pipelineData.loading,
                    lastNode: pipelineData.lastNode,
                  })
                }
                // size="small"
                icon={<SharedIcon />}
                outlined
                icononly
              ></MtdButton>
            </Popover>
            {getLanguageLabel("flow")}
          </div>

          {pipelineData.currentSelectedNode.id ? (
            <div className="bezier-tools-top-left-icon">
              <Popover
                placement="bottom"
                content={getLanguageLabel("zoomToSelectedNode")}
              >
                <MtdButton
                  className="bezier-tools-top-left-btn"
                  // size="small"
                  id="focus_selected_node"
                  icon={<AddIcon />}
                  outlined
                  icononly
                ></MtdButton>
              </Popover>
              {getLanguageLabel("focus")}
            </div>
          ) : (
            <div className="bezier-tools-top-left-icon">
              <Popover
                placement="bottom"
                content={getLanguageLabel("nodeSelection")}
              >
                <MtdButton
                  className="bezier-tools-top-left-btn"
                  id="focus_selected_node"
                  icon={<AddIcon />}
                  outlined
                  icononly
                ></MtdButton>
              </Popover>
              {getLanguageLabel("focus")}
            </div>
          )}
          <div className="bezier-tools-top-left-icon">
            <Popover
              placement="right"
              content={getLanguageLabel("nodeSelection")}
            >
              <Dropdown
                overlay={
                  <Menu
                    onClick={({ key }) => {
                      if (key == "parent") {
                        setPipelineData({
                          pipeline: pipelineData.pipeline,
                          currentSelectedNode: pipelineData.currentSelectedNode,
                          type: "parent",
                          flow: pipelineData.flow,
                          color: pipelineData.color,
                          repo_color: repo_color,
                          vis_color: vis_color,
                          colorLegend: pipelineData.colorLegend,
                          loading: false,
                          lastNode: pipelineData.currentSelectedNode,
                        });
                      } else if (key == "children") {
                        setPipelineData({
                          pipeline: pipelineData.pipeline,
                          currentSelectedNode: pipelineData.currentSelectedNode,
                          type: "children",
                          flow: pipelineData.flow,
                          color: pipelineData.color,
                          repo_color: repo_color,
                          vis_color: vis_color,
                          colorLegend: pipelineData.colorLegend,
                          loading: false,
                          lastNode: pipelineData.currentSelectedNode,
                        });
                      }
                    }}
                  >
                    <Menu.Item key={"parent"}>
                      {getLanguageLabel("selectParents")}
                    </Menu.Item>
                    <Menu.Item key={"children"}>
                      {getLanguageLabel("selectChildren")}
                    </Menu.Item>
                  </Menu>
                }
              >
                <MtdButton
                  className="bezier-tools-top-left-btn"
                  icon={<PanIcon />}
                  outlined
                  icononly
                />
              </Dropdown>
            </Popover>
            {getLanguageLabel("select")}
          </div>
        </div>
        <div className="bezier-tools-top-right">
          <div className="bezier-tools-top-right-top">
            <div className="bezier-tools-top-right-color">
              {/* <Comments id={id} /> */}
              <Avatars link={`/topic/${id}`} />
            </div>
            <div className="bezier-tools-top-right-color">
              {/* <Popover placement="bottom" content={pipelineData.colorLegend ? 'Close Legend' : 'Open Legend'}> */}
              <MtdButton
                className="bezier-tools-top-left-btn"
                onClick={() =>
                  setPipelineData({
                    pipeline: pipelineData.pipeline,
                    currentSelectedNode: pipelineData.currentSelectedNode,
                    type: "flow",
                    flow: pipelineData.flow,
                    color: pipelineData.color,
                    repo_color: pipelineData.repo_color,
                    vis_color: pipelineData.vis_color,
                    colorLegend: !pipelineData.colorLegend,
                    loading: pipelineData.loading,
                    lastNode: pipelineData.lastNode,
                  })
                }
                // size="small"
                icon={
                  pipelineData.colorLegend ? (
                    <MapLegendIcon />
                  ) : (
                    <MapLegendIcon />
                  )
                }
                outlined
                icononly
              ></MtdButton>
              {/* </Popover> */}
              {getLanguageLabel("legend")}
            </div>
            <div className="bezier-tools-top-right-color">
              <Select
                style={{ width: 250 }}
                listHeight={528}
                onChange={(value) =>
                  setPipelineData({
                    pipeline: pipelineData.pipeline,
                    currentSelectedNode: pipelineData.currentSelectedNode,
                    type: "color",
                    flow: pipelineData.flow,
                    color: value,
                    repo_color: pipelineData.repo_color,
                    vis_color: pipelineData.vis_color,
                    colorLegend: pipelineData.colorLegend,
                    loading: pipelineData.loading,
                    lastNode: pipelineData.lastNode,
                  })
                }
                value={pipelineData.color}
              >
                <Select.OptGroup label="General">
                  <Select.Option value={"resource"}>
                    <div className="text-and-icon-center">
                      <AppIcon /> {getLanguageLabel("nodeType")}
                    </div>
                  </Select.Option>
                  <Select.Option value={"repo"}>
                    <div className="text-and-icon-center">
                      <CodeCellIcon /> {getLanguageLabel("repository")}
                    </div>
                  </Select.Option>
                  <Select.Option value={"project"}>
                    <div className="text-and-icon-center">
                      <ProjectIcon /> {getLanguageLabel("project")}
                    </div>
                  </Select.Option>
                  <Select.Option value={"folder"}>
                    <div className="text-and-icon-center">
                      <FolderIcon size={18} /> {getLanguageLabel("folder")}
                    </div>
                  </Select.Option>
                </Select.OptGroup>
                <Select.OptGroup label="Statstics">
                  <Select.Option value={"rows"}>
                    <div className="text-and-icon-center">
                      <FilterIcon /> {getLanguageLabel("rows")}
                    </div>
                  </Select.Option>
                  <Select.Option value={"columns"}>
                    <div className="text-and-icon-center">
                      <SortDescIcon /> {getLanguageLabel("columns")}
                    </div>
                  </Select.Option>
                  <Select.Option value={"files"}>
                    <div className="text-and-icon-center">
                      <DocsIcon /> {getLanguageLabel("files")}
                    </div>
                  </Select.Option>
                  <Select.Option value={"size"}>
                    <div className="text-and-icon-center">
                      <SingleValueIcon /> {getLanguageLabel("size")}
                    </div>
                  </Select.Option>
                </Select.OptGroup>
                <Select.OptGroup label="Status">
                  <Select.Option value={"build"}>
                    <div className="text-and-icon-center">
                      <BuildIcon /> {getLanguageLabel("buildStatus")}
                    </div>
                  </Select.Option>
                  <Select.Option value={"sync"}>
                    <div className="text-and-icon-center">
                      <DatabaseViewIcon /> {getLanguageLabel("syncStatus")}
                    </div>
                  </Select.Option>
                </Select.OptGroup>
              </Select>
              {getLanguageLabel("nodeColorOptions")}
            </div>
          </div>
          {pipelineData.colorLegend ? (
            (() => {
              if (pipelineData.color == "build") {
                return (
                  <div className="bezier-tools-top-right-bottom">
                    {color_type_count.build.get(SUCCESS) > 0 ? (
                      <div className="bezier-tools-top-right-bottom-row">
                        <div className="bezier-tools-top-right-bottom-row-cell">
                          <div
                            className="bezier-tools-top-right-bottom-row-cell-colorbox"
                            style={{ backgroundColor: "#77DD77" }}
                          ></div>
                          <div className="bezier-tools-top-right-bottom-row-cell-text">
                            {getLanguageLabel("succeeded")}
                          </div>
                          ({color_type_count.build.get(SUCCESS)})
                        </div>
                      </div>
                    ) : (
                      <></>
                    )}
                    {color_type_count.build.get(FAILED) > 0 ? (
                      <div className="bezier-tools-top-right-bottom-row">
                        <div className="bezier-tools-top-right-bottom-row-cell">
                          <div
                            className="bezier-tools-top-right-bottom-row-cell-colorbox"
                            style={{ backgroundColor: "#F88379" }}
                          ></div>
                          <div className="bezier-tools-top-right-bottom-row-cell-text">
                            {getLanguageLabel(FAILED)}
                          </div>
                          ({color_type_count.build.get(FAILED)})
                        </div>
                      </div>
                    ) : (
                      <></>
                    )}
                    {color_type_count.build.get(ABORTED) > 0 ? (
                      <div className="bezier-tools-top-right-bottom-row">
                        <div className="bezier-tools-top-right-bottom-row-cell">
                          <div
                            className="bezier-tools-top-right-bottom-row-cell-colorbox"
                            style={{ backgroundColor: "#F88379" }}
                          ></div>
                          <div className="bezier-tools-top-right-bottom-row-cell-text">
                            {getLanguageLabel(ABORTED)}
                          </div>
                          ({color_type_count.build.get(ABORTED)})
                        </div>
                      </div>
                    ) : (
                      <></>
                    )}
                    {color_type_count.build.get(CANCELLED) > 0 ? (
                      <div className="bezier-tools-top-right-bottom-row">
                        <div className="bezier-tools-top-right-bottom-row-cell">
                          <div
                            className="bezier-tools-top-right-bottom-row-cell-colorbox"
                            style={{ backgroundColor: "#FFBF00" }}
                          ></div>
                          <div className="bezier-tools-top-right-bottom-row-cell-text">
                            {getLanguageLabel(CANCELLED)}
                          </div>
                          ({color_type_count.build.get(CANCELLED)})
                        </div>
                      </div>
                    ) : (
                      <></>
                    )}
                    {color_type_count.build.get("Not Applicable") > 0 ? (
                      <div className="bezier-tools-top-right-bottom-row">
                        <div className="bezier-tools-top-right-bottom-row-cell">
                          <div
                            className="bezier-tools-top-right-bottom-row-cell-colorbox"
                            style={{ backgroundColor: "white" }}
                          ></div>
                          <div className="bezier-tools-top-right-bottom-row-cell-text">
                            {getLanguageLabel("notApplicable")}
                          </div>
                          ({color_type_count.build.get("Not Applicable")})
                        </div>
                      </div>
                    ) : (
                      <></>
                    )}
                  </div>
                );
              } else if (pipelineData.color == "resource") {
                return (
                  <div className="bezier-tools-top-right-bottom">
                    {color_type_count.resource.get("source") > 0 ? (
                      <div className="bezier-tools-top-right-bottom-row">
                        <div className="bezier-tools-top-right-bottom-row-cell">
                          <div
                            className="bezier-tools-top-right-bottom-row-cell-colorbox"
                            style={{ backgroundColor: "#ffffff" }}
                          ></div>
                          <div className="bezier-tools-top-right-bottom-row-cell-text">
                            <div className="text-and-icon-center">
                              <DataAgentsIcon color={"#FFAD99"} />
                              Source
                            </div>
                          </div>
                          ({color_type_count.resource.get("source")})
                        </div>
                      </div>
                    ) : (
                      <></>
                    )}

                    {color_type_count.resource.get("uploaded") > 0 ? (
                      <div className="bezier-tools-top-right-bottom-row">
                        <div className="bezier-tools-top-right-bottom-row-cell">
                          <div
                            className="bezier-tools-top-right-bottom-row-cell-colorbox"
                            style={{ backgroundColor: "#DFE3EE" }}
                          ></div>
                          <div className="bezier-tools-top-right-bottom-row-cell-text">
                            <div className="text-and-icon-center">
                              <UploadIcon />
                              {getLanguageLabel("uploaded")}
                            </div>
                          </div>
                          ({color_type_count.resource.get("uploaded")})
                        </div>
                      </div>
                    ) : (
                      <></>
                    )}
                    {color_type_count.resource.get("connect") > 0 ? (
                      <div className="bezier-tools-top-right-bottom-row">
                        <div className="bezier-tools-top-right-bottom-row-cell">
                          <div
                            className="bezier-tools-top-right-bottom-row-cell-colorbox"
                            style={{ backgroundColor: "#FFAD99" }}
                          ></div>
                          <div className="bezier-tools-top-right-bottom-row-cell-text">
                            <div className="text-and-icon-center">
                              <DataCellsIcon color={"#FFAD99"} />
                              {getLanguageLabel("connect")}
                            </div>
                          </div>
                          ({color_type_count.resource.get("connect")})
                        </div>
                      </div>
                    ) : (
                      <></>
                    )}
                    {color_type_count.resource.get("PYTHON") > 0 ? (
                      <div className="bezier-tools-top-right-bottom-row">
                        <div className="bezier-tools-top-right-bottom-row-cell">
                          <div
                            className="bezier-tools-top-right-bottom-row-cell-colorbox"
                            style={{ backgroundColor: "#FFD34E" }}
                          ></div>
                          <div className="bezier-tools-top-right-bottom-row-cell-text">
                            <div className="text-and-icon-center">
                              <CodeCellIcon color={"#FFD34E"} />
                              {getLanguageLabel("python")}
                            </div>
                          </div>
                          ({color_type_count.resource.get("PYTHON")})
                        </div>
                      </div>
                    ) : (
                      <></>
                    )}

                    {color_type_count.resource.get("SQL") > 0 ? (
                      <div className="bezier-tools-top-right-bottom-row">
                        <div className="bezier-tools-top-right-bottom-row-cell">
                          <div
                            className="bezier-tools-top-right-bottom-row-cell-colorbox"
                            style={{ backgroundColor: "#8ABBFF" }}
                          ></div>
                          <div className="bezier-tools-top-right-bottom-row-cell-text">
                            <div className="text-and-icon-center">
                              <DatabaseIcon color={"#8ABBFF"} />
                              SQL
                            </div>
                          </div>
                          ({color_type_count.resource.get("SQL")})
                        </div>
                      </div>
                    ) : (
                      <></>
                    )}

                    {color_type_count.resource.get("chart") > 0 ? (
                      <div className="bezier-tools-top-right-bottom-row">
                        <div className="bezier-tools-top-right-bottom-row-cell">
                          <div
                            className="bezier-tools-top-right-bottom-row-cell-colorbox"
                            style={{ backgroundColor: "#CABDFF" }}
                          ></div>
                          <div className="bezier-tools-top-right-bottom-row-cell-text">
                            <div className="text-and-icon-center">
                              <ChartIcon color={"#CABDFF"} />
                              {getLanguageLabel("chart")}
                            </div>
                          </div>
                          ({color_type_count.resource.get("chart")})
                        </div>
                      </div>
                    ) : (
                      <></>
                    )}

                    {color_type_count.resource.get("dashboard") > 0 ? (
                      <div className="bezier-tools-top-right-bottom-row">
                        <div className="bezier-tools-top-right-bottom-row-cell">
                          <div
                            className="bezier-tools-top-right-bottom-row-cell-colorbox"
                            style={{ backgroundColor: "#86CDF1" }}
                          ></div>
                          <div className="bezier-tools-top-right-bottom-row-cell-text">
                            <div className="text-and-icon-center">
                              <MonitorIcon color={"#86CDF1"} />
                              {getLanguageLabel("dashboard")}
                            </div>
                          </div>
                          ({color_type_count.resource.get("dashboard")})
                        </div>
                      </div>
                    ) : (
                      <></>
                    )}
                  </div>
                );
              } else if (pipelineData.color == "repo") {
                return (
                  <div className="bezier-tools-top-right-bottom">
                    {pipelineData.vis_color.repo.forEach((value, key) => {
                      repo_legend.push([value, key[1]]);
                    })}
                    {(() => {
                      if (color_type_count.repo.get("Not Applicable")) {
                        repo_legend.push(["Not Applicable", "white"]);
                      }
                      if (color_type_count.repo.get("Not Available")) {
                        repo_legend.push(["Not Available", "#F2ABA2"]);
                      }
                      let original_size = repo_legend.length;
                      let new_size = original_size;
                      if (original_size % 2 != 0) {
                        new_size = original_size - 1;
                      }

                      for (let index = 0; index < new_size; index += 2) {
                        rows.push(
                          <div className="bezier-tools-top-right-bottom-row">
                            <div className="bezier-tools-top-right-bottom-row-cell">
                              <div
                                className="bezier-tools-top-right-bottom-row-cell-colorbox"
                                style={{
                                  backgroundColor: repo_legend[index][1],
                                }}
                              ></div>
                              <div className="bezier-tools-top-right-bottom-row-cell-text">
                                {repo_legend[index][0]}
                              </div>
                              (
                              {color_type_count.repo.get(repo_legend[index][0])}
                              )
                            </div>

                            <div className="bezier-tools-top-right-bottom-row-cell">
                              <div
                                className="bezier-tools-top-right-bottom-row-cell-colorbox"
                                style={{
                                  backgroundColor: repo_legend[index + 1][1],
                                }}
                              ></div>
                              <div className="bezier-tools-top-right-bottom-row-cell-text">
                                {repo_legend[index + 1][0]}
                              </div>
                              (
                              {color_type_count.repo.get(
                                repo_legend[index + 1][0]
                              )}
                              )
                            </div>
                          </div>
                        );
                      }
                      if (original_size != new_size) {
                        rows.push(
                          <div className="bezier-tools-top-right-bottom-row">
                            <div className="bezier-tools-top-right-bottom-row-cell">
                              <div
                                className="bezier-tools-top-right-bottom-row-cell-colorbox"
                                style={{
                                  backgroundColor:
                                    repo_legend[original_size - 1][1],
                                }}
                              ></div>
                              <div className="bezier-tools-top-right-bottom-row-cell-text">
                                {repo_legend[original_size - 1][0]}
                              </div>
                              (
                              {color_type_count.repo.get(
                                repo_legend[original_size - 1][0]
                              )}
                              )
                            </div>
                          </div>
                        );
                      }
                    })()}
                    {rows.map((row) => row)}
                  </div>
                );
              } else if (pipelineData.color == "project") {
                return (
                  <div className="bezier-tools-top-right-bottom">
                    {pipelineData.vis_color.project.forEach((value, key) => {
                      project_legend.push([value, key[1]]);
                    })}
                    {(() => {
                      let original_size = project_legend.length;
                      let new_size = original_size;
                      if (original_size % 2 != 0) {
                        new_size = original_size - 1;
                      }

                      for (let index = 0; index < new_size; index += 2) {
                        rows.push(
                          <div className="bezier-tools-top-right-bottom-row">
                            <div className="bezier-tools-top-right-bottom-row-cell">
                              <div
                                className="bezier-tools-top-right-bottom-row-cell-colorbox"
                                style={{
                                  backgroundColor: project_legend[index][1],
                                }}
                              ></div>
                              <div className="bezier-tools-top-right-bottom-row-cell-text">
                                {project_legend[index][0]}
                              </div>
                              (
                              {color_type_count.project.get(
                                project_legend[index][0]
                              )}
                              )
                            </div>

                            <div className="bezier-tools-top-right-bottom-row-cell">
                              <div
                                className="bezier-tools-top-right-bottom-row-cell-colorbox"
                                style={{
                                  backgroundColor: project_legend[index + 1][1],
                                }}
                              ></div>
                              <div className="bezier-tools-top-right-bottom-row-cell-text">
                                {project_legend[index + 1][0]}
                              </div>
                              (
                              {color_type_count.project.get(
                                project_legend[index + 1][0]
                              )}
                              )
                            </div>
                          </div>
                        );
                      }
                      if (original_size != new_size) {
                        rows.push(
                          <div className="bezier-tools-top-right-bottom-row">
                            <div className="bezier-tools-top-right-bottom-row-cell">
                              <div
                                className="bezier-tools-top-right-bottom-row-cell-colorbox"
                                style={{
                                  backgroundColor:
                                    project_legend[original_size - 1][1],
                                }}
                              ></div>
                              <div className="bezier-tools-top-right-bottom-row-cell-text">
                                {project_legend[original_size - 1][0]}
                              </div>
                              (
                              {color_type_count.project.get(
                                project_legend[original_size - 1][0]
                              )}
                              )
                            </div>
                          </div>
                        );
                      }
                    })()}
                    {rows.map((row) => row)}
                  </div>
                );
              } else if (pipelineData.color == "folder") {
                return (
                  <div className="bezier-tools-top-right-bottom">
                    {pipelineData.vis_color.folder.forEach((value, key) => {
                      folder_legend.push([value, key[1]]);
                    })}
                    {(() => {
                      let original_size = folder_legend.length;
                      let new_size = original_size;
                      if (original_size % 2 != 0) {
                        new_size = original_size - 1;
                      }

                      for (let index = 0; index < new_size; index += 2) {
                        rows.push(
                          <div className="bezier-tools-top-right-bottom-row">
                            <div className="bezier-tools-top-right-bottom-row-cell">
                              <div
                                className="bezier-tools-top-right-bottom-row-cell-colorbox"
                                style={{
                                  backgroundColor: folder_legend[index][1],
                                }}
                              ></div>
                              <div className="bezier-tools-top-right-bottom-row-cell-text">
                                {folder_legend[index][0]}
                              </div>
                              (
                              {color_type_count.folder.get(
                                folder_legend[index][0]
                              )}
                              )
                            </div>

                            <div className="bezier-tools-top-right-bottom-row-cell">
                              <div
                                className="bezier-tools-top-right-bottom-row-cell-colorbox"
                                style={{
                                  backgroundColor: folder_legend[index + 1][1],
                                }}
                              ></div>
                              <div className="bezier-tools-top-right-bottom-row-cell-text">
                                {folder_legend[index + 1][0]}
                              </div>
                              (
                              {color_type_count.folder.get(
                                folder_legend[index + 1][0]
                              )}
                              )
                            </div>
                          </div>
                        );
                      }
                      if (original_size != new_size) {
                        rows.push(
                          <div className="bezier-tools-top-right-bottom-row">
                            <div className="bezier-tools-top-right-bottom-row-cell">
                              <div
                                className="bezier-tools-top-right-bottom-row-cell-colorbox"
                                style={{
                                  backgroundColor:
                                    folder_legend[original_size - 1][1],
                                }}
                              ></div>
                              <div className="bezier-tools-top-right-bottom-row-cell-text">
                                {folder_legend[original_size - 1][0]}
                              </div>
                              (
                              {color_type_count.folder.get(
                                folder_legend[original_size - 1][0]
                              )}
                              )
                            </div>
                          </div>
                        );
                      }
                    })()}
                    {rows.map((row) => row)}
                  </div>
                );
              } else if (pipelineData.color == "rows") {
                return (
                  <div className="bezier-tools-top-right-bottom">
                    {pipelineData.vis_color.rows.forEach((value, key) => {
                      rows_legend.push([value, key[1]]);
                    })}
                    {(() => {
                      let original_size = rows_legend.length;
                      let new_size = original_size;
                      if (original_size % 2 != 0) {
                        new_size = original_size - 1;
                      }

                      for (let index = 0; index < new_size; index += 2) {
                        rows.push(
                          <div className="bezier-tools-top-right-bottom-row">
                            <div className="bezier-tools-top-right-bottom-row-cell">
                              <div
                                className="bezier-tools-top-right-bottom-row-cell-colorbox"
                                style={{
                                  backgroundColor: rows_legend[index][1],
                                }}
                              ></div>
                              <div className="bezier-tools-top-right-bottom-row-cell-text">
                                {rows_legend[index][0]}
                              </div>
                              (
                              {color_type_count.rows.get(rows_legend[index][0])}
                              )
                            </div>

                            <div className="bezier-tools-top-right-bottom-row-cell">
                              <div
                                className="bezier-tools-top-right-bottom-row-cell-colorbox"
                                style={{
                                  backgroundColor: rows_legend[index + 1][1],
                                }}
                              ></div>
                              <div className="bezier-tools-top-right-bottom-row-cell-text">
                                {rows_legend[index + 1][0]}
                              </div>
                              (
                              {color_type_count.rows.get(
                                rows_legend[index + 1][0]
                              )}
                              )
                            </div>
                          </div>
                        );
                      }
                      if (original_size != new_size) {
                        rows.push(
                          <div className="bezier-tools-top-right-bottom-row">
                            <div className="bezier-tools-top-right-bottom-row-cell">
                              <div
                                className="bezier-tools-top-right-bottom-row-cell-colorbox"
                                style={{
                                  backgroundColor:
                                    rows_legend[original_size - 1][1],
                                }}
                              ></div>
                              <div className="bezier-tools-top-right-bottom-row-cell-text">
                                {rows_legend[original_size - 1][0]}
                              </div>
                              (
                              {color_type_count.rows.get(
                                rows_legend[original_size - 1][0]
                              )}
                              )
                            </div>
                          </div>
                        );
                      }
                    })()}
                    {rows.map((row) => row)}
                  </div>
                );
              } else if (pipelineData.color == "columns") {
                return (
                  <div className="bezier-tools-top-right-bottom">
                    {pipelineData.vis_color.columns.forEach((value, key) => {
                      columns_legend.push([value, key[1]]);
                    })}
                    {(() => {
                      let original_size = columns_legend.length;
                      let new_size = original_size;
                      if (original_size % 2 != 0) {
                        new_size = original_size - 1;
                      }

                      for (let index = 0; index < new_size; index += 2) {
                        rows.push(
                          <div className="bezier-tools-top-right-bottom-row">
                            <div className="bezier-tools-top-right-bottom-row-cell">
                              <div
                                className="bezier-tools-top-right-bottom-row-cell-colorbox"
                                style={{
                                  backgroundColor: columns_legend[index][1],
                                }}
                              ></div>
                              <div className="bezier-tools-top-right-bottom-row-cell-text">
                                {columns_legend[index][0]}
                              </div>
                              (
                              {color_type_count.columns.get(
                                columns_legend[index][0]
                              )}
                              )
                            </div>

                            <div className="bezier-tools-top-right-bottom-row-cell">
                              <div
                                className="bezier-tools-top-right-bottom-row-cell-colorbox"
                                style={{
                                  backgroundColor: columns_legend[index + 1][1],
                                }}
                              ></div>
                              <div className="bezier-tools-top-right-bottom-row-cell-text">
                                {columns_legend[index + 1][0]}
                              </div>
                              (
                              {color_type_count.columns.get(
                                columns_legend[index + 1][0]
                              )}
                              )
                            </div>
                          </div>
                        );
                      }
                      if (original_size != new_size) {
                        rows.push(
                          <div className="bezier-tools-top-right-bottom-row">
                            <div className="bezier-tools-top-right-bottom-row-cell">
                              <div
                                className="bezier-tools-top-right-bottom-row-cell-colorbox"
                                style={{
                                  backgroundColor:
                                    columns_legend[original_size - 1][1],
                                }}
                              ></div>
                              <div className="bezier-tools-top-right-bottom-row-cell-text">
                                {columns_legend[original_size - 1][0]}
                              </div>
                              (
                              {color_type_count.columns.get(
                                columns_legend[original_size - 1][0]
                              )}
                              )
                            </div>
                          </div>
                        );
                      }
                    })()}
                    {rows.map((row) => row)}
                  </div>
                );
              } else if (pipelineData.color == "files") {
                return (
                  <div className="bezier-tools-top-right-bottom">
                    {pipelineData.vis_color.files.forEach((value, key) => {
                      files_legend.push([value, key[1]]);
                    })}
                    {(() => {
                      let original_size = files_legend.length;
                      let new_size = original_size;
                      if (original_size % 2 != 0) {
                        new_size = original_size - 1;
                      }

                      for (let index = 0; index < new_size; index += 2) {
                        rows.push(
                          <div className="bezier-tools-top-right-bottom-row">
                            <div className="bezier-tools-top-right-bottom-row-cell">
                              <div
                                className="bezier-tools-top-right-bottom-row-cell-colorbox"
                                style={{
                                  backgroundColor: files_legend[index][1],
                                }}
                              ></div>
                              <div className="bezier-tools-top-right-bottom-row-cell-text">
                                {files_legend[index][0]}
                              </div>
                              (
                              {color_type_count.files.get(
                                files_legend[index][0]
                              )}
                              )
                            </div>

                            <div className="bezier-tools-top-right-bottom-row-cell">
                              <div
                                className="bezier-tools-top-right-bottom-row-cell-colorbox"
                                style={{
                                  backgroundColor: files_legend[index + 1][1],
                                }}
                              ></div>
                              <div className="bezier-tools-top-right-bottom-row-cell-text">
                                {files_legend[index + 1][0]}
                              </div>
                              (
                              {color_type_count.files.get(
                                files_legend[index + 1][0]
                              )}
                              )
                            </div>
                          </div>
                        );
                      }
                      if (original_size != new_size) {
                        rows.push(
                          <div className="bezier-tools-top-right-bottom-row">
                            <div className="bezier-tools-top-right-bottom-row-cell">
                              <div
                                className="bezier-tools-top-right-bottom-row-cell-colorbox"
                                style={{
                                  backgroundColor:
                                    files_legend[original_size - 1][1],
                                }}
                              ></div>
                              <div className="bezier-tools-top-right-bottom-row-cell-text">
                                {files_legend[original_size - 1][0]}
                              </div>
                              (
                              {color_type_count.files.get(
                                files_legend[original_size - 1][0]
                              )}
                              )
                            </div>
                          </div>
                        );
                      }
                    })()}
                    {rows.map((row) => row)}
                  </div>
                );
              } else if (pipelineData.color == "size") {
                return (
                  <div className="bezier-tools-top-right-bottom">
                    {pipelineData.vis_color.size.forEach((value, key) => {
                      size_legend.push([value, key[1]]);
                    })}
                    {(() => {
                      let original_size = size_legend.length;
                      let new_size = original_size;
                      if (original_size % 2 != 0) {
                        new_size = original_size - 1;
                      }

                      for (let index = 0; index < new_size; index += 2) {
                        rows.push(
                          <div className="bezier-tools-top-right-bottom-row">
                            <div className="bezier-tools-top-right-bottom-row-cell">
                              <div
                                className="bezier-tools-top-right-bottom-row-cell-colorbox"
                                style={{
                                  backgroundColor: size_legend[index][1],
                                }}
                              ></div>
                              <div className="bezier-tools-top-right-bottom-row-cell-text">
                                {size_legend[index][0]}
                              </div>
                              (
                              {color_type_count.size.get(size_legend[index][0])}
                              )
                            </div>

                            <div className="bezier-tools-top-right-bottom-row-cell">
                              <div
                                className="bezier-tools-top-right-bottom-row-cell-colorbox"
                                style={{
                                  backgroundColor: size_legend[index + 1][1],
                                }}
                              ></div>
                              <div className="bezier-tools-top-right-bottom-row-cell-text">
                                {size_legend[index + 1][0]}
                              </div>
                              (
                              {color_type_count.size.get(
                                size_legend[index + 1][0]
                              )}
                              )
                            </div>
                          </div>
                        );
                      }
                      if (original_size != new_size) {
                        rows.push(
                          <div className="bezier-tools-top-right-bottom-row">
                            <div className="bezier-tools-top-right-bottom-row-cell">
                              <div
                                className="bezier-tools-top-right-bottom-row-cell-colorbox"
                                style={{
                                  backgroundColor:
                                    size_legend[original_size - 1][1],
                                }}
                              ></div>
                              <div className="bezier-tools-top-right-bottom-row-cell-text">
                                {size_legend[original_size - 1][0]}
                              </div>
                              (
                              {color_type_count.size.get(
                                size_legend[original_size - 1][0]
                              )}
                              )
                            </div>
                          </div>
                        );
                      }
                    })()}
                    {rows.map((row) => row)}
                  </div>
                );
              } else if (pipelineData.color == "sync") {
                return (
                  <div className="bezier-tools-top-right-bottom">
                    {color_type_count.sync.get("true") > 0 ? (
                      <div className="bezier-tools-top-right-bottom-row">
                        <div className="bezier-tools-top-right-bottom-row-cell">
                          <div className="bezier-tools-top-right-bottom-row-cell-colorbox"></div>
                          <div className="bezier-tools-top-right-bottom-row-cell-text">
                            {getLanguageLabel("available")}
                          </div>
                          ({color_type_count.sync.get("true")})
                        </div>
                      </div>
                    ) : (
                      <></>
                    )}
                    {color_type_count.sync.get("false") > 0 ? (
                      <div className="bezier-tools-top-right-bottom-row">
                        <div className="bezier-tools-top-right-bottom-row-cell">
                          <div
                            className="bezier-tools-top-right-bottom-row-cell-colorbox"
                            style={{ backgroundColor: "#acc7df" }}
                          ></div>
                          <div className="bezier-tools-top-right-bottom-row-cell-text">
                            {getLanguageLabel("notAvailable")}
                          </div>
                          ({color_type_count.sync.get("false")})
                        </div>
                      </div>
                    ) : (
                      <></>
                    )}

                    {color_type_count.sync.get("Not Applicable") > 0 ? (
                      <div className="bezier-tools-top-right-bottom-row">
                        <div className="bezier-tools-top-right-bottom-row-cell">
                          <div
                            className="bezier-tools-top-right-bottom-row-cell-colorbox"
                            style={{ backgroundColor: "white" }}
                          ></div>
                          <div className="bezier-tools-top-right-bottom-row-cell-text">
                            {getLanguageLabel("notApplicable")}
                          </div>
                          ({color_type_count.sync.get("Not Applicable")})
                        </div>
                      </div>
                    ) : (
                      <></>
                    )}
                  </div>
                );
              }
            })()
          ) : (
            <></>
          )}
        </div>
      </div>

      <div className="bezier-tools-bottom">
        <div className="bezier-tools-bottom-left">
          {pipelineData.loading ? (
            <>
              <Skeleton.Input /> &nbsp;{getLanguageLabel("loading...")}&nbsp;
            </>
          ) : (
            <></>
          )}
          {pipelineData.currentSelectedNode.id == pipelineData.lastNode.id ? (
            <div style={{ color: "grey" }}>
              {nodes_hash.has(pipelineData.currentSelectedNode.id) ? (
                pipelineData.type == "children" ? (
                  nodes_hash.get(pipelineData.currentSelectedNode.id).children >
                  0 ? (
                    `${
                      nodes_hash.get(pipelineData.currentSelectedNode.id)
                        .children + 1
                    } ${getLanguageLabel("nodesSelected")}`
                  ) : (
                    `1 ${getLanguageLabel("nodeSelected")}`
                  )
                ) : nodes_hash.get(pipelineData.currentSelectedNode.id)
                    .parents > 0 ? (
                  `${
                    nodes_hash.get(pipelineData.currentSelectedNode.id)
                      .parents + 1
                  } ${getLanguageLabel("nodesSelected")}`
                ) : (
                  `1 ${getLanguageLabel("nodeSelected")}`
                )
              ) : (
                <div style={{ color: "grey" }}>
                  1 {getLanguageLabel("nodeSelected")}
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: "grey" }}>
              1 {getLanguageLabel("nodeSelected")}
            </div>
          )}
          &nbsp;
          {pipelineData.currentSelectedNode.name}
        </div>
        <div className="bezier-tools-bottom-right">
          <Popover placement="left" content={getLanguageLabel("fitToScreen")}>
            <MtdButton
              className="bezier-tools-bottom-right-btn"
              onClick={() =>
                setPipelineData({
                  pipeline: pipelineData.pipeline,
                  currentSelectedNode: pipelineData.currentSelectedNode,
                  type: "zoom",
                  flow: pipelineData.flow,
                  color: pipelineData.color,
                  repo_color: pipelineData.repo_color,
                  vis_color: pipelineData.vis_color,
                  colorLegend: pipelineData.colorLegend,
                  loading: pipelineData.loading,
                  lastNode: pipelineData.lastNode,
                })
              }
              id="zoom_to_fit"
              icon={<ZoomToFitIcon />}
              outlined
              icononly
            ></MtdButton>
          </Popover>

          <Popover placement="left" content={getLanguageLabel("zoomIn")}>
            <MtdButton
              className="bezier-tools-bottom-right-btn"
              onClick={() =>
                setPipelineData({
                  pipeline: pipelineData.pipeline,
                  currentSelectedNode: pipelineData.currentSelectedNode,
                  type: "zoom",
                  flow: pipelineData.flow,
                  color: pipelineData.color,
                  repo_color: pipelineData.repo_color,
                  vis_color: pipelineData.vis_color,
                  colorLegend: pipelineData.colorLegend,
                  loading: pipelineData.loading,
                  lastNode: pipelineData.lastNode,
                })
              }
              id="zoom_in"
              icon={<ZoomInIcon />}
              minimal
              icononly
            ></MtdButton>
          </Popover>

          <Popover placement="left" content={getLanguageLabel("zoomOut")}>
            <MtdButton
              className="bezier-tools-bottom-right-btn"
              onClick={() =>
                setPipelineData({
                  pipeline: pipelineData.pipeline,
                  currentSelectedNode: pipelineData.currentSelectedNode,
                  type: "zoom",
                  flow: pipelineData.flow,
                  color: pipelineData.color,
                  repo_color: pipelineData.repo_color,
                  vis_color: pipelineData.vis_color,
                  colorLegend: pipelineData.colorLegend,
                  loading: pipelineData.loading,
                  lastNode: pipelineData.lastNode,
                })
              }
              id="zoom_out"
              icon={<ZoomOutIcon />}
              icononly
              minimal
            ></MtdButton>
          </Popover>
        </div>
      </div>
    </>
  );
}
