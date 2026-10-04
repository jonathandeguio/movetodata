package io.movetodata.snap.artifact.library.services;

import io.movetodata.snap.artifact.library.models.CheckUpdatesModel;
import org.springframework.stereotype.Component;

@Component
public class ArtifactService {

    public String getTagForComponent(CheckUpdatesModel model, String componentName) {
        switch (componentName) {
            case "boson":
                return model.getBoson();
            case "frontend":
                return model.getFrontend();
            case "movetodata-docs":
                return model.getMoveToDataDocs();
            default:
                return null; // Handle unknown component names
        }
    }

    public void setTagForComponent(CheckUpdatesModel model, String componentName, String tag) {
        switch (componentName) {
            case "boson":
                model.setBoson(tag);
                break;
            case "frontend":
                model.setFrontend(tag);
                break;
            case "movetodata-docs":
                model.setMoveToDataDocs(tag);
                break;
            default:
                // Handle unknown component names
                break;
        }
    }
}
