import React, { useEffect, useState } from "react";
import { useParams } from "react-router";

import MtdLoader from "components/mtdLoader";
import { useSelector } from "react-redux";
import { RootState } from "redux/types/store";
import "../editor.scss";

interface IProps {
  pane: any;
}

const JupyterNotebook = ({ pane }: IProps) => {
  const { id: repoId } = useParams();
  const [notebookPath, setNotebookPath] = useState<string>();
  const { user } = useSelector((state: RootState) => state.userDetails);

  useEffect(() => {
    if (user && pane && repoId) {
      setNotebookPath(
        process.env.REACT_APP_BASE_URL +
          "/api/jupyter/lab/tree/" +
          user.id +
          "/" +
          repoId +
          "/" +
          pane?.path +
          "?token=pQ9mZ5T8v3JkL4nO7qW2HgF1dY6eUoI0RbXsCzV9AxG3BjP5EwM8SyD2LhN4cQ7r"
      );
    }
  }, [user, pane, repoId]);

  if (!notebookPath) {
    return <MtdLoader />;
  }

  return (
    <iframe height="100%" width="100%" src={notebookPath}>
      JupyterNotebook
    </iframe>
  );
};

export default JupyterNotebook;
