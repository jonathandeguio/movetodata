import { Dropdown, MenuProps } from "antd";
import {
  AddIcon,
  RefreshIcon,
  SearchIcon,
} from "assets/icons/mtdActionIcons";
import { ProjectIcon } from "assets/icons/mtdDataIcons";
import { SingleChevronDownIcon } from "assets/icons/mtdNavigationIcon";
import MtdButton from "components/MtdComponents/ButtonComponent/MtdButton";
import MtdInput from "components/MtdComponents/InputComponent/MtdInput";
import ProjectButton from "components/buttons/ProjectButton";
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, ThunkAppDispatch } from "redux/types/store";
import {
  fuzzyFilter,
  getLanguageLabel,
  isEmpty,
  notEmpty,
} from "utils/utilities";
import { listProjects } from "../../redux/actions/projectActions";

interface ProjectDropdownButtonProps {
  defaultProject?: string;
  onSelect: (id: string) => void;
  showNewButton: boolean;
  disable?: boolean;
}

export const ProjectDropdownButton: React.FC<ProjectDropdownButtonProps> = ({
  defaultProject,
  onSelect,
  showNewButton,
  disable = false,
}) => {
  const dispatch = useDispatch<ThunkAppDispatch>();
  const [project, setProject] = useState<any>(undefined);
  const gradients = [
    "linear-gradient(to right, #74c0fc, #e366ff)",
    "linear-gradient(to right, #ff97af, #ffce79)",
    "linear-gradient(to right, #ff8d87, #ffc39e)",
    "linear-gradient(to right, #5bb0ff, #83e0ff)",
    "linear-gradient(to right, #ffc957, #ffec85)",
    "linear-gradient(to right, #6e70f6, #a37ae3)",
    "linear-gradient(to right, #34d8e8, #2d8be2)",
    "linear-gradient(to right, #9e8eaf, #ff94b6)",
    "linear-gradient(to right, #ffd95b, #ffec85)",
    "linear-gradient(to right, #0ec7c0, #7ef9ff)",
    "linear-gradient(to right, #ff7373, #ffb07c)",
    "linear-gradient(to right, #51e3a4, #27d7f0)",
    "linear-gradient(to right, #ff93a8, #ffdc6b)",
    "linear-gradient(to right, #a0ff8c, #38c77a)",
    "linear-gradient(to right, #ff81b6, #ff5e62)",
    "linear-gradient(to right, #ffe647, #ffca49)",
    "linear-gradient(to right, #3abfbc, #5ac5cd)",
    "linear-gradient(to right, #dcb5e8, #ff85e6)",
    "linear-gradient(to right, #83a2d4, #97c5e9)",
    "linear-gradient(to right, #a9a0ff, #cab8ff)",
  ];

  const { projects, loading } = useSelector(
    (state: RootState) => state.projectList
  );

  const [searchText, setSearchText] = useState<string | undefined>(undefined);

  const items: MenuProps["items"] = useMemo(() => {
    if (notEmpty(projects)) {
      return [
        {
          key: "acd",
          label: (
            <div className="flex" style={{ gap: "10px" }}>
              <MtdInput
                onClick={(e) => {
                  e?.stopPropagation();
                }}
                onChange={(v) => {
                  setSearchText(v.target.value);
                }}
                placeholder={getLanguageLabel("search")}
                suffix={<SearchIcon />}
              ></MtdInput>
              <MtdButton
                onClick={(e: any) => {
                  e.preventDefault();

                  dispatch(listProjects());
                }}
                icon={<RefreshIcon />}
                icononly
                minimal
                borderless
                loading={loading}
                size="middle"
              >
                {getLanguageLabel("reloadProjects")}
              </MtdButton>
            </div>
          ),
        },
        ...(showNewButton
          ? [
              {
                key: "newProject",
                label: (
                  <ProjectButton>
                    <div
                      style={{
                        display: "flex",
                        width: "100%",
                      }}
                    >
                      <AddIcon />
                      {getLanguageLabel("newProject")}
                    </div>
                  </ProjectButton>
                ),
              },
            ]
          : []),

        ...projects
          .filter((p: any) =>
            notEmpty(searchText) ? fuzzyFilter(p.name, searchText) : true
          )
          .map((p: any, index: number) => ({
            key: p.id,
            label: (
              <div
                onClick={(id) => {
                  onSelect(p.id);
                  setProject(p);
                }}
              >
                {p.name}
              </div>
            ),
            icon: (
              <div
                style={{
                  background: gradients[19 - (index % 20)],
                  height: "20px",
                  minWidth: "20px",
                  margin: "0 5px 0 1px",
                  borderRadius: "3px",
                  textAlign: "center",
                  color: "white",
                  fontWeight: 900,
                }}
              >
                {p.name[0].toUpperCase()}
              </div>
            ),
          })),
      ];
    } else {
      return [];
    }
  }, [projects, showNewButton, searchText]);

  useEffect(() => {
    if (notEmpty(projects)) {
      const filtered = projects.find((p: any) => p.id === defaultProject);

      if (notEmpty(filtered) && isEmpty(project)) {
        setProject(filtered);
      } else if (notEmpty(projects) && isEmpty(project)) {
        setProject(projects[0]);
        onSelect(projects[0].id);
      }
    }

    return () => {
      setSearchText(undefined);
    };
  }, [defaultProject, projects]);

  return (
    <div className={`${disable ? "disabled_action" : ""}`}>
      {items && project && (
        <Dropdown
          trigger={["click"]}
          overlayClassName="project-dropdown"
          placement="bottomLeft"
          menu={{ items }}
          overlayStyle={{
            height: "40%",
            overflowY: "auto",
          }}
        >
          <MtdButton minimal>
            <div
              style={{
                display: "flex",
              }}
            >
              <ProjectIcon />
              <div className="project-dropdown__button">
                <div className="project-dropdown__button-text">
                  {project.name}
                </div>
                <SingleChevronDownIcon />
              </div>
            </div>
          </MtdButton>
        </Dropdown>
      )}
    </div>
  );
};
